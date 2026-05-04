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
      <div class="religion-hero-eyebrow">Guia Espiritual</div>
      <h2 class="religion-hero-title">Fé &amp; Espiritualidade</h2>
      <p class="religion-hero-subtitle">Uma peregrinação de amor e oração</p>
    </div>
    <div class="religion-city-nav">
      ${cities.map(c => `
        <button class="religion-city-tab ${c.id === activeCity ? 'active' : ''}"
          data-city="${c.id}" style="--city-color:${c.color}">
          ${c.name}
        </button>`).join('')}
    </div>
    <div id="religion-body" class="religion-body"></div>`;

  section.querySelectorAll('.religion-city-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      section.querySelectorAll('.religion-city-tab').forEach(b => b.classList.remove('active'));
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
      <p>${cityData.intro || ''}</p>
    </div>
    <div class="religion-sites">
      ${sites}
    </div>`;
}

function renderSite(site, cityId) {
  const cityColors = { rome: '#C84B31', florence: '#D4943A', assisi: '#8B7355', paris: '#4A6FA5' };
  const color = cityColors[cityId] || '#C84B31';
  const isSpecial = site.special;

  const cardClass = isSpecial ? 'religion-site-card carlo-acutis-card' : 'religion-site-card';

  return `
    <div class="${cardClass}">
      ${site.photo ? `<img class="religion-site-photo" src="${site.photo}" alt="${site.name}" loading="lazy">` : ''}
      <div class="religion-site-body">
        <div class="religion-site-type">${site.type || ''}</div>
        <h3 class="religion-site-title ${isSpecial ? 'carlo-acutis-title' : ''}">${site.name}</h3>

        ${site.tags ? `<div class="religion-site-tags">
          ${site.tags.map(t => `<span class="religion-site-tag">${t}</span>`).join('')}
        </div>` : ''}

        ${site.summary ? `<div class="religion-text"><p>${site.summary}</p></div>` : ''}

        ${site.history ? `
          <div class="religion-text">
            <p>${site.history}</p>
          </div>` : ''}

        ${site.spiritual ? `
          <blockquote class="religion-quote">${site.spiritual}</blockquote>` : ''}

        ${site.practical ? `
          <div class="religion-info-box">
            <div class="religion-info-box-title">ℹ️ Informações práticas</div>
            ${Object.entries(site.practical).map(([k, v]) =>
              `<div class="religion-practical-row">
                <span class="religion-practical-key">${k}</span>
                <span class="religion-practical-val">${v}</span>
              </div>`).join('')}
          </div>` : ''}

        ${site.prayer ? `
          <div class="religion-prayer-box">
            <div class="religion-prayer-label">🙏 Oração sugerida</div>
            <p class="religion-prayer-text">${site.prayer}</p>
          </div>` : ''}
      </div>
    </div>`;
}
