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

  initVoices();
  renderShell();
  renderPhrases();
}

function renderShell() {
  section.innerHTML = `
    <div class="phrases-lang-toggle">
      <button class="lang-btn active" data-lang="it">🇮🇹 Italiano</button>
      <button class="lang-btn" data-lang="fr">🇫🇷 Francês</button>
    </div>
    <div class="phrases-search">
      <input type="search" id="phrases-search"
        placeholder="Buscar frases..." autocomplete="off" autocorrect="off" spellcheck="false">
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
    <div class="phrases-category">
      <div class="phrases-category-header">
        <span class="phrases-category-icon">${cat.icon || '💬'}</span>
        <span class="phrases-category-title">${cat.category}</span>
        <span class="phrases-category-count">${cat.phrases.length}</span>
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

  // Bind play buttons (TTS)
  body.querySelectorAll('.play-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = btn.dataset.text;
      const lang = btn.dataset.lang;
      speakPhrase(text, lang, btn);
    });
  });
}

let currentUtterance = null;
let currentPlayBtn = null;
let cachedVoices = [];

// Pré-carrega vozes assim que o módulo inicia (mobile precisa de voiceschanged)
function initVoices() {
  const synth = window.speechSynthesis;
  if (!synth) return;
  const load = () => {
    const v = synth.getVoices();
    if (v.length) cachedVoices = v;
  };
  load(); // Funciona sincronamente no desktop
  synth.addEventListener('voiceschanged', load); // Essencial para mobile
}

function pickVoice(lang) {
  const voices = cachedVoices.length ? cachedVoices : (window.speechSynthesis?.getVoices() || []);
  // Prioridade: correspondência exata → prefixo de língua → null
  return voices.find(v => v.lang === lang)
      || voices.find(v => v.lang.startsWith(lang.slice(0, 2)))
      || null;
}

function doSpeak(text, lang, btn) {
  const synth = window.speechSynthesis;
  if (!synth) return;

  if (currentPlayBtn === btn && synth.speaking) {
    synth.cancel();
    return;
  }
  if (synth.speaking) synth.cancel();
  if (currentPlayBtn) currentPlayBtn.classList.remove('is-playing');

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;   // Sempre definir lang — crítico para a pronúncia
  utterance.rate = 0.85;
  utterance.pitch = 1;

  const voice = pickVoice(lang);
  if (voice) utterance.voice = voice;

  utterance.onstart  = () => { btn.classList.add('is-playing'); currentPlayBtn = btn; };
  utterance.onend    = () => { btn.classList.remove('is-playing'); currentPlayBtn = null; };
  utterance.onerror  = () => { btn.classList.remove('is-playing'); currentPlayBtn = null; };

  currentUtterance = utterance;
  synth.speak(utterance);
}

function speakPhrase(text, lang, btn) {
  if (!window.speechSynthesis) return;

  // Se vozes ainda não carregaram (comum em mobile), aguarda evento
  if (cachedVoices.length === 0) {
    const freshVoices = window.speechSynthesis.getVoices();
    if (freshVoices.length > 0) {
      cachedVoices = freshVoices;
      doSpeak(text, lang, btn);
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        cachedVoices = window.speechSynthesis.getVoices();
        doSpeak(text, lang, btn);
      }, { once: true });
    }
  } else {
    doSpeak(text, lang, btn);
  }
}

function renderPhrase(p) {
  const lang = currentLang === 'it' ? 'it-IT' : 'fr-FR';
  const safeLocal = p.local.replace(/"/g, '&quot;');
  return `
    <div class="phrase-item">
      <div class="phrase-texts">
        <div class="phrase-pt">${p.pt}</div>
        <div class="phrase-local-row">
          <span class="phrase-local">${p.local}</span>
          <button class="play-btn" data-text="${safeLocal}" data-lang="${lang}" title="Ouvir pronúncia" aria-label="Ouvir ${p.pt}">
            <svg viewBox="0 0 10 10" fill="currentColor" aria-hidden="true"><polygon points="2,1 9,5 2,9"/></svg>
          </button>
        </div>
        ${p.phonetic ? `<div class="phrase-phonetic">[${p.phonetic}]</div>` : ''}
      </div>
      <button class="phrase-copy-btn" data-text="${safeLocal}" title="Copiar">⎘</button>
    </div>`;
}
