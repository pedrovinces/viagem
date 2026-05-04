const LOCK_KEY = 'nv_unlocked';
const PWD_HASH = 'b73a63ed9a729595333238dcf806c7799b0102bce0ded2e696f9ca3257b2466d';

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function buildLockScreen() {
  const el = document.createElement('div');
  el.id = 'lock-screen';
  el.innerHTML = `
    <div class="lock-card">
      <div class="lock-ornament">✦</div>
      <h1 class="lock-title">Nossa <em>Viagem</em></h1>
      <p class="lock-sub">Pedro &amp; Clarice · Maio MMXXVI</p>
      <form id="lock-form" autocomplete="off">
        <input
          id="lock-input"
          type="password"
          placeholder="senha"
          autocomplete="current-password"
          spellcheck="false"
        />
        <button type="submit">Entrar</button>
        <p id="lock-error" aria-live="polite"></p>
      </form>
    </div>
  `;
  return el;
}

async function tryUnlock(password) {
  const hash = await sha256(password);
  return hash === PWD_HASH;
}

function removeLock(screen) {
  screen.classList.add('lock-fade-out');
  screen.addEventListener('transitionend', () => screen.remove(), { once: true });
}

export async function initLock() {
  if (sessionStorage.getItem(LOCK_KEY) === '1') return;

  const screen = buildLockScreen();
  document.body.appendChild(screen);

  // Prevent scroll/interaction on the app behind
  document.body.style.overflow = 'hidden';

  const form = screen.querySelector('#lock-form');
  const input = screen.querySelector('#lock-input');
  const error = screen.querySelector('#lock-error');

  // Focus after paint
  requestAnimationFrame(() => input.focus());

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ok = await tryUnlock(input.value.trim());
    if (ok) {
      sessionStorage.setItem(LOCK_KEY, '1');
      document.body.style.overflow = '';
      removeLock(screen);
    } else {
      error.textContent = 'Senha incorreta';
      input.value = '';
      input.focus();
      screen.querySelector('.lock-card').classList.add('lock-shake');
      screen.querySelector('.lock-card').addEventListener('animationend', () => {
        screen.querySelector('.lock-card').classList.remove('lock-shake');
      }, { once: true });
    }
  });
}
