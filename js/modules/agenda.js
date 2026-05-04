/* ============================================================
   AGENDA.JS — Timeline dia a dia
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
          const mon = date.toLocaleDateString('pt-BR', { month: 'short' });
          return `<button class="agenda-tab" data-day="${i}" role="tab"
            style="--city-color:${city.color || '#C84B31'}"
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
      <h2 class="agenda-title">Diário de Bordo</h2>
      <p class="agenda-subtitle">Pedro & Clarice · 12 Anos</p>
    </div>
    ${tabs}
    <div class="agenda-days" id="agenda-days">
      ${dayCards}
    </div>`;
}

function renderDayCard(day, idx, cityMap, data) {
  const city = cityMap[day.city] || {};
  const dateStr = window.formatDate ? window.formatDate(day.date) : day.date;
  const cityColor = city.color || '#C84B31';

  const events = (day.events || []).map(evt => renderEvent(evt, data)).join('');

  return `
    <article class="day-card" id="day-card-${idx}" data-day="${idx}" data-date="${day.date}"
      style="--city-color:${cityColor}">
      <div class="day-card-header" style="background-image:url('${day.hero || ''}')">
        <div class="day-card-header-overlay"></div>
        <div class="day-card-header-content">
          <div class="day-city-badge" style="background:${cityColor}">
            ${city.flag || ''} ${city.name || ''}
          </div>
          <h3 class="day-title">${day.title}</h3>
          <p class="day-subtitle">${day.subtitle || ''}</p>
          <p class="day-date-label">${dateStr}</p>
        </div>
      </div>
      <div class="day-summary">
        <p class="day-summary-text">${day.summary || ''}</p>
        ${(day.tags || []).map(t => `<span class="day-tag">${t}</span>`).join('')}
      </div>
      <div class="day-events">
        ${events}
      </div>
    </article>`;
}

function renderEvent(evt, data) {
  const icon = window.eventIcon ? window.eventIcon(evt.type) : '📍';
  const hasDetail = evt.notes || evt.history || evt.romantic || evt.tips;

  return `
    <div class="event-item ${hasDetail ? 'event-clickable' : ''}" data-evt-id="${evt.id}"
      ${hasDetail ? `onclick="openEventModal(${JSON.stringify(evt).replace(/"/g, '&quot;')})"` : ''}>
      <div class="event-time">${evt.time || ''}</div>
      <div class="event-dot"></div>
      <div class="event-body">
        <div class="event-title">${icon} ${evt.title}</div>
        ${evt.detail ? `<div class="event-detail">${evt.detail}</div>` : ''}
        ${evt.steps ? renderSteps(evt.steps) : ''}
        ${evt.restaurant_options ? renderRestaurantOptions(evt.restaurant_options) : ''}
      </div>
      ${hasDetail ? `<div class="event-chevron">›</div>` : ''}
    </div>`;
}

function renderSteps(steps) {
  return `<div class="event-steps">
    ${steps.map(s => `<div class="event-step">
      <span class="event-step-icon">${window.eventIcon ? window.eventIcon(s.mode || 'default') : '→'}</span>
      <span class="event-step-text">${s.desc}</span>
      ${s.duration ? `<span class="event-step-duration">${s.duration}</span>` : ''}
      ${s.price ? `<span class="event-step-price">${s.price}</span>` : ''}
    </div>`).join('')}
  </div>`;
}

function renderRestaurantOptions(options) {
  return `<div class="event-restaurant-options">
    <div class="event-section-label">Sugestões de restaurante</div>
    ${options.slice(0, 2).map(r => `<div class="event-restaurant">
      <strong>${r.name}</strong>
      ${r.cuisine ? ` · <em>${r.cuisine}</em>` : ''}
      ${r.price_range ? ` · ${r.price_range}` : ''}
    </div>`).join('')}
  </div>`;
}

function bindEvents(data) {
  // Tab navigation
  section.querySelectorAll('.agenda-tab').forEach((tab, idx) => {
    tab.addEventListener('click', () => activateDay(idx));
  });

  // Global modal opener
  window.openEventModal = (evt) => {
    const hotels = Object.fromEntries((data.hotels || []).map(h => [h.id, h]));
    const hotel = evt.hotel_ref ? hotels[evt.hotel_ref] : null;
    const html = buildEventModal(evt, hotel);
    window.App.openModal(html);
  };
}

function activateDay(idx) {
  section.querySelectorAll('.agenda-tab').forEach((t, i) => {
    t.setAttribute('aria-selected', i === idx);
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
  const icon = window.eventIcon ? window.eventIcon(evt.type) : '📍';
  const sections = [];

  if (evt.detail) {
    sections.push(`<p class="modal-detail">${evt.detail}</p>`);
  }

  if (evt.notes) {
    sections.push(`
      <div class="modal-section">
        <div class="modal-section-label">ℹ️ Informações</div>
        <p>${evt.notes}</p>
      </div>`);
  }

  if (evt.history) {
    sections.push(`
      <div class="modal-section modal-section--history">
        <div class="modal-section-label">📖 História</div>
        <p class="drop-cap">${evt.history}</p>
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
        <div class="modal-section-label">💡 Dicas</div>
        <p>${evt.tips}</p>
      </div>`);
  }

  if (hotel) {
    sections.push(`
      <div class="modal-section modal-section--hotel">
        <div class="modal-section-label">🏨 Hospedagem</div>
        <strong>${hotel.name}</strong><br>
        ${hotel.address}<br>
        ${hotel.phone_1 ? `Tel: ${hotel.phone_1}<br>` : ''}
        Check-in: ${hotel.checkin_time} · Check-out: ${hotel.checkout_time}
        ${hotel.notes ? `<p class="hotel-modal-notes">${hotel.notes}</p>` : ''}
      </div>`);
  }

  if (evt.coordinates) {
    const { lat, lng } = evt.coordinates;
    sections.push(`
      <a class="modal-maps-btn" href="https://maps.google.com/?q=${lat},${lng}" target="_blank" rel="noopener">
        🗺️ Ver no Google Maps
      </a>`);
  }

  if (evt.restaurant_options && evt.restaurant_options.length > 0) {
    const options = evt.restaurant_options.map(r => `
      <div class="modal-restaurant">
        <strong>${r.name}</strong>
        ${r.cuisine ? ` · <em>${r.cuisine}</em>` : ''}
        ${r.price_range ? ` (${r.price_range})` : ''}
        ${r.address ? `<div class="modal-restaurant-addr">${r.address}</div>` : ''}
        ${r.notes ? `<div class="modal-restaurant-note">${r.notes}</div>` : ''}
      </div>`).join('');
    sections.push(`
      <div class="modal-section">
        <div class="modal-section-label">🍽️ Onde Comer</div>
        ${options}
      </div>`);
  }

  return `
    <div class="event-modal-header">
      <span class="event-modal-icon">${icon}</span>
      <div>
        <h3 class="event-modal-title">${evt.title}</h3>
        ${evt.time ? `<p class="event-modal-time">${evt.time}</p>` : ''}
      </div>
    </div>
    ${sections.join('')}`;
}
