/* Control independiente de apertura: nunca espera indefinidamente al video. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const opening = $('opening');
  const video = $('introVideo');
  const button = $('introStart');
  const skip = $('introSkip');
  const cta = $('openingCta');
  const loading = $('introLoading');
  const wait = $('introWait');
  const fill = $('introLine');
  const butterfly = $('introButterfly');
  const percent = $('introPercent');
  if (!opening || !video || !button || !skip) {
    document.querySelector('main')?.removeAttribute('inert');
    document.getElementById('header')?.removeAttribute('inert');
    return;
  }
  let finished = false;
  let activated = false;
  let safetyTimer = 0;
  let progressTimer = 0;
  document.body.classList.add('modal-open');
  const mainAtStart = $('invitacion');
  const headerAtStart = $('header');
  if (mainAtStart) mainAtStart.inert = true;
  if (headerAtStart) headerAtStart.inert = true;
  const finalize = () => {
    if (finished) return;
    finished = true;
    clearTimeout(safetyTimer);
    clearInterval(progressTimer);
    try { video.pause(); } catch { /* sin video */ }
    opening.classList.add('closed');
    opening.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    const main = $('invitacion');
    const header = $('header');
    if (main) main.inert = false;
    if (header) header.inert = false;
    window.__invitacionAbierta = true;
    window.scrollTo({ left: 0, top: 0, behavior: 'auto' });
    window.dispatchEvent(new CustomEvent('invitacion:abierta'));
  };
  const playLoader = () => {
    if (finished || !activated || loading.dataset.running) return;
    loading.dataset.running = 'true';
    loading.hidden = false;
    if (wait) wait.hidden = true;
    const initial = performance.now();
    const run = now => {
      if (finished) return;
      const p = Math.min(100, Math.round((now - initial) / 850 * 100));
      if (fill) fill.style.width = p + '%';
      if (butterfly) butterfly.style.left = p + '%';
      if (percent) percent.textContent = p + '%';
      if (p < 100) requestAnimationFrame(run);
      else setTimeout(finalize, 180);
    };
    requestAnimationFrame(run);
  };
  const start = () => {
    if (activated || finished) return;
    activated = true;
    cta.hidden = true;
    if (wait) wait.hidden = false;
    // Siempre arrancamos el temporizador ANTES de solicitar reproducción.
    // Así un iPhone con datos lentos no puede quedar atrapado en esta pantalla.
    safetyTimer = setTimeout(playLoader, 11500);
    video.muted = true;
    video.playsInline = true;
    try { video.load(); } catch { /* usar poster */ }
    try {
      const promise = video.play();
      if (promise && typeof promise.catch === 'function') promise.catch(playLoader);
    } catch { playLoader(); }
  };
  button.addEventListener('click', start);
  skip.addEventListener('click', finalize);
  video.addEventListener('playing', () => { if (wait) wait.hidden = true; });
  video.addEventListener('ended', playLoader);
  video.addEventListener('error', playLoader);
  // Si el usuario sigue en esta pantalla por mucho tiempo, se abre igual.
  setTimeout(() => { if (!activated && !finished) finalize(); }, 28000);
})();
