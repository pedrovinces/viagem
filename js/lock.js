/* ============================================================
   LOCK.JS — Tela de senha com PBKDF2 + rate limiting
   ============================================================
   Para gerar um novo hash da sua senha, abra o console do
   browser e execute:
     generateLockHash('suasenha').then(h => console.log(h))
   Cole o resultado como valor de PWD_HASH abaixo.
   ============================================================ */

const LOCK_KEY  = 'nv_unlocked';
const SALT      = 'nv-nossa-viagem-2026';
// Hash PBKDF2(100 000 iter, SHA-256) — use generateLockHash() para regen
const PWD_HASH  = 'ac4b6ee7c6239921fa1db34b6d454c81ac8bf861f554252d10e87adfb3d20ea1';

const MAX_ATTEMPTS  = 5;
const LOCKOUT_MS    = 30_000; // 30 s
let   attempts      = 0;
let   lockedUntil   = 0;

// Exposta globalmente para facilitar geração de novo hash no console
window.generateLockHash = pbkdf2Hash;

async function pbkdf2Hash(str) {
  const enc  = new TextEncoder();
  const key  = await crypto.subtle.importKey(
    'raw', enc.encode(str), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(SALT), iterations: 100_000, hash: 'SHA-256' },
    key, 256
  );
  return Array.from(new Uint8Array(bits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
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
  const hash = await pbkdf2Hash(password);
  return hash === PWD_HASH;
}

function removeLock(screen) {
  screen.classList.add('lock-fade-out');
  screen.addEventListener('transitionend', () => screen.remove(), { once: true });
}

export async function initLock() {
  // Restaurar visibilidade do body (oculto pelo pré-check inline no HTML)
  document.body.style.visibility = '';

  if (sessionStorage.getItem(LOCK_KEY) === '1') return;

  const screen = buildLockScreen();
  document.body.appendChild(screen);
  document.body.style.overflow = 'hidden';

  const form  = screen.querySelector('#lock-form');
  const input = screen.querySelector('#lock-input');
  const error = screen.querySelector('#lock-error');

  requestAnimationFrame(() => input.focus());

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Rate-limiting: bloquear após MAX_ATTEMPTS erros consecutivos
    if (Date.now() < lockedUntil) {
      const secs = Math.ceil((lockedUntil - Date.now()) / 1000);
      error.textContent = `Muitas tentativas. Aguarde ${secs}s.`;
      return;
    }

    const ok = await tryUnlock(input.value.trim());

    if (ok) {
      attempts = 0;
      sessionStorage.setItem(LOCK_KEY, '1');
      document.body.style.overflow = '';
      removeLock(screen);
    } else {
      attempts++;
      input.value = '';
      input.focus();

      const card = screen.querySelector('.lock-card');
      card.classList.add('lock-shake');
      card.addEventListener('animationend', () => card.classList.remove('lock-shake'), { once: true });

      if (attempts >= MAX_ATTEMPTS) {
        lockedUntil = Date.now() + LOCKOUT_MS;
        attempts    = 0;
        error.textContent = `Muitas tentativas. Tente novamente em 30s.`;
        input.disabled = true;
        setTimeout(() => {
          input.disabled = false;
          error.textContent = '';
          input.focus();
        }, LOCKOUT_MS);
      } else {
        error.textContent = `Senha incorreta (${MAX_ATTEMPTS - attempts} tentativa${MAX_ATTEMPTS - attempts !== 1 ? 's' : ''} restante${MAX_ATTEMPTS - attempts !== 1 ? 's' : ''})`;
      }
    }
  });
}

/** Verifica se o lock está ativo (sessionStorage limpo) e reinicia se necessário. */
export function checkLock() {
  if (sessionStorage.getItem(LOCK_KEY) !== '1') {
    // sessionStorage foi limpo (ex: DevTools) — reinicia o lock
    initLock();
    return false;
  }
  return true;
}
