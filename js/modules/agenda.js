/* ============================================================
   AGENDA.JS — Timeline dia a dia · Estilo editorial
   ============================================================ */

const section = document.getElementById('section-agenda');

export async function init(data) {
  const { days, cities } = data;
  if (!days || !section) return;

  section.innerHTML = renderAgenda(days, cities, data);
  bindEvents(data);
  scrollToCurrentDay(days);
}

function renderAgenda(days, cities, data) {
  const cityMap = Object.fromEntries(cities.map(c => [c.id, c]));

  const tabs = `
    <div class="agenda-tabs" role="tablist">
      <div class="agenda-tabs-scroll">
        ${days.map((d, i) => {
          const city = cityMap[d.city] || {};
          const date = new Date(d.date + 'T00:00:00');
          const dayNum = date.getDate();
          const mon = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
          const isToday = d.date === new Date().toISOString().slice(0, 10);
          return `<button class="agenda-tab${isToday ? ' today' : ''}" data-day="${i}" role="tab"
            aria-selected="false">
            <span class="tab-day">${dayNum}</span>
            <span class="tab-mon">${mon}</span>
          </button>`;
        }).join('')}
      </div>
    </div>`;

  const dayCards = days.map((d, i) => renderDayCard(d, i, cityMap, data)).join('');

  return `
    <div class="agenda-header">
      <div class="agenda-mono-label">I · Roteiro</div>
      <h2 class="agenda-title">Diário di Bordo</h2>
      <p class="agenda-subtitle">Pedro &amp; Clarice · 12 Anos · Maio MMXXVI</p>
    </div>
    ${tabs}
    <div class="agenda-days" id="agenda-days">
      ${dayCards}
    </div>`;
}

function renderDayCard(day, idx, cityMap, data) {
  const city = cityMap[day.city] || {};
  const dateStr = window.formatDate ? window.formatDate(day.date) : day.date;

  const events = (day.events || []).map(evt => renderEvent(evt, data)).join('');

  const heroStyle = day.hero ? `background-image:url('${day.hero}')` : '';

  return `
    <article class="day-card" id="day-card-${idx}" data-day="${idx}" data-date="${day.date}">
      <div class="day-card-header" style="${heroStyle}">
        <div class="day-card-header-overlay"></div>
        <div class="day-card-header-content">
          <div class="day-city-badge">${city.name || ''}</div>
          <h3 class="day-title">${day.title}</h3>
          ${day.subtitle ? `<p class="day-subtitle">${day.subtitle}</p>` : ''}
          <p class="day-date-label">${dateStr}</p>
        </div>
      </div>
      ${day.summary ? `<div class="day-summary">
        <p class="day-summary-text">${day.summary}</p>
        ${(day.tags || []).map(t => `<span class="day-tag">${t}</span>`).join('')}
      </div>` : ''}
      <div class="day-events">
        ${events || '<div style="padding:16px 20px;color:var(--text3);font-size:0.82rem">Dia de descanso ou viagem.</div>'}
      </div>
    </article>`;
}

function renderEvent(evt, data) {
  const hasDetail = evt.notes || evt.history || evt.romantic || evt.tips;
  const typeLabel = getTypeLabel(evt.type);

  return `
    <div class="event-item ${hasDetail ? 'event-clickable' : ''}" data-evt-id="${evt.id || ''}"
      ${hasDetail ? `onclick="openEventModal(${JSON.stringify(evt).replace(/"/g, '&quot;')})"` : ''}>
      <div class="event-time">${evt.time || ''}</div>
      <div class="event-dot"></div>
      <div class="event-body">
        <div class="event-title">${typeLabel ? `<span style="font-family:var(--font-mono);font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--c-primary);margin-right:6px">${typeLabel}</span>` : ''}${evt.title}</div>
        ${evt.detail ? `<div class="event-detail">${evt.detail}</div>` : ''}
        ${evt.steps ? renderSteps(evt.steps) : ''}
        ${evt.restaurant_options ? renderRestaurantOptions(evt.restaurant_options) : ''}
      </div>
      ${hasDetail ? `<div class="event-chevron">›</div>` : ''}
    </div>`;
}

function getTypeLabel(type) {
  const labels = {
    flight:   'Voo',
    hotel:    'Hotel',
    transfer: 'Transfer',
    metro:    'Metrô',
    walk:     'A pé',
    visit:    'Visita',
    church:   'Igreja',
    museum:   'Museu',
    meal:     'Refeição',
    restaurant: 'Restaurante',
    ticket:   'Ingresso',
    mass:     'Missa',
    tomb:     'Túmulo',
    'free-time': 'Tempo livre',
    shopping: 'Compras',
    viewpoint: 'Vista',
    garden:   'Jardim',
    excursion: 'Excursão',
    train:    'Trem',
    bus:      'Ônibus',
    taxi:     'Táxi',
  };
  return labels[type] || '';
}

function renderSteps(steps) {
  return `<div class="event-steps">
    ${steps.map(s => `<div class="event-step">
      <span class="event-step-icon" style="color:var(--text3)">→</span>
      <span class="event-step-text">${s.desc}</span>
      ${s.duration ? `<span class="event-step-duration">${s.duration}</span>` : ''}
      ${s.price ? `<span class="event-step-price">${s.price}</span>` : ''}
    </div>`).join('')}
  </div>`;
}

function renderRestaurantOptions(options) {
  return `<div class="event-restaurant-options">
    <div class="event-section-label">Sugestões</div>
    ${options.slice(0, 2).map(r => `<div class="event-restaurant">
      <strong>${r.name}</strong>${r.cuisine ? ` · <em>${r.cuisine}</em>` : ''}${r.price_range ? ` · ${r.price_range}` : ''}
    </div>`).join('')}
  </div>`;
}

function bindEvents(data) {
  section.querySelectorAll('.agenda-tab').forEach((tab, idx) => {
    tab.addEventListener('click', () => activateDay(idx));
  });

  window.openEventModal = (evt) => {
    const hotels = Object.fromEntries((data.hotels || []).map(h => [h.id, h]));
    const hotel = evt.hotel_ref ? hotels[evt.hotel_ref] : null;
    const html = buildEventModal(evt, hotel);
    window.App.openModal(html);
  };
}

function activateDay(idx) {
  section.querySelectorAll('.agenda-tab').forEach((t, i) => {
    t.setAttribute('aria-selected', i === idx ? 'true' : 'false');
  });
  const card = section.querySelector(`#day-card-${idx}`);
  if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function scrollToCurrentDay(days) {
  const today = new Date().toISOString().slice(0, 10);
  const idx = days.findIndex(d => d.date === today);
  if (idx >= 0) {
    requestAnimationFrame(() => activateDay(idx));
  } else {
    requestAnimationFrame(() => {
      const firstTab = section.querySelector('.agenda-tab');
      if (firstTab) firstTab.setAttribute('aria-selected', 'true');
    });
  }
}

function buildEventModal(evt, hotel) {
  const sections = [];

  if (evt.detail) {
    sections.push(`<p class="modal-detail">${evt.detail}</p>`);
  }

  if (evt.notes) {
    sections.push(`
      <div class="modal-section">
        <div class="modal-section-label">Informações</div>
        <p>${evt.notes}</p>
      </div>`);
  }

  if (evt.history) {
    sections.push(`
      <div class="modal-section modal-section--history drop-cap">
        <div class="modal-section-label">História</div>
        <p>${evt.history}</p>
      </div>`);
  }

  if (evt.romantic) {
    sections.push(`
      <div class="modal-section modal-section--romantic">
        <div class="modal-romantic-text">"${evt.romantic}"</div>
      </div>`);
  }

  if (evt.tips) {
    sections.push(`
      <div class="modal-section">
        <div class="modal-section-label">Dicas</div>
        <p>${evt.tips}</p>
      </div>`);
  }

  if (hotel) {
    sections.push(`
      <div class="modal-section">
        <div class="modal-section-label">Hospedagem</div>
        <p style="font-family:var(--font-serif);font-size:1rem;margin-bottom:6px">${hotel.name}</p>
        <p style="font-size:0.82rem;color:var(--text3)">${hotel.address}</p>
        ${hotel.phone_1 ? `<p style="font-size:0.82rem;color:var(--text3)">Tel: ${hotel.phone_1}</p>` : ''}
        <p style="font-family:var(--font-mono);font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--text3);margin-top:6px">Check-in ${hotel.checkin_time} · Check-out ${hotel.checkout_time}</p>
        ${hotel.notes ? `<p class="hotel-modal-notes">${hotel.notes}</p>` : ''}
      </div>`);
  }

  if (evt.coordinates) {
    const { lat, lng } = evt.coordinates;
    sections.push(`
      <a class="modal-maps-btn" href="https://maps.google.com/?q=${lat},${lng}" target="_blank" rel="noopener">
        Ver no Google Maps →
      </a>`);
  }

  if (evt.restaurant_options && evt.restaurant_options.length > 0) {
    const options = evt.restaurant_options.map(r => `
      <div class="modal-restaurant">
        <strong>${r.name}</strong>${r.cuisine ? ` · <em>${r.cuisine}</em>` : ''}${r.price_range ? ` (${r.price_range})` : ''}
        ${r.address ? `<div class="modal-restaurant-addr">${r.address}</div>` : ''}
        ${r.notes ? `<div class="modal-restaurant-note">${r.notes}</div>` : ''}
      </div>`).join('');
    sections.push(`
      <div class="modal-section">
        <div class="modal-section-label">Onde Comer</div>
        ${options}
      </div>`);
  }

  const typeLabel = getTypeLabel(evt.type);

  return `
    <div class="event-modal-header">
      <div>
        ${typeLabel ? `<div class="event-modal-time">${typeLabel}</div>` : ''}
        <h3 class="event-modal-title">${evt.title}</h3>
        ${evt.time ? `<p class="event-modal-time">${evt.time}</p>` : ''}
      </div>
    </div>
    ${sections.join('')}`;
}
