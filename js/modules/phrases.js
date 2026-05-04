/* ============================================================
   PHRASES.JS — Frasebook italiano/francês com busca e cópia
   ============================================================ */

const section = document.getElementById('section-phrases');
let allPhrases = { it: [], fr: [] };
let currentLang = 'it';
let searchQuery = '';

export async function init(data) {
  if (!section) return;

  try {
    const [it, fr] = await Promise.all([
      fetch('./data/phrases-it.json').then(r => r.json()),
      fetch('./data/phrases-fr.json').then(r => r.json()),
    ]);
    allPhrases = { it, fr };
  } catch (e) {
    console.error('[Phrases] Erro ao carregar frases:', e);
    return;
  }

  renderShell();
  renderPhrases();
}

function renderShell() {
  section.innerHTML = `
    <div class="phrases-header">
      <div class="phrases-lang-toggle">
        <button class="lang-btn active" data-lang="it">🇮🇹 Italiano</button>
        <button class="lang-btn" data-lang="fr">🇫🇷 Francês</button>
      </div>
      <div class="phrases-search-wrap">
        <input type="search" id="phrases-search" class="phrases-search"
          placeholder="Buscar frases..." autocomplete="off" autocorrect="off">
      </div>
    </div>
    <div id="phrases-body" class="phrases-body"></div>`;

  section.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      section.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentLang = btn.dataset.lang;
      searchQuery = '';
      const inp = document.getElementById('phrases-search');
      if (inp) inp.value = '';
      renderPhrases();
    });
  });

  document.getElementById('phrases-search')?.addEventListener('input', e => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderPhrases();
  });
}

function renderPhrases() {
  const body = document.getElementById('phrases-body');
  if (!body) return;

  const langData = allPhrases[currentLang] || [];

  let filtered;
  if (searchQuery) {
    filtered = langData.map(cat => ({
      ...cat,
      phrases: cat.phrases.filter(p =>
        p.pt.toLowerCase().includes(searchQuery) ||
        p.local.toLowerCase().includes(searchQuery) ||
        (p.phonetic || '').toLowerCase().includes(searchQuery)
      ),
    })).filter(cat => cat.phrases.length > 0);
  } else {
    filtered = langData;
  }

  if (!filtered.length) {
    body.innerHTML = `<div class="phrases-empty">Nenhuma frase encontrada para "<strong>${searchQuery}</strong>"</div>`;
    return;
  }

  body.innerHTML = filtered.map(cat => `
    <div class="phrase-category">
      <div class="phrase-category-header">
        <span class="phrase-category-icon">${cat.icon || '💬'}</span>
        <span class="phrase-category-name">${cat.category}</span>
        <span class="phrase-category-count">${cat.phrases.length}</span>
      </div>
      <div class="phrase-list">
        ${cat.phrases.map(p => renderPhrase(p)).join('')}
      </div>
    </div>`).join('');

  // Bind copy buttons
  body.querySelectorAll('.phrase-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.text;
      navigator.clipboard?.writeText(text).then(() => {
        btn.textContent = '✓';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = '⎘'; btn.classList.remove('copied'); }, 1500);
      });
    });
  });
}

function renderPhrase(p) {
  return `
    <div class="phrase-item">
      <div class="phrase-pt">${p.pt}</div>
      <div class="phrase-local">${p.local}</div>
      ${p.phonetic ? `<div class="phrase-phonetic">[${p.phonetic}]</div>` : ''}
      <button class="phrase-copy-btn" data-text="${p.local}" title="Copiar">⎘</button>
    </div>`;
}
