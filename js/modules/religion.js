/* ============================================================
   RELIGION.JS — Guia espiritual católico por cidade
   ============================================================ */

const section = document.getElementById('section-religion');
let religionData = null;
let activeCity = 'rome';

export async function init(data) {
  if (!section) return;

  try {
    const res = await fetch('./data/religion.json');
    religionData = await res.json();
  } catch (e) {
    console.error('[Religion] Erro ao carregar:', e);
    return;
  }

  renderShell();
  renderReligion(activeCity);
}

function renderShell() {
  const cities = [
    { id: 'rome',     name: 'Roma',    color: '#C84B31' },
    { id: 'florence', name: 'Florença', color: '#D4943A' },
    { id: 'assisi',   name: 'Assis',   color: '#8B7355' },
    { id: 'paris',    name: 'Paris',   color: '#4A6FA5' },
  ];

  section.innerHTML = `
    <div class="religion-hero">
      <div class="religion-hero-cross">✝</div>
      <h2 class="religion-hero-title">Fé & Espiritualidade</h2>
      <p class="religion-hero-sub">Uma peregrinação de amor e oração</p>
    </div>
    <div class="religion-tabs">
      ${cities.map(c => `
        <button class="religion-tab ${c.id === activeCity ? 'active' : ''}"
          data-city="${c.id}" style="--city-color:${c.color}">
          ${c.name}
        </button>`).join('')}
    </div>
    <div id="religion-body" class="religion-body"></div>`;

  section.querySelectorAll('.religion-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      section.querySelectorAll('.religion-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCity = btn.dataset.city;
      renderReligion(activeCity);
    });
  });
}

function renderReligion(cityId) {
  const body = document.getElementById('religion-body');
  if (!body || !religionData) return;

  const cityData = religionData[cityId];
  if (!cityData) { body.innerHTML = '<p>Dados indisponíveis.</p>'; return; }

  const sites = (cityData.sites || []).map(site => renderSite(site, cityId)).join('');

  body.innerHTML = `
    <div class="religion-city-intro">
      <p class="drop-cap">${cityData.intro || ''}</p>
    </div>
    <div class="religion-sites">
      ${sites}
    </div>`;

  // Bind expandable cards
  body.querySelectorAll('.religion-card[data-expandable]').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('expanded');
    });
  });
}

function renderSite(site, cityId) {
  const cityColors = { rome: '#C84B31', florence: '#D4943A', assisi: '#8B7355', paris: '#4A6FA5' };
  const color = cityColors[cityId] || '#C84B31';
  const isSpecial = site.special;

  return `
    <div class="religion-card ${isSpecial ? 'religion-card--special' : ''}" data-expandable="true"
      style="${isSpecial ? `background:linear-gradient(135deg,#1a1008,#2d1a08);color:#FAF3E0` : ''}">
      ${site.photo ? `<img class="religion-card-photo" src="${site.photo}" alt="${site.name}" loading="lazy">` : ''}
      <div class="religion-card-body">
        <div class="religion-card-type" style="color:${isSpecial ? '#D4943A' : color}">${site.type || ''}</div>
        <h3 class="religion-card-name" style="${isSpecial ? 'color:#FAF3E0' : ''}">${site.name}</h3>

        ${site.tags ? `<div class="religion-tags">
          ${site.tags.map(t => `<span class="religion-tag">${t}</span>`).join('')}
        </div>` : ''}

        <p class="religion-card-summary">${site.summary || ''}</p>

        <div class="religion-card-expand-content">
          ${site.history ? `
            <div class="religion-text-block">
              <p class="drop-cap">${site.history}</p>
            </div>` : ''}

          ${site.spiritual ? `
            <blockquote class="religion-quote">
              ${site.spiritual}
            </blockquote>` : ''}

          ${site.practical ? `
            <div class="religion-practical">
              <div class="religion-practical-title">ℹ️ Informações práticas</div>
              ${Object.entries(site.practical).map(([k, v]) =>
                `<div class="religion-practical-row">
                  <span>${k}</span><span>${v}</span>
                </div>`).join('')}
            </div>` : ''}

          ${site.prayer ? `
            <div class="religion-prayer">
              <div class="religion-prayer-label">🙏 Oração sugerida</div>
              <p class="religion-prayer-text">${site.prayer}</p>
            </div>` : ''}
        </div>

        <div class="religion-card-toggle">
          <span class="religion-toggle-label">Ver mais ↓</span>
        </div>
      </div>
    </div>`;
}
