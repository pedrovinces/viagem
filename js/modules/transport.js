/* ============================================================
   TRANSPORT.JS — Guia de transporte por cidade
   ============================================================ */

const section = document.getElementById('section-transport');
let transportData = null;
let activeCity = 'rome';

export async function init(data) {
  if (!section) return;

  try {
    const res = await fetch('./data/transport.json');
    transportData = await res.json();
  } catch (e) {
    console.error('[Transport] Erro ao carregar:', e);
    return;
  }

  renderShell();
  renderTransport(activeCity);
}

function renderShell() {
  const cities = [
    { id: 'rome',      name: 'Roma',     color: '#C84B31' },
    { id: 'florence',  name: 'Florença', color: '#D4943A' },
    { id: 'intercity', name: 'Intercidades', color: '#6B5B45' },
    { id: 'paris',     name: 'Paris',    color: '#4A6FA5' },
  ];

  section.innerHTML = `
    <div class="transport-tabs">
      ${cities.map(c => `
        <button class="transport-tab ${c.id === activeCity ? 'active' : ''}"
          data-city="${c.id}" style="--city-color:${c.color}">
          ${c.name}
        </button>`).join('')}
    </div>
    <div id="transport-body" class="transport-body"></div>`;

  section.querySelectorAll('.transport-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      section.querySelectorAll('.transport-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCity = btn.dataset.city;
      renderTransport(activeCity);
    });
  });
}

function renderTransport(cityId) {
  const body = document.getElementById('transport-body');
  if (!body || !transportData) return;

  const cityData = transportData[cityId];
  if (!cityData) { body.innerHTML = '<p>Dados indisponíveis.</p>'; return; }

  body.innerHTML = cityData.sections.map(s => renderSection(s)).join('');
}

function renderSection(s) {
  const items = (s.items || []).map(item => {
    if (item.type === 'route') return renderRoute(item);
    if (item.type === 'metro') return renderMetro(item);
    if (item.type === 'tip')   return renderTip(item);
    return renderGeneric(item);
  }).join('');

  return `
    <div class="transport-section">
      <h3 class="transport-section-title">${s.icon || ''} ${s.title}</h3>
      ${s.subtitle ? `<p class="transport-section-sub">${s.subtitle}</p>` : ''}
      ${items}
    </div>`;
}

function renderRoute(item) {
  const steps = (item.steps || []).map(st => `
    <div class="transport-step">
      <div class="transport-step-icon">${window.eventIcon ? window.eventIcon(st.mode || 'transfer') : '→'}</div>
      <div class="transport-step-content">
        <div class="transport-step-label">${st.label}</div>
        ${st.detail ? `<div class="transport-step-detail">${st.detail}</div>` : ''}
      </div>
      ${st.duration ? `<div class="transport-step-time">${st.duration}</div>` : ''}
      ${st.price ? `<div class="transport-step-price">${st.price}</div>` : ''}
    </div>`).join('');

  return `
    <div class="transport-route-card">
      <div class="transport-route-header">
        <span class="transport-route-from">${item.from}</span>
        <span class="transport-route-arrow">→</span>
        <span class="transport-route-to">${item.to}</span>
        ${item.duration ? `<span class="transport-route-total">${item.duration}</span>` : ''}
      </div>
      ${steps}
      ${item.notes ? `<div class="transport-route-notes">${item.notes}</div>` : ''}
    </div>`;
}

function renderMetro(item) {
  const lines = (item.lines || []).map(line => `
    <div class="metro-line" style="--line-color:${line.color}">
      <div class="metro-line-badge" style="background:${line.color}">${line.name}</div>
      <div class="metro-line-desc">${line.description}</div>
      <div class="metro-stations">
        ${(line.key_stations || []).map(st => `<span class="metro-station">${st}</span>`).join('')}
      </div>
    </div>`).join('');

  return `
    <div class="metro-card">
      ${item.title ? `<div class="metro-title">${item.title}</div>` : ''}
      ${lines}
      ${item.ticket_info ? `<div class="metro-ticket-info">${item.ticket_info}</div>` : ''}
      ${item.notes ? `<div class="transport-route-notes">${item.notes}</div>` : ''}
    </div>`;
}

function renderTip(item) {
  return `
    <div class="transport-tip">
      <span class="transport-tip-icon">💡</span>
      <span>${item.text}</span>
    </div>`;
}

function renderGeneric(item) {
  return `
    <div class="transport-info-card">
      ${item.title ? `<div class="transport-info-title">${item.icon || ''} ${item.title}</div>` : ''}
      ${item.detail ? `<div class="transport-info-detail">${item.detail}</div>` : ''}
      ${item.price ? `<div class="transport-info-price">💶 ${item.price}</div>` : ''}
      ${item.notes ? `<div class="transport-info-notes">${item.notes}</div>` : ''}
    </div>`;
}
