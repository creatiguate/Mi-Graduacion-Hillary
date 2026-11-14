/**
 * Supabase Edge Function: subida pública con cuota + álbum compartido.
 * Seguridad:
 *  - allowlist de Origin y método
 *  - 50 intentos/hora/IP hash (SQL, bloqueo atómico)
 *  - límites de peso, cabecera JPEG, dimensiones y eliminación de EXIF/metadatos
 *  - bucket PRIVADO; URLs firmadas solo para el álbum
 *  - RLS bloquea acceso directo; service_role únicamente en Edge Function
 *  - texto siempre renderizado con textContent en el navegador
 */
import { createClient } from 'npm:@supabase/supabase-js@2';

const bucket = 'graduation-photos';
const maximumFileBytes = 12 * 1024 * 1024;
const corsMethods = 'GET, POST, OPTIONS';
const allowedOrigins = new Set((Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map((s) => s.trim()).filter(Boolean));
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const hashSalt = Deno.env.get('IP_HASH_SALT') || '';
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

type ErrorPayload = { error: string };
function json(body: unknown, status = 200, origin = ''): Response {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, private, max-age=0',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Vary': 'Origin'
  });
  if (allowedOrigins.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', corsMethods);
    headers.set('Access-Control-Allow-Headers', 'content-type');
    headers.set('Access-Control-Max-Age', '600');
  }
  return new Response(JSON.stringify(body), { status, headers });
}
function fail(message: string, status: number, origin: string) { return json({ error: message } satisfies ErrorPayload, status, origin); }
function clientAddress(request: Request): string {
  // Usar cabeceras establecidas por el proxy de confianza de la plataforma.
  // El proxy debe sobrescribir (y no reenviar del cliente) X-Forwarded-For.
  return (request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown').trim().slice(0, 100);
}
async function ipHash(ip: string) {
  const bytes = new TextEncoder().encode(`${hashSalt}:${ip}`);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
function readU16(bytes: Uint8Array, offset: number) { return (bytes[offset] << 8) | bytes[offset + 1]; }
function scrubJpeg(original: Uint8Array): Uint8Array {
  // JPEG con SOI/EOI; se eliminan todos APPn/COM, incluidos EXIF, XMP, ICC/IPTC.
  if (original.length < 100 || original[0] !== 0xff || original[1] !== 0xd8 || original.at(-2) !== 0xff || original.at(-1) !== 0xd9) throw new Error('INVALID_IMAGE');
  const chunks: Uint8Array[] = [original.subarray(0, 2)];
  let position = 2, sawFrame = false, sawScan = false;
  while (position + 4 <= original.length) {
    if (original[position] !== 0xff) throw new Error('INVALID_IMAGE');
    let markerPosition = position + 1;
    while (original[markerPosition] === 0xff) markerPosition++;
    const marker = original[markerPosition];
    if (marker === 0xda) {
      const length = readU16(original, markerPosition + 1);
      if (length < 2 || markerPosition + 1 + length > original.length || !sawFrame) throw new Error('INVALID_IMAGE');
      chunks.push(original.subarray(position));
      sawScan = true;
      break;
    }
    if (marker === 0xd9 || marker === 0xd8 || marker === 0x00 || (marker >= 0xd0 && marker <= 0xd7)) throw new Error('INVALID_IMAGE');
    const length = readU16(original, markerPosition + 1);
    const end = markerPosition + 1 + length;
    if (length < 2 || end > original.length) throw new Error('INVALID_IMAGE');
    // JPEG SOF (baseline, progressive y variantes comunes)
    if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
      if (length < 8) throw new Error('INVALID_IMAGE');
      const height = readU16(original, markerPosition + 4);
      const width = readU16(original, markerPosition + 6);
      if (width < 16 || height < 16 || width > 9000 || height > 9000 || width * height > 40000000) throw new Error('INVALID_IMAGE');
      sawFrame = true;
    }
    const metadata = (marker >= 0xe0 && marker <= 0xef) || marker === 0xfe;
    if (!metadata) chunks.push(original.subarray(position, end));
    position = end;
  }
  if (!sawScan) throw new Error('INVALID_IMAGE');
  const length = chunks.reduce((n, item) => n + item.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}
async function listPhotos(origin: string) {
  const { data, error } = await supabase.from('graduation_photos')
    .select('id, guest_name, storage_path, created_at')
    .order('created_at', { ascending: false })
    .limit(48);
  if (error) { console.error('DB list error', error.code); return fail('No se pudo abrir la galería', 500, origin); }
  if (!data?.length) return json({ photos: [] }, 200, origin);
  const paths = data.map((record) => record.storage_path);
  const { data: signed, error: signError } = await supabase.storage.from(bucket).createSignedUrls(paths, 3600);
  if (signError) { console.error('Sign error', signError.message); return fail('No se pudo abrir la galería', 500, origin); }
  const photos = data.flatMap((record, index) => {
    const url = signed?.[index]?.signedUrl;
    return url ? [{ id: record.id, name: record.guest_name, created_at: record.created_at, url }] : [];
  });
  return json({ photos }, 200, origin);
}
async function uploadPhoto(request: Request, origin: string) {
  const declaredBytes = Number(request.headers.get('content-length') || '0');
  if (declaredBytes > maximumFileBytes + 120000) return fail('La fotografía optimizada supera los 12 MB permitidos', 413, origin);
  const type = request.headers.get('content-type') || '';
  if (!/^multipart\/form-data;\s*boundary=/i.test(type)) return fail('Formato de solicitud incorrecto', 415, origin);
  let form: FormData;
  try { form = await request.formData(); } catch { return fail('Solicitud inválida', 400, origin); }
  const name = String(form.get('name') || '').replace(/\s+/g, ' ').trim();
  const uploaded = form.get('photo');
  if (name.length < 2 || name.length > 36 || /[\x00-\x1f\x7f<>]/.test(name)) return fail('Nombre no válido', 400, origin);
  if (!(uploaded instanceof File) || uploaded.size < 100 || uploaded.size > maximumFileBytes || uploaded.type !== 'image/jpeg') return fail('Solo se permiten fotografías JPEG optimizadas de hasta 12 MB', 400, origin);
  const ip = clientAddress(request);
  const hashed = await ipHash(ip);
  const { data: slot, error: quotaError } = await supabase.rpc('reserve_graduation_upload_slot', { p_ip_hash: hashed });
  if (quotaError) { console.error('Quota error', quotaError.code); return fail('No se pudo validar el límite de subidas', 500, origin); }
  if (slot !== true) return fail('Límite de 50 fotos por hora alcanzado. Inténtalo más tarde', 429, origin);
  let scrubbed: Uint8Array;
  try { scrubbed = scrubJpeg(new Uint8Array(await uploaded.arrayBuffer())); }
  catch { return fail('La fotografía no tiene un formato JPEG válido', 415, origin); }
  const path = `2026/${crypto.randomUUID()}.jpg`;
  const { error: storageError } = await supabase.storage.from(bucket).upload(path, scrubbed, { contentType: 'image/jpeg', cacheControl: '3600', upsert: false });
  if (storageError) { console.error('Storage upload error', storageError.message); return fail('No se pudo guardar la fotografía', 500, origin); }
  const { error: insertError } = await supabase.from('graduation_photos').insert({ storage_path: path, guest_name: name, ip_hash: hashed, status: 'approved' });
  if (insertError) {
    console.error('DB insert error', insertError.code);
    await supabase.storage.from(bucket).remove([path]);
    return fail('No se pudo registrar la fotografía', 500, origin);
  }
  return json({ ok: true, status: 'approved', message: 'Foto añadida al álbum' }, 201, origin);
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin') || '';
  // Origin es una barrera CORS de navegadores, NO un mecanismo de autenticación.
  if (!allowedOrigins.has(origin)) return fail('Origen no autorizado', 403, '');
  if (!supabaseUrl || !serviceRoleKey || !hashSalt || hashSalt.length < 24) {
    console.error('Missing required configuration');
    return fail('La galería no está configurada en el servidor', 503, origin);
  }
  if (request.method === 'OPTIONS') return json({}, 200, origin);
  if (request.method === 'GET') return listPhotos(origin);
  if (request.method === 'POST') return uploadPhoto(request, origin);
  return fail('Método no admitido', 405, origin);
});
