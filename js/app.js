/* ============================================================
   APP.JS — Roteador principal, tema, módulos
   ============================================================ */

import { initLock } from './lock.js';

// ---- Importação lazy dos módulos ----
const MODULES = {
  agenda:       () => import('./modules/agenda.js'),
  map:          () => import('./modules/map.js'),
  transport:    () => import('./modules/transport.js'),
  phrases:      () => import('./modules/phrases.js'),
  weather:      () => import('./modules/weather.js'),
  religion:     () => import('./modules/religion.js'),
  destinations: () => import('./modules/destinations.js'),
  documents:    () => import('./modules/documents.js'),
};

const initialized = new Set();

// ---- Dados globais ----
let itinerary = null;

async function loadItinerary() {
  if (itinerary) return itinerary;
  const res = await fetch('./data/itinerary.json');
  itinerary = await res.json();
  return itinerary;
}

// Expor globalmente para módulos
window.App = {
  getItinerary: loadItinerary,
  openModal,
  closeModal,
};

// ---- Roteador de hash ----
function getSection() {
  const hash = location.hash.slice(1);
  return MODULES[hash] ? hash : 'agenda';
}

async function navigate(section) {
  // Esconder todas as seções
  document.querySelectorAll('.app-section').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  // Mostrar seção alvo
  const el = document.getElementById(`section-${section}`);
  if (el) el.classList.add('active');

  // Marcar nav item
  const navItem = document.querySelector(`.nav-item[data-section="${section}"]`);
  if (navItem) navItem.classList.add('active');

  // Botão voltar: visível em todas as seções exceto agenda
  const backBtn = document.getElementById('back-btn');
  if (backBtn) backBtn.hidden = (section === 'agenda');

  // Atualizar header
  updateHeader(section);

  // Inicializar módulo (uma só vez)
  if (!initialized.has(section) && MODULES[section]) {
    initialized.add(section);
    try {
      const mod = await MODULES[section]();
      const data = await loadItinerary();
      await mod.init(data);
    } catch (err) {
      console.error(`[App] Erro ao inicializar módulo "${section}":`, err);
    }
  }

  // Fechar drawer se estiver aberto
  closeDrawer();
}

function updateHeader(section) {
  // Header is now editorial/static — no dynamic label needed
}

// ---- Listeners de navegação ----
window.addEventListener('hashchange', () => navigate(getSection()));

document.addEventListener('DOMContentLoaded', async () => {
  // Inicializar lock (PBKDF2 — substitui implementação SHA-256 inline removida do HTML)
  await initLock();

  // Inicializar tema
  initTheme();

  // Navegar para seção inicial
  navigate(getSection());

  // Evento: links de nav
  document.querySelectorAll('.nav-item[data-section], .drawer-item[data-section]').forEach(el => {
    el.addEventListener('click', e => {
      const section = el.dataset.section;
      if (section) {
        e.preventDefault();
        location.hash = section;
      }
    });
  });

  // Botão voltar → agenda
  document.getElementById('back-btn')?.addEventListener('click', () => {
    location.hash = 'agenda';
  });

  // Botão "Mais"
  document.getElementById('more-btn')?.addEventListener('click', toggleDrawer);
  document.getElementById('drawer-backdrop')?.addEventListener('click', closeDrawer);

  // Modal
  document.getElementById('modal-backdrop')?.addEventListener('click', closeModal);
  document.getElementById('modal-close')?.addEventListener('click', closeModal);

  // Fechar modal com Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
});

// ---- MORE DRAWER ----
function toggleDrawer() {
  const drawer = document.getElementById('more-drawer');
  const btn = document.getElementById('more-btn');
  const open = drawer.classList.toggle('open');
  drawer.setAttribute('aria-hidden', !open);
  btn.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

function closeDrawer() {
  const drawer = document.getElementById('more-drawer');
  const btn = document.getElementById('more-btn');
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  btn?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

// ---- MODAL ----
function openModal(htmlContent) {
  const modal = document.getElementById('event-modal');
  const content = document.getElementById('modal-content');
  if (!modal || !content) return;
  content.innerHTML = htmlContent;
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('event-modal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// ---- TEMA ----
function initTheme() {
  const saved = localStorage.getItem('theme');
  const theme = saved || 'light';
  applyTheme(theme);

  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  document.getElementById('drawer-theme-toggle')?.addEventListener('click', () => {
    toggleTheme();
    closeDrawer();
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#1a1410' : '#8b1e1e');

  // Ícone no drawer
  const dayIcon  = document.querySelector('.theme-icon-day');
  const nightIcon = document.querySelector('.theme-icon-night');
  if (dayIcon)   dayIcon.style.display  = theme === 'dark' ? 'none' : 'inline';
  if (nightIcon) nightIcon.style.display = theme === 'dark' ? 'inline' : 'none';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  applyTheme(next);
}

// ---- UTILITÁRIOS GLOBAIS ----
window.formatDate = function(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
};

window.formatDateShort = function(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
};

window.cityColor = function(cityId) {
  const colors = { rome: '#8b1e1e', florence: '#8b1e1e', assisi: '#6b5c4f', paris: '#8b1e1e' };
  return colors[cityId] || '#8b1e1e';
};

window.cityName = function(cityId) {
  const names = { rome: 'Roma', florence: 'Florença', assisi: 'Assis', paris: 'Paris' };
  return names[cityId] || cityId;
};

window.cityFlag = function(cityId) {
  const flags = { rome: '🇮🇹', florence: '🇮🇹', assisi: '🇮🇹', paris: '🇫🇷' };
  return flags[cityId] || '';
};

window.eventIcon = function(type) {
  const icons = {
    flight:   '✈️',
    hotel:    '🏨',
    transfer: '🚆',
    metro:    '🚇',
    walk:     '🚶',
    visit:    '🏛️',
    church:   '⛪',
    museum:   '🖼️',
    meal:     '🍽️',
    restaurant: '🍽️',
    ticket:   '🎟️',
    mass:     '✝️',
    tomb:     '🕊️',
    'free-time': '☀️',
    shopping: '🛍️',
    viewpoint: '📸',
    garden:   '🌿',
    excursion:'🗺️',
    theme_park:'🎢',
    train:    '🚆',
    bus:      '🚌',
    taxi:     '🚕',
    default:  '📍',
  };
  return icons[type] || icons.default;
};
