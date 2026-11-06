-- G A L E R Í A  D E  H I L L A R Y
-- Ejecutar mediante Supabase migrations o SQL Editor en el proyecto privado.
-- El navegador nunca debe tener la SUPABASE_SERVICE_ROLE_KEY.
create extension if not exists pgcrypto;

create table if not exists public.graduation_photos (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null check (char_length(guest_name) between 2 and 36),
  storage_path text not null unique,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists graduation_photos_public_idx on public.graduation_photos(status, created_at desc);
alter table public.graduation_photos enable row level security;
revoke all on public.graduation_photos from anon, authenticated;
-- Cero políticas para anon/authenticated: sin lecturas, ediciones ni subida directa.
-- La Edge Function usa service_role solo en el servidor.

create table if not exists public.graduation_upload_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists graduation_upload_attempts_idx on public.graduation_upload_attempts(ip_hash, created_at desc);
alter table public.graduation_upload_attempts enable row level security;
revoke all on public.graduation_upload_attempts from anon, authenticated;

-- Reserva atómica: máximo 4 intentos de subida por IP-hash y hora.
-- El hash se calcula con un secreto de servidor, nunca guardamos IP en claro.
create or replace function public.reserve_graduation_upload_slot(p_ip_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare recent_count integer;
begin
  if p_ip_hash is null or length(p_ip_hash) <> 64 then
    return false;
  end if;
  perform pg_advisory_xact_lock(hashtext(p_ip_hash));
  select count(*) into recent_count
  from public.graduation_upload_attempts
  where ip_hash = p_ip_hash and created_at > now() - interval '1 hour';
  if recent_count >= 4 then return false; end if;
  insert into public.graduation_upload_attempts(ip_hash) values (p_ip_hash);
  return true;
end;
$$;
revoke all on function public.reserve_graduation_upload_slot(text) from public, anon, authenticated;
grant execute on function public.reserve_graduation_upload_slot(text) to service_role;

-- Bucket privado: jamás habilitar public = true.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('graduation-photos', 'graduation-photos', false, 5242880, array['image/jpeg'])
on conflict (id) do update
set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg'];

-- Nunca crear políticas de INSERT/SELECT públicas sobre storage.objects.
-- Para aprobar fotos: Table Editor > graduation_photos > status = approved.
-- Para eliminarlas definitivamente: borrar objeto en Storage y fila de tabla.
