/* ============================================================
   DOCUMENTS.JS — Voos, hotéis, ingressos, seguro, emergência
   Estilo editorial: mono-labels, Fraunces, sem emoji pesado
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
            <svg width="14" height="10" viewBox="0 0 24 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 9L2 9M2 9L7 4M2 9L7 14"/></svg>
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
        ${f.baggage ? `<div class="flight-baggage" style="font-size:0.82rem">${f.baggage}</div>` : ''}
        ${f.notes ? `<div class="flight-notes">${f.notes}</div>` : ''}
      </div>` : ''}
    </div>`).join('');

  return `
    <div class="documents-section-mono">I · Voos</div>
    <h2 class="documents-section-title">Passagens aéreas</h2>
    ${cards}`;
}

function renderHotels(hotels) {
  if (!hotels.length) return '';
  const cards = hotels.map(h => `
    <div class="hotel-card">
      <div class="hotel-card-header">
        <svg class="hotel-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <div class="hotel-name">${h.name}</div>
        <span class="badge badge-outline">${window.cityName ? window.cityName(h.city) : h.city}</span>
      </div>
      <div class="info-card-rows">
        <div class="info-row">
          <span class="info-label">Endereço</span>
          <span class="info-value">${h.address}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Check-in</span>
          <span class="info-value">${window.formatDateShort ? window.formatDateShort(h.checkin_date) : h.checkin_date} · ${h.checkin_time}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Check-out</span>
          <span class="info-value">${window.formatDateShort ? window.formatDateShort(h.checkout_date) : h.checkout_date} · ${h.checkout_time}</span>
        </div>
        ${h.reservation ? `<div class="info-row">
          <span class="info-label">Reserva</span>
          <span class="info-value ticket-code">${h.reservation}</span>
        </div>` : ''}
        ${h.reservation_2 ? `<div class="info-row">
          <span class="info-label">Reserva 2</span>
          <span class="info-value ticket-code">${h.reservation_2}</span>
        </div>` : ''}
        ${h.phone_1 ? `<div class="info-row">
          <span class="info-label">Telefone</span>
          <span class="info-value"><a href="tel:${h.phone_1}" style="color:var(--c-primary)">${h.phone_1}</a></span>
        </div>` : ''}
        ${h.city_tax ? `<div class="info-row">
          <span class="info-label">Taxa cidade</span>
          <span class="info-value">${h.city_tax} · pagar no local</span>
        </div>` : ''}
      </div>
      ${h.notes ? `<div class="hotel-notes">${h.notes}</div>` : ''}
    </div>`).join('');

  return `
    <div class="documents-section-mono" style="margin-top:var(--s6)">II · Hospedagem</div>
    <h2 class="documents-section-title">Hotéis reservados</h2>
    ${cards}`;
}

function renderTickets(tickets) {
  if (!tickets.length) return '';
  const cards = tickets.map(t => `
    <div class="ticket-card">
      <div class="ticket-card-title">${t.name}</div>
      ${t.date ? `<div class="info-row" style="padding:8px 20px">
        <span class="info-label">Data</span>
        <span class="info-value">${window.formatDate ? window.formatDate(t.date) : t.date}${t.time && t.time !== '00:00' ? ' · ' + t.time : ''}</span>
      </div>` : ''}
      ${t.confirmation ? `<div class="ticket-code">${t.confirmation}</div>` : ''}
      ${t.hb_reference ? `<div class="info-row" style="padding:8px 20px">
        <span class="info-label">Ref. HB</span>
        <span class="info-value">${t.hb_reference}</span>
      </div>` : ''}
      ${t.ticket_pedro ? `<div class="info-row" style="padding:8px 20px">
        <span class="info-label">Pedro</span>
        <span class="info-value" style="font-family:var(--font-mono);font-size:0.75rem">${t.ticket_pedro}</span>
      </div>` : ''}
      ${t.ticket_clarice ? `<div class="info-row" style="padding:8px 20px">
        <span class="info-label">Clarice</span>
        <span class="info-value" style="font-family:var(--font-mono);font-size:0.75rem">${t.ticket_clarice}</span>
      </div>` : ''}
      ${t.description ? `<div class="ticket-desc">${t.description}</div>` : ''}
      ${t.notes ? `<div class="ticket-notes">${t.notes}</div>` : ''}
    </div>`).join('');

  return `
    <div class="documents-section-mono" style="margin-top:var(--s6)">III · Ingressos</div>
    <h2 class="documents-section-title">Bilhetes &amp; reservas</h2>
    ${cards}`;
}

function renderInsurance(insuranceList) {
  if (!insuranceList.length) return '';
  const ins = insuranceList[0];
  return `
    <div class="documents-section-mono" style="margin-top:var(--s6)">IV · Seguro</div>
    <h2 class="documents-section-title">Seguro viagem</h2>
    <div class="ticket-card" style="border-color:rgba(139,30,30,0.3)">
      <div class="ticket-card-title">${ins.insurer}</div>
      <div class="ticket-code">${ins.plan}</div>
      <div class="info-card-rows">
        <div class="info-row" style="padding:8px 20px">
          <span class="info-label">WhatsApp 24h</span>
          <span class="info-value"><a href="https://wa.me/551150399095" style="color:var(--c-primary)">${ins.assistance_whatsapp}</a></span>
        </div>
        <div class="info-row" style="padding:8px 20px">
          <span class="info-label">SAC 24h</span>
          <span class="info-value"><a href="tel:08008890200" style="color:var(--c-primary)">${ins.assistance_24h}</a></span>
        </div>
        <div class="info-row" style="padding:8px 20px">
          <span class="info-label">Apólice Pedro</span>
          <span class="info-value" style="font-family:var(--font-mono);font-size:0.78rem">${ins.pedro_policy}</span>
        </div>
        <div class="info-row" style="padding:8px 20px">
          <span class="info-label">Apólice Clarice</span>
          <span class="info-value" style="font-family:var(--font-mono);font-size:0.78rem">${ins.clarice_policy}</span>
        </div>
        <div class="info-row" style="padding:8px 20px">
          <span class="info-label">Vigência</span>
          <span class="info-value">${ins.validity}</span>
        </div>
        <div class="info-row" style="padding:8px 20px">
          <span class="info-label">Cobertura méd.</span>
          <span class="info-value">USD ${ins.medical_coverage_usd?.toLocaleString('pt-BR')}</span>
        </div>
      </div>
      ${ins.notes ? `<div class="ticket-notes" style="color:var(--c-primary)">${ins.notes}</div>` : ''}
    </div>`;
}

function renderContacts(contacts) {
  if (!contacts.length) return '';

  const groups = {
    emergency:     { label: 'Emergência', items: [] },
    insurance:     { label: 'Seguro', items: [] },
    embassy:       { label: 'Embaixadas', items: [] },
    accommodation: { label: 'Hospedagem', items: [] },
    agency:        { label: 'Agência', items: [] },
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
            ${c.desc ? `<div style="font-family:var(--font-mono);font-size:8.5px;letter-spacing:.1em;color:var(--text3);margin-top:4px">${c.desc}</div>` : ''}
          </div>`).join('')}
      </div>`).join('');

  return `
    <div class="documents-section-mono" style="margin-top:var(--s6)">V · Contatos</div>
    <h2 class="documents-section-title">Números importantes</h2>
    ${sections}`;
}
