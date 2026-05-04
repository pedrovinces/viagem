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
  load();
  synth.addEventListener('voiceschanged', load);
}

/**
 * Seleciona a melhor voz para o idioma.
 * Prioridade: online+exata → local+exata → online+prefixo → local+prefixo
 * Vozes "online" (localService=false) têm qualidade superior nas plataformas móveis.
 */
function pickVoice(lang) {
  const voices = cachedVoices.length ? cachedVoices : (window.speechSynthesis?.getVoices() || []);
  const prefix = lang.slice(0, 2); // 'fr' de 'fr-FR'

  const exact   = voices.filter(v => v.lang === lang);
  const partial = voices.filter(v => v.lang !== lang && v.lang.startsWith(prefix + '-'));

  // Ordem: online/premium antes, local/compacto depois
  const ranked = [
    ...exact.filter(v => !v.localService),
    ...exact.filter(v =>  v.localService),
    ...partial.filter(v => !v.localService),
    ...partial.filter(v =>  v.localService),
  ];

  return ranked[0] || null;
}

/** Mostra um toast com instruções quando nenhuma voz nativa foi encontrada */
function showNoVoiceToast(lang) {
  const existing = document.getElementById('no-voice-toast');
  if (existing) { existing.remove(); }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const langName = lang.startsWith('fr') ? 'francesa' : 'italiana';
  const langLabel = lang.startsWith('fr') ? 'Francês' : 'Italiano';

  const instructions = isIOS
    ? `Baixe a voz ${langLabel} em: Ajustes → Acessibilidade → Conteúdo falado → Idiomas`
    : `Baixe o pacote de voz ${langLabel} nas configurações do Android → Acessibilidade → Texto para voz`;

  const toast = document.createElement('div');
  toast.id = 'no-voice-toast';
  toast.className = 'no-voice-toast';
  toast.innerHTML = `
    <span class="no-voice-icon">🔇</span>
    <div class="no-voice-body">
      <strong>Voz ${langName} não encontrada</strong>
      <p>${instructions}</p>
    </div>
    <button class="no-voice-close" aria-label="Fechar">✕</button>`;

  toast.querySelector('.no-voice-close').addEventListener('click', () => toast.remove());
  section.appendChild(toast);
  setTimeout(() => toast?.remove(), 9000);
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

  const voice = pickVoice(lang);

  // Se não há voz para o idioma, avisa o usuário e não toca (evita falar errado)
  if (!voice) {
    showNoVoiceToast(lang);
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang  = lang;
  utterance.voice = voice;
  utterance.rate  = lang.startsWith('fr') ? 0.82 : 0.85; // Francês ligeiramente mais lento
  utterance.pitch = 1;

  utterance.onstart  = () => { btn.classList.add('is-playing'); currentPlayBtn = btn; };
  utterance.onend    = () => { btn.classList.remove('is-playing'); currentPlayBtn = null; };
  utterance.onerror  = () => { btn.classList.remove('is-playing'); currentPlayBtn = null; };

  currentUtterance = utterance;
  synth.speak(utterance);
}

function speakPhrase(text, lang, btn) {
  if (!window.speechSynthesis) return;

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
