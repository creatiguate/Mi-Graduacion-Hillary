/**
 * Configuración PÚBLICA. Este archivo se publica en GitHub Pages.
 * Nunca coloques aquí contraseñas, SUPABASE_SERVICE_ROLE_KEY ni TURNSTILE_SECRET_KEY.
 * Consulta README.md para habilitar la galería compartida.
 */
window.INVITATION_CONFIG = Object.freeze({
  galleryEndpoint: "", // https://TU-PROYECTO.supabase.co/functions/v1/graduation-gallery
  turnstileSiteKey: "", // Cloudflare Turnstile site key (pública)
  musicUrl: "./assets/audio/un-viaje-largo.mp3" // Archivo de audio proporcionado para esta invitación
});
