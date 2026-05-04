/* ============================================================
   DESTINATIONS.JS — Guia de atrações por cidade
   ============================================================ */

const section = document.getElementById('section-destinations');
let destData = null;

export async function init(data) {
  if (!section) return;

  try {
    const res = await fetch('./data/destinations.json');
    destData = await res.json();
  } catch (e) {
    console.error('[Destinations] Erro ao carregar:', e);
    return;
  }

  render(destData);
}

function render(data) {
  const cities = data.cities || [];
  section.innerHTML = cities.map(renderCity).join('');

  section.querySelectorAll('.destination-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.destIdx);
      const cityIdx = parseInt(card.dataset.cityIdx);
      const dest = cities[cityIdx]?.destinations[idx];
      if (dest) openDestModal(dest);
    });
  });
}

function renderCity(city, cityIdx) {
  const cards = (city.destinations || []).map((d, i) => renderCard(d, i, cityIdx, city.color)).join('');
  return `
    <div class="destinations-city-section">
      <div class="destinations-city-banner" style="min-height:180px">
        <img src="${city.hero}" alt="${city.name}" loading="lazy">
        <div class="destinations-city-banner-content">
          <div class="destinations-city-name">${city.flag} ${city.name}</div>
          <div class="destinations-city-tagline">${city.tagline}</div>
        </div>
      </div>
      <div class="destination-cards">
        ${cards}
      </div>
    </div>`;
}

function renderCard(dest, idx, cityIdx, cityColor) {
  const meta = [];
  if (dest.duration) meta.push(`⏱️ ${dest.duration}`);
  if (dest.price)    meta.push(`💶 ${dest.price}`);
  if (dest.must_book) meta.push(`🎟️ Reserva necessária`);

  return `
    <div class="destination-card" data-dest-idx="${idx}" data-city-idx="${cityIdx}"
      style="--city-color:${cityColor}">
      ${dest.photo ? `<img class="destination-card-img" src="${dest.photo}" alt="${dest.name}" loading="lazy">` : ''}
      <div class="destination-card-body">
        <div class="destination-card-type">${dest.type || ''}</div>
        <h3 class="destination-card-title">${dest.name}</h3>
        <p class="destination-card-desc">${dest.description}</p>
        ${meta.length ? `<div class="destination-card-meta">
          ${meta.map(m => `<span class="destination-meta-item">${m}</span>`).join('')}
        </div>` : ''}
      </div>
    </div>`;
}

function openDestModal(dest) {
  const gallery = (dest.photos || [dest.photo]).filter(Boolean);
  const galleryHtml = gallery.length > 0 ? `
    <div class="destination-gallery">
      ${gallery.map((url, i) => `<img src="${url}" alt="" loading="lazy" style="${i===0?'grid-column:span 3':''}">`).join('')}
    </div>` : '';

  const info = [];
  if (dest.hours)   info.push(['🕐 Horário', dest.hours]);
  if (dest.price)   info.push(['💶 Preço', dest.price]);
  if (dest.duration) info.push(['⏱️ Duração', dest.duration]);
  if (dest.address) info.push(['📍 Endereço', dest.address]);

  const infoHtml = info.length ? `
    <div class="dest-modal-info">
      ${info.map(([k, v]) => `<div class="dest-info-row"><span>${k}</span><span>${v}</span></div>`).join('')}
    </div>` : '';

  const html = `
    ${galleryHtml}
    <h3 class="dest-modal-name">${dest.name}</h3>
    <p class="dest-modal-type">${dest.type || ''}</p>
    ${infoHtml}
    <div class="dest-modal-desc">
      <p class="drop-cap">${dest.long_description || dest.description}</p>
    </div>
    ${dest.tips ? `<div class="dest-modal-tips">
      <div class="dest-tips-label">💡 Dicas</div>
      <p>${dest.tips}</p>
    </div>` : ''}
    ${dest.romantic ? `<div class="dest-modal-romantic">
      <p class="religion-quote">"${dest.romantic}"</p>
    </div>` : ''}
    ${dest.coordinates ? `
      <a class="modal-maps-btn" href="https://maps.google.com/?q=${dest.coordinates.lat},${dest.coordinates.lng}"
        target="_blank" rel="noopener">🗺️ Ver no Google Maps</a>` : ''}`;

  window.App.openModal(html);
}
