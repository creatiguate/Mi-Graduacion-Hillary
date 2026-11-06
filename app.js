/* Hillary · Invitación 2026
 * Sitio estático sin framework. No contiene llaves privadas.
 * Las fotos compartidas SOLO se reciben a través de Supabase Edge Function,
 * que verifica captcha, cuota, tipo de archivo y moderación antes de mostrarlas.
 */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const cfg = window.INVITATION_CONFIG || {};
  const galleryEndpoint = String(cfg.galleryEndpoint || '').trim().replace(/\/+$/, '');
  const siteKey = String(cfg.turnstileSiteKey || '').trim();
  const isLocalDemo = !galleryEndpoint;
  const validEndpoint = (() => {
    try { const u = new URL(galleryEndpoint); return u.protocol === 'https:' && /\/(functions\/v1\/graduation-gallery)$/.test(u.pathname); }
    catch { return false; }
  })();
  const hasSharedGallery = validEndpoint && Boolean(siteKey);
  const eventDate = new Date('2026-11-28T18:00:00-06:00').getTime();

  // Cada carga comienza en el inicio de la invitación, aunque el navegador
  // recuerde la posición de desplazamiento o la URL haya conservado un ancla.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (location.hash) {
    history.replaceState(null, '', location.pathname + location.search);
  }
  window.scrollTo(0, 0);
  window.addEventListener('load', () => window.scrollTo(0, 0), { once: true });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) window.scrollTo(0, 0);
  });

  // La apertura se controla en opening.js, separado para que incluso
  // si falla la galería o la música la invitación nunca se quede bloqueada.
  const opening = $('#opening');
  const main = $('#invitacion');
  const header = $('#header');
  const introVideo = $('#introVideo');
  const musicPlayer = $('#musicPlayer');
  const musicToggle = $('#audioToggle');
  const musicUrl = typeof cfg.musicUrl === 'string' ? cfg.musicUrl.trim() : '';
  let introComplete = false;
  function newId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    const bytes = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
    const hex = [...bytes].map((n) => n.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  }
  let notificationTimer;
  function notify(message) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(notificationTimer);
    notificationTimer = setTimeout(() => toast.classList.remove('show'), 5100);
  }
  function onInvitationOpen() {
    if (introComplete) return;
    introComplete = true;
    window.scrollTo(0, 0);
    // El navegador puede impedir audio automático incluso después de un toque.
    // El control de música permanece disponible como alternativa.
    if (musicUrl) {
      try { musicPlayer.currentTime = 0; } catch { /* Solo si ya hay datos. */ }
      musicPlayer.muted = false;
      musicPlayer.volume = 0.55;
      musicPlayer.play().then(updateMusicButton).catch(() => {
        updateMusicButton();
        notify('Si deseas escuchar la canción, toca el botón de música.');
      });
    }
    startButterflies();
  }
  window.addEventListener('invitacion:abierta', onInvitationOpen);
  if (window.__invitacionAbierta) onInvitationOpen();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion && 'IntersectionObserver' in window) {
    document.body.classList.add('motion-ready');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px 50px 0px' });
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
  } else document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
  let scrollTick = false;
  window.addEventListener('scroll', () => {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      $('#readingProgress').style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
      scrollTick = false;
    });
  }, { passive: true });

  function updateCountdown() {
    const diff = Math.max(0, eventDate - Date.now());
    const values = [
      Math.floor(diff / 86400000),
      Math.floor((diff % 86400000) / 3600000),
      Math.floor((diff % 3600000) / 60000),
      Math.floor((diff % 60000) / 1000)
    ];
    ['#cdDays', '#cdHours', '#cdMinutes', '#cdSeconds'].forEach((id, i) => {
      $(id).textContent = String(values[i]).padStart(2, '0');
    });
    if (diff === 0) $('.countdown-label').textContent = '¡LLEGÓ EL GRAN DÍA!';
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  let toastTimeout;
  function legacyNotify(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 5200);
  }
  const eventMap = 'https://www.google.com/maps/search/?api=1&query=Hotel%20El%20Campo%20Flores%20Costa%20Cuca';
  $('#calendarButton').addEventListener('click', () => {
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CreatiGuate//Hillary Graduation//ES',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      `UID:hillary-graduacion-20261128@${location.hostname || 'invitacion.local'}`,
      'DTSTAMP:20261106T180000Z', 'DTSTART:20261129T000000Z',
      'DTEND:20261129T020000Z',
      'SUMMARY:Graduación de Hillary Verally Pérez González',
      'LOCATION:Hotel El Campo\\, Flores Costa Cuca\\, Quetzaltenango',
      'DESCRIPTION:¡Celebremos juntos la graduación de Hillary!\\n' + eventMap,
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'Graduacion-Hillary-28-Noviembre-2026.ics';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    notify('Evento descargado. Ábrelo para agregarlo a tu calendario.');
  });
  // Confirmación de asistencia mediante mensaje prellenado de WhatsApp.
  // Este formulario no tiene backend y nunca envía los datos sin intervención del invitado.
  const rsvpForm = $('#rsvpForm');
  rsvpForm.addEventListener('change', (event) => {
    if (event.target.name !== 'attendance') return;
    $('#rsvpPeopleBox').hidden = event.target.value === 'no';
  });
  rsvpForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const nameInput = $('#rsvpName');
    const name = nameInput.value.replace(/\s+/g, ' ').trim();
    if (name.length < 2 || name.length > 70 || /[\x00-\x1f\x7f<>]/.test(name)) {
      nameInput.focus(); notify('Escribe tu nombre completo para confirmar.'); return;
    }
    const attendance = rsvpForm.querySelector('input[name="attendance"]:checked')?.value;
    if (!['si', 'no'].includes(attendance)) { notify('Elige si podrás acompañarnos.'); return; }
    const people = Number.parseInt($('#rsvpPeople').value, 10);
    if (attendance === 'si' && (!Number.isInteger(people) || people < 1 || people > 6)) {
      notify('Indica el número de personas que asistirán.'); return;
    }
    const note = $('#rsvpMessage').value.replace(/\s+/g, ' ').trim().slice(0, 220);
    const lines = [
      '¡Hola! Quiero confirmar mi respuesta para la graduación de Hillary Verally Pérez González 🎓',
      '',
      `Nombre: ${name}`,
      `Asistencia: ${attendance === 'si' ? 'Sí, asistiré' : 'No podré asistir'}`,
      ...(attendance === 'si' ? [`Personas que asistirán (incluyéndome): ${people}`] : []),
      ...(note ? [`Mensaje para Hillary: ${note}`] : []),
      '', 'Graduación: sábado 28 de noviembre de 2026, 6:00 p. m.'
    ];
    const url = 'https://wa.me/50233402375?text=' + encodeURIComponent(lines.join('\n'));
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.append(link);
    link.click();
    link.remove();
    notify('Abre WhatsApp y pulsa «Enviar» para confirmar tu respuesta.');
  });

  // Música proporcionada para la invitación. El autor debe contar con permiso de publicación.
  if (musicUrl && !/^\s*(javascript|data):/i.test(musicUrl)) {
    musicPlayer.src = musicUrl;
    musicToggle.hidden = false;
    musicPlayer.addEventListener('error', () => notify('No se pudo cargar el audio. Revisa musicUrl en config.js.'));
  }
  function updateMusicButton() {
    const isPlaying = !musicPlayer.paused && !musicPlayer.muted;
    musicToggle.classList.toggle('playing', isPlaying);
    $('#audioState').textContent = isPlaying ? 'Pausar música' : 'Reproducir música';
    musicToggle.setAttribute('aria-label', isPlaying ? 'Pausar música' : 'Reproducir música');
  }
  async function playMusic() {
    if (!musicUrl) return;
    if (musicPlayer.paused || musicPlayer.muted) {
      musicPlayer.muted = false;
      musicPlayer.volume = 0.55;
      if (musicPlayer.paused) await musicPlayer.play();
    } else musicPlayer.pause();
    updateMusicButton();
  }
  musicPlayer.addEventListener('play', updateMusicButton);
  musicPlayer.addEventListener('pause', updateMusicButton);
  musicToggle.addEventListener('click', () => playMusic().catch(() => notify('No se pudo reproducir la música. Vuelve a intentarlo.')));

  // Los controles nativos de música son la alternativa cuando Safari
  // o Chrome no permiten reproducción automática al terminar la apertura.

  // Mariposas reales del proyecto que cruzan la pantalla suavemente.
  // Nacen de forma intermitente: máximo 1-2 a la vez en celular.
  let butterflyTimer = 0;
  let butterflyCount = 0;
  function startButterflies() {
    if (reducedMotion || butterflyTimer) return;
    const layer = $('#flyingButterflies');
    if (!layer) return;
    const emit = () => {
      if (document.hidden) return;
      const mobile = window.innerWidth < 760;
      if (layer.childElementCount >= (mobile ? 1 : 2)) return;
      const img = document.createElement('img');
      const fromLeft = butterflyCount % 2 === 0;
      butterflyCount++;
      img.src = `./assets/images/mariposa ${butterflyCount % 3 === 0 ? 1 : 2}.gif`;
      img.alt = '';
      img.className = `butterfly-fly ${fromLeft ? 'fly-right' : 'fly-left'}`;
      const low = 17 + (butterflyCount * 19) % 47;
      img.style.setProperty('--fly-y', `${low}vh`);
      img.style.setProperty('--fly-size', `${mobile ? 52 : 68 + (butterflyCount % 3) * 12}px`);
      img.style.setProperty('--fly-duration', `${mobile ? 12500 : 15200}ms`);
      layer.append(img);
      const remove = () => img.remove();
      img.addEventListener('animationend', remove, { once: true });
      window.setTimeout(remove, 18000);
    };
    window.setTimeout(emit, 1800);
    butterflyTimer = window.setInterval(emit, 12500);
  }

  function createRequestTimeout(ms) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return { signal: controller.signal, clear: () => clearTimeout(timer) };
  }

  // Galería con moderación en producción; en demo usa IndexedDB SOLO en este navegador.
  const photoWall = $('#photoWall');
  const galleryCount = $('#galleryCount');
  const galleryEmpty = $('#galleryEmpty');
  let currentPhotoBlob = null;
  let previewUrl = null;
  let wallUrls = [];
  let pendingPhotos = [];
  let approvedPhotos = [];
  let turnstileToken = '';
  let turnstileWidget = null;
  let isSubmitting = false;
  const modeNote = $('#galleryModeNote');
  if (isLocalDemo) {
    modeNote.textContent = 'Galería en modo de demostración: las fotografías se guardan únicamente en este dispositivo y todavía no son visibles para los demás invitados.';
  } else if (!hasSharedGallery) {
    modeNote.textContent = 'La galería compartida aún no está lista: revisa galleryEndpoint y turnstileSiteKey en config.js.';
    $('#submitPhoto').disabled = true;
  } else {
    modeNote.textContent = 'Las fotos enviadas se revisan antes de aparecer públicamente en el álbum.';
    setupTurnstile();
  }
  $('#cameraButton').addEventListener('click', openCamera);
  $('#chooseButton').addEventListener('click', () => $('#filePicker').click());
  $('#filePicker').addEventListener('change', async (e) => { if (e.target.files?.[0]) await onSelectedFile(e.target.files[0]); e.target.value = ''; });
  $('#cameraPicker').addEventListener('change', async (e) => { if (e.target.files?.[0]) await onSelectedFile(e.target.files[0]); e.target.value = ''; });
  $('#removePhoto').addEventListener('click', clearSelectedPhoto);

  async function onSelectedFile(file) {
    if (!file || !/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type) && !/\.(heic|heif|jpg|jpeg|png|webp)$/i.test(file.name || '')) {
      notify('Selecciona una foto JPG, PNG, WebP o HEIC compatible con tu navegador.'); return;
    }
    if (file.size > 12 * 1024 * 1024) { notify('La foto original pesa más de 12 MB. Elige una más pequeña.'); return; }
    try {
      const output = await optimizeImage(file);
      clearSelectedPhoto();
      currentPhotoBlob = output;
      previewUrl = URL.createObjectURL(output);
      $('#previewImage').src = previewUrl;
      $('#uploadPreview').hidden = false;
      notify('¡Qué bonita! Pon tu nombre y añádela al álbum.');
    } catch { notify('No se pudo procesar esta foto. Prueba con JPG o PNG.'); }
  }
  function clearSelectedPhoto() {
    currentPhotoBlob = null;
    $('#uploadPreview').hidden = true;
    $('#previewImage').removeAttribute('src');
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null; }
  }
  async function optimizeImage(file) {
    let source;
    let tempUrl;
    try {
      if ('createImageBitmap' in window) {
        try { source = await createImageBitmap(file); } catch { /* Por ejemplo, HEIC en Safari: usar Image. */ }
      }
      if (!source) {
        tempUrl = URL.createObjectURL(file);
        source = await new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = tempUrl; });
      }
      if (!source.width || !source.height || source.width * source.height > 45000000) throw new Error('Dimensiones no admitidas');
      const ratio = Math.min(1, 1600 / Math.max(source.width, source.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(source.width * ratio));
      canvas.height = Math.max(1, Math.round(source.height * ratio));
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('Canvas no disponible');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(new Error('No se pudo codificar')), 'image/jpeg', .82));
      if (blob.size > 5 * 1024 * 1024) throw new Error('La foto optimizada excede el límite');
      return blob;
    } finally {
      if (source?.close) source.close();
      if (tempUrl) URL.revokeObjectURL(tempUrl);
    }
  }
  async function setupTurnstile() {
    try {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => {
        if (!window.turnstile) { notify('No se cargó la verificación de seguridad.'); return; }
        turnstileWidget = window.turnstile.render('#turnstileMount', {
          sitekey: siteKey,
          theme: 'light',
          callback: (token) => { turnstileToken = token; },
          'expired-callback': () => { turnstileToken = ''; },
          'error-callback': () => { turnstileToken = ''; }
        });
      };
      script.onerror = () => notify('No se pudo cargar la verificación. Revisa tu conexión a internet.');
      document.head.append(script);
    } catch { notify('No fue posible iniciar la protección contra spam.'); }
  }

  $('#uploadForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSubmitting || (!isLocalDemo && !hasSharedGallery)) return;
    const guestName = $('#guestName').value.replace(/\s+/g, ' ').trim();
    if (guestName.length < 2 || guestName.length > 36 || /[\x00-\x1f\x7f<>]/.test(guestName)) { notify('Escribe tu nombre (entre 2 y 36 caracteres).'); $('#guestName').focus(); return; }
    if (!currentPhotoBlob) { notify('Primero toma o selecciona una fotografía.'); return; }
    if (!$('#photoConsent').checked) { notify('Debes aceptar la publicación de tu foto para continuar.'); return; }
    if (hasSharedGallery && !turnstileToken) { notify('Completa la verificación de seguridad antes de enviar.'); return; }
    isSubmitting = true;
    $('#submitPhoto').disabled = true;
    $('#submitPhoto').firstChild.textContent = 'Enviando fotografía… ';
    try {
      if (isLocalDemo) {
        await addLocalPhoto({ id: newId(), name: guestName, blob: currentPhotoBlob, created_at: new Date().toISOString() });
        await loadGallery();
        notify('¡Foto añadida a la demostración! Solo aparece en este navegador.');
      } else {
        const data = new FormData();
        data.append('photo', new File([currentPhotoBlob], 'recuerdo.jpg', { type: 'image/jpeg' }));
        data.append('name', guestName);
        data.append('turnstileToken', turnstileToken);
        const uploadTimeout = createRequestTimeout(25000);
        const response = await fetch(galleryEndpoint, { method: 'POST', body: data, cache: 'no-store', mode: 'cors', referrerPolicy: 'no-referrer', signal: uploadTimeout.signal });
        uploadTimeout.clear();
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || `No se pudo subir (${response.status})`);
        pendingPhotos.unshift({ id: newId(), name: guestName, blob: currentPhotoBlob, pending: true, created_at: new Date().toISOString() });
        renderPhotos([...pendingPhotos, ...approvedPhotos]);
        notify('¡Foto recibida! Se muestra como vista previa; será visible para todos cuando la aprueben.');
      }
      clearSelectedPhoto();
      $('#uploadForm').reset();
    } catch (error) {
      notify(error?.message === 'The operation was aborted due to timeout' ? 'La conexión tardó demasiado. Intenta de nuevo.' : (error?.message || 'No se pudo guardar la foto. Inténtalo de nuevo.'));
    } finally {
      isSubmitting = false;
      $('#submitPhoto').disabled = !isLocalDemo && !hasSharedGallery;
      $('#submitPhoto').firstChild.textContent = 'Añadir al álbum ';
      if (hasSharedGallery) {
        turnstileToken = '';
        if (window.turnstile && turnstileWidget !== null) window.turnstile.reset(turnstileWidget);
      }
    }
  });

  async function loadGallery() {
    const btn = $('#refreshGallery');
    btn.disabled = true;
    try {
      if (isLocalDemo) {
        const records = await readLocalPhotos();
        approvedPhotos = records.map((p) => ({ ...p, local: true }));
      } else if (hasSharedGallery) {
        const galleryTimeout = createRequestTimeout(15000);
        const response = await fetch(`${galleryEndpoint}?action=list`, { method: 'GET', cache: 'no-store', mode: 'cors', referrerPolicy: 'no-referrer', signal: galleryTimeout.signal });
        galleryTimeout.clear();
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !Array.isArray(data.photos)) throw new Error(data.error || 'No se pudo cargar el álbum');
        const serviceOrigin = new URL(galleryEndpoint).origin;
        approvedPhotos = data.photos.filter((p) => {
          try { return typeof p.id === 'string' && typeof p.name === 'string' && new URL(p.url).origin === serviceOrigin && new URL(p.url).protocol === 'https:'; }
          catch { return false; }
        }).slice(0, 48);
      }
      renderPhotos([...pendingPhotos, ...approvedPhotos]);
    } catch { notify('No se pudo actualizar la galería. Comprueba tu conexión y vuelve a intentar.'); }
    finally { btn.disabled = false; }
  }
  $('#refreshGallery').addEventListener('click', loadGallery);

  function renderPhotos(photos) {
    wallUrls.forEach((url) => URL.revokeObjectURL(url));
    wallUrls = [];
    photoWall.replaceChildren();
    galleryEmpty.hidden = photos.length > 0;
    galleryCount.textContent = `${photos.length} ${photos.length === 1 ? 'FOTO' : 'FOTOS'}`;
    for (const item of photos) {
      const card = document.createElement('div');
      card.className = `photo-polaroid${item.pending ? ' pending' : ''}`;
      const img = document.createElement('img');
      img.alt = `Recuerdo compartido por ${item.name}`;
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      if (item.blob) {
        const url = URL.createObjectURL(item.blob);
        wallUrls.push(url); img.src = url;
      } else img.src = item.url;
      const caption = document.createElement('div');
      caption.className = 'photo-caption';
      caption.textContent = item.name.slice(0, 36);
      card.append(img, caption);
      if (item.pending) {
        const status = document.createElement('small');
        status.className = 'photo-status';
        status.textContent = 'Pendiente de aprobación · solo tú la ves';
        card.append(status);
      }
      photoWall.append(card);
    }
  }

  // Persistencia local para pruebas sin backend. Nunca equivale a una galería pública.
  let memoryFallback = [];
  function openLocalDB() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB no disponible'));
      const request = indexedDB.open('hillary-graduacion-demo-v1', 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('photos')) request.result.createObjectStore('photos', { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function addLocalPhoto(record) {
    try {
      const db = await openLocalDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction('photos', 'readwrite');
        tx.objectStore('photos').put(record);
        tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
      });
      db.close();
    } catch {
      memoryFallback.unshift(record);
      notify('El navegador no permite guardar las fotos: permanecerán solo hasta cerrar esta página.');
    }
  }
  async function readLocalPhotos() {
    let records = [];
    try {
      const db = await openLocalDB();
      records = await new Promise((resolve, reject) => {
        const req = db.transaction('photos', 'readonly').objectStore('photos').getAll();
        req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
      });
      db.close();
    } catch { /* Demo temporal en memoria si IndexedDB está bloqueado */ }
    return [...records, ...memoryFallback].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 35);
  }

  // Cámara real con getUserMedia, cambio de lente y alternativa nativa móvil.
  const cameraModal = $('#cameraModal');
  const cameraVideo = $('#cameraVideo');
  let cameraStream = null;
  let facingMode = 'environment';
  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Cámara no disponible');
    cameraStream?.getTracks().forEach((track) => track.stop());
    cameraStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 1600 } } });
    cameraVideo.srcObject = cameraStream;
    await cameraVideo.play();
  }
  async function openCamera() {
    cameraModal.hidden = false;
    document.body.classList.add('modal-open');
    main.inert = true; header.inert = true; musicToggle.inert = true;
    $('#closeCamera').focus();
    try { await startCamera(); }
    catch { closeCamera(); notify('No se pudo abrir la cámara en vivo; prueba con la cámara del teléfono.'); $('#cameraPicker').click(); }
  }
  function closeCamera() {
    cameraStream?.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    cameraVideo.srcObject = null;
    cameraModal.hidden = true;
    if (opening.classList.contains('closed')) { document.body.classList.remove('modal-open'); main.inert = false; header.inert = false; musicToggle.inert = false; }
    $('#cameraButton').focus({ preventScroll: true });
  }
  $('#closeCamera').addEventListener('click', closeCamera);
  cameraModal.addEventListener('click', (event) => { if (event.target === cameraModal) closeCamera(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !cameraModal.hidden) closeCamera(); });
  $('#switchCamera').addEventListener('click', async () => {
    facingMode = facingMode === 'environment' ? 'user' : 'environment';
    try { await startCamera(); } catch { notify('No se encontró otra cámara en el dispositivo.'); }
  });
  $('#snapPhoto').addEventListener('click', async () => {
    const width = cameraVideo.videoWidth;
    const height = cameraVideo.videoHeight;
    if (!width || !height) return notify('La cámara todavía se está iniciando.');
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    canvas.getContext('2d').drawImage(cameraVideo, 0, 0, width, height);
    try {
      const blob = await new Promise((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Captura fallida')), 'image/jpeg', .9));
      closeCamera();
      await onSelectedFile(new File([blob], 'camara.jpg', { type: 'image/jpeg' }));
      $('#guestName').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    } catch { notify('No se pudo capturar la imagen. Vuelve a intentarlo.'); }
  });

  loadGallery();
})();
