/* ============================================================
   DOCUMENTS.JS — Voos, hotéis, ingressos, seguro, emergência
   ============================================================ */

const section = document.getElementById('section-documents');

export async function init(data) {
  if (!section) return;
  const { flights, hotels, tickets, contacts, insurance } = data;
  section.innerHTML = `
    <div class="documents-section">
      ${renderFlights(flights || [])}
      ${renderHotels(hotels || [])}
      ${renderTickets(tickets || [])}
      ${renderInsurance(insurance || [])}
      ${renderContacts(contacts || [])}
    </div>`;
}

function renderFlights(flights) {
  if (!flights.length) return '';
  const cards = flights.map(f => `
    <div class="flight-card">
      <div class="flight-card-header">
        <div>
          <div class="flight-airline">${f.airline}</div>
          <div class="flight-number">${f.flight_number || f.leg}</div>
        </div>
        <div class="flight-class">
          ${f.confirmation ? `<div>Loc. ${f.confirmation}</div>` : ''}
          ${f.cabin ? `<div>${f.cabin}</div>` : ''}
        </div>
      </div>
      <div class="flight-route">
        <div class="flight-endpoint">
          <div class="flight-airport-code">${f.departure.airport}</div>
          <div class="flight-airport-name">${f.departure.city}</div>
          <div class="flight-time">${f.departure.time}</div>
          ${f.departure.checkin_time ? `<div class="flight-checkin">Check-in: ${f.departure.checkin_time}</div>` : ''}
        </div>
        <div class="flight-center">
          <div class="flight-duration">${f.duration || ''}</div>
          <div class="flight-arrow">
            <div class="flight-line"></div>
            ✈️
            <div class="flight-line"></div>
          </div>
          <div class="flight-duration">${f.date ? window.formatDateShort(f.date) : ''}</div>
        </div>
        <div class="flight-endpoint" style="text-align:right">
          <div class="flight-airport-code">${f.arrival.airport}</div>
          <div class="flight-airport-name">${f.arrival.city}</div>
          <div class="flight-time">${f.arrival.time}</div>
        </div>
      </div>
      ${f.baggage || f.notes ? `
      <div class="flight-footer">
        ${f.baggage ? `<div class="flight-baggage">🧳 ${f.baggage}</div>` : ''}
        ${f.notes ? `<div class="flight-notes">${f.notes}</div>` : ''}
      </div>` : ''}
    </div>`).join('');

  return `
    <h2 class="documents-section-title">✈️ Voos</h2>
    ${cards}`;
}

function renderHotels(hotels) {
  if (!hotels.length) return '';
  const cards = hotels.map(h => `
    <div class="hotel-card">
      <div class="hotel-card-header">
        <span class="hotel-icon">🏨</span>
        <div class="hotel-name">${h.name}</div>
        <span class="badge badge-${h.city}" style="background:${window.cityColor ? window.cityColor(h.city) : '#C84B31'};color:#fff">
          ${window.cityName ? window.cityName(h.city) : h.city}
        </span>
      </div>
      <div class="info-card-rows">
        <div class="info-row">
          <span class="info-label">📍 Endereço</span>
          <span class="info-value">${h.address}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📅 Check-in</span>
          <span class="info-value">${window.formatDateShort ? window.formatDateShort(h.checkin_date) : h.checkin_date} às ${h.checkin_time}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📅 Check-out</span>
          <span class="info-value">${window.formatDateShort ? window.formatDateShort(h.checkout_date) : h.checkout_date} às ${h.checkout_time}</span>
        </div>
        ${h.reservation ? `<div class="info-row">
          <span class="info-label">🔖 Reserva</span>
          <span class="info-value ticket-code">${h.reservation}</span>
        </div>` : ''}
        ${h.reservation_2 ? `<div class="info-row">
          <span class="info-label">🔖 Reserva 2</span>
          <span class="info-value ticket-code">${h.reservation_2}</span>
        </div>` : ''}
        ${h.phone_1 ? `<div class="info-row">
          <span class="info-label">📞 Telefone</span>
          <span class="info-value"><a href="tel:${h.phone_1}">${h.phone_1}</a></span>
        </div>` : ''}
        ${h.city_tax ? `<div class="info-row">
          <span class="info-label">💶 Taxa cidade</span>
          <span class="info-value">${h.city_tax} (pagar no local)</span>
        </div>` : ''}
      </div>
      ${h.notes ? `<div class="hotel-notes">${h.notes}</div>` : ''}
    </div>`).join('');

  return `
    <h2 class="documents-section-title">🏨 Hospedagem</h2>
    ${cards}`;
}

function renderTickets(tickets) {
  if (!tickets.length) return '';
  const cards = tickets.map(t => `
    <div class="ticket-card">
      <div class="ticket-card-title">${t.name}</div>
      ${t.date ? `<div class="info-row">
        <span class="info-label">📅 Data</span>
        <span class="info-value">${window.formatDate ? window.formatDate(t.date) : t.date}${t.time && t.time !== '00:00' ? ' · ' + t.time : ''}</span>
      </div>` : ''}
      ${t.confirmation ? `<div class="ticket-code">${t.confirmation}</div>` : ''}
      ${t.hb_reference ? `<div class="info-row">
        <span class="info-label">Ref. HB</span>
        <span class="info-value">${t.hb_reference}</span>
      </div>` : ''}
      ${t.ticket_pedro ? `<div class="info-row">
        <span class="info-label">🎟️ Pedro</span>
        <span class="info-value" style="font-size:0.7rem;font-family:monospace">${t.ticket_pedro}</span>
      </div>` : ''}
      ${t.ticket_clarice ? `<div class="info-row">
        <span class="info-label">🎟️ Clarice</span>
        <span class="info-value" style="font-size:0.7rem;font-family:monospace">${t.ticket_clarice}</span>
      </div>` : ''}
      ${t.description ? `<div class="ticket-desc">${t.description}</div>` : ''}
      ${t.notes ? `<div class="ticket-notes">${t.notes}</div>` : ''}
    </div>`).join('');

  return `
    <h2 class="documents-section-title">🎟️ Ingressos</h2>
    ${cards}`;
}

function renderInsurance(insuranceList) {
  if (!insuranceList.length) return '';
  const ins = insuranceList[0];
  return `
    <h2 class="documents-section-title">🛡️ Seguro Viagem</h2>
    <div class="ticket-card" style="border-color:var(--c-primary)">
      <div class="ticket-card-title">${ins.insurer}</div>
      <div class="ticket-code">${ins.plan}</div>
      <div class="info-card-rows">
        <div class="info-row">
          <span class="info-label">📱 WhatsApp 24h</span>
          <span class="info-value"><a href="https://wa.me/551150399095">${ins.assistance_whatsapp}</a></span>
        </div>
        <div class="info-row">
          <span class="info-label">📞 SAC 24h</span>
          <span class="info-value"><a href="tel:08008890200">${ins.assistance_24h}</a></span>
        </div>
        <div class="info-row">
          <span class="info-label">🔖 Apólice Pedro</span>
          <span class="info-value" style="font-size:0.8rem">${ins.pedro_policy}</span>
        </div>
        <div class="info-row">
          <span class="info-label">🔖 Apólice Clarice</span>
          <span class="info-value" style="font-size:0.8rem">${ins.clarice_policy}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📅 Vigência</span>
          <span class="info-value">${ins.validity}</span>
        </div>
        <div class="info-row">
          <span class="info-label">🏥 Cobertura médica</span>
          <span class="info-value">USD ${ins.medical_coverage_usd?.toLocaleString('pt-BR')}</span>
        </div>
      </div>
      ${ins.notes ? `<div class="ticket-notes" style="color:var(--c-primary)">${ins.notes}</div>` : ''}
    </div>`;
}

function renderContacts(contacts) {
  if (!contacts.length) return '';

  const groups = {
    emergency: { label: '🚨 Emergência', items: [] },
    insurance:  { label: '🛡️ Seguro', items: [] },
    embassy:    { label: '🏛️ Embaixadas', items: [] },
    accommodation: { label: '🏨 Hospedagem', items: [] },
    agency:     { label: '✈️ Agência', items: [] },
  };

  contacts.forEach(c => {
    const g = groups[c.type] || groups.agency;
    g.items.push(c);
  });

  const sections = Object.values(groups)
    .filter(g => g.items.length > 0)
    .map(g => `
      <div class="contacts-group">
        <div class="contacts-group-label">${g.label}</div>
        ${g.items.map(c => `
          <div class="emergency-card">
            <div class="emergency-label">${c.label}</div>
            <a href="tel:${c.number.replace(/\s/g, '')}" class="emergency-number">${c.number}</a>
            ${c.desc ? `<div style="font-size:0.75rem;color:var(--text3);margin-top:4px">${c.desc}</div>` : ''}
          </div>`).join('')}
      </div>`).join('');

  return `
    <h2 class="documents-section-title">📞 Contatos Importantes</h2>
    ${sections}`;
}
