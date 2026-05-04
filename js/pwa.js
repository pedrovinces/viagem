/* ============================================================
   PWA.JS — Service Worker + Install Prompt
   ============================================================ */

let deferredPrompt = null;

// ---- Registro do Service Worker ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        // Detectar atualização disponível
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateBanner(worker);
            }
          });
        });
      })
      .catch(err => console.warn('[SW] Falha no registro:', err));
  });
}

// ---- Banner de atualização ----
function showUpdateBanner(worker) {
  const banner = document.getElementById('update-banner');
  const btn = document.getElementById('update-btn');
  if (!banner || !btn) return;
  banner.classList.remove('hidden');
  btn.addEventListener('click', () => {
    worker.postMessage('skipWaiting');
    window.location.reload();
  });
}

// ---- Install Prompt (A2HS) ----
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  const prompt = document.getElementById('install-prompt');
  if (prompt) {
    // Mostrar só se nunca instalado
    const dismissed = localStorage.getItem('install-dismissed');
    if (!dismissed) {
      setTimeout(() => prompt.classList.remove('hidden'), 3000);
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const installBtn = document.getElementById('install-btn');
  const dismissBtn = document.getElementById('install-dismiss');
  const prompt = document.getElementById('install-prompt');

  installBtn?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      prompt?.classList.add('hidden');
    }
    deferredPrompt = null;
  });

  dismissBtn?.addEventListener('click', () => {
    prompt?.classList.add('hidden');
    localStorage.setItem('install-dismissed', '1');
  });
});

window.addEventListener('appinstalled', () => {
  document.getElementById('install-prompt')?.classList.add('hidden');
  deferredPrompt = null;
});
