/* ============================================================
   MAP.JS — Leaflet interativo com cidades, atrações e rotas
   ============================================================ */

const section = document.getElementById('section-map');
let mapInstance = null;
let allMarkers = [];
let currentFilter = 'all';

const CITY_META = {
  rome:     { color: '#C84B31', name: 'Roma',    lat: 41.9028, lng: 12.4964 },
  florence: { color: '#D4943A', name: 'Florença', lat: 43.7696, lng: 11.2558 },
  assisi:   { color: '#8B7355', name: 'Assis',   lat: 43.0706, lng: 12.6190 },
  paris:    { color: '#4A6FA5', name: 'Paris',   lat: 48.8566, lng: 2.3522  },
};

const ROUTE_CITIES = [
  [41.9028, 12.4964], // Roma
  [43.7696, 11.2558], // Florença
  [43.0706, 12.6190], // Assis
  [48.8566, 2.3522],  // Paris
];

export async function init(data) {
  if (!section) return;
  renderMapShell();
  await waitForLeaflet();
  initMap(data);
}

function renderMapShell() {
  section.innerHTML = `
    <div class="map-controls">
      <div class="map-city-filters">
        <button class="map-filter-btn active" data-filter="all">Todos</button>
        ${Object.entries(CITY_META).map(([id, m]) => `
          <button class="map-filter-btn" data-filter="${id}"
            style="--city-color:${m.color}">${m.name}</button>`).join('')}
      </div>
      <div class="map-type-filters">
        <button class="map-type-btn active" data-type="all">Tudo</button>
        <button class="map-type-btn" data-type="church">⛪ Igrejas</button>
        <button class="map-type-btn" data-type="museum">🖼️ Museus</button>
        <button class="map-type-btn" data-type="hotel">🏨 Hotéis</button>
        <button class="map-type-btn" data-type="restaurant">🍽️ Restaurantes</button>
      </div>
    </div>
    <div id="leaflet-map" class="map-container"></div>`;

  section.querySelectorAll('.map-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      section.querySelectorAll('.map-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterByCity(btn.dataset.filter);
    });
  });

  section.querySelectorAll('.map-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      section.querySelectorAll('.map-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterByType(btn.dataset.type);
    });
  });
}

async function waitForLeaflet() {
  if (window.L) return;
  return new Promise(resolve => {
    const check = setInterval(() => { if (window.L) { clearInterval(check); resolve(); } }, 100);
  });
}

function initMap(data) {
  const L = window.L;
  const mapEl = document.getElementById('leaflet-map');
  if (!mapEl || mapInstance) return;

  mapInstance = L.map(mapEl, { zoomControl: false }).setView([44.5, 10], 5);
  L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(mapInstance);

  // Linha de rota entre cidades
  L.polyline(ROUTE_CITIES, { color: '#C84B31', weight: 2, dashArray: '8,6', opacity: 0.6 })
    .addTo(mapInstance);

  // Marcadores de hotéis
  (data.hotels || []).forEach(hotel => {
    if (!hotel.coordinates) return;
    const city = CITY_META[hotel.city] || CITY_META.rome;
    const marker = createMarker(L, hotel.coordinates.lat, hotel.coordinates.lng, city.color, '🏨');
    marker.bindPopup(buildPopup(hotel.name, hotel.address, '🏨 Hotel', city.color));
    allMarkers.push({ marker, city: hotel.city, type: 'hotel' });
    marker.addTo(mapInstance);
  });

  // Pontos de interesse dos dias
  (data.days || []).forEach(day => {
    (day.events || []).forEach(evt => {
      if (!evt.coordinates) return;
      const city = CITY_META[day.city] || CITY_META.rome;
      const evtType = evt.type || 'visit';
      const icon = window.eventIcon ? window.eventIcon(evtType) : '📍';
      const marker = createMarker(L, evt.coordinates.lat, evt.coordinates.lng, city.color, icon);
      const popup = buildPopup(evt.title, evt.detail || '', icon + ' ' + (evtType), city.color, day.date);
      marker.bindPopup(popup);
      allMarkers.push({ marker, city: day.city, type: evtType });
      marker.addTo(mapInstance);
    });
  });

  // Marcadores de cidade com labels
  Object.entries(CITY_META).forEach(([id, meta]) => {
    const cityIcon = L.divIcon({
      className: '',
      html: `<div class="map-city-label" style="background:${meta.color}">${meta.name}</div>`,
      iconAnchor: [30, 10],
    });
    L.marker([meta.lat, meta.lng], { icon: cityIcon }).addTo(mapInstance);
  });
}

function createMarker(L, lat, lng, color, emoji) {
  const icon = L.divIcon({
    className: '',
    html: `<div class="map-marker" style="background:${color}">${emoji}</div>`,
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
  return L.marker([lat, lng], { icon });
}

function buildPopup(title, detail, type, color, date) {
  return `<div class="map-popup">
    <div class="map-popup-type" style="color:${color}">${type}</div>
    <div class="map-popup-title">${title}</div>
    ${detail ? `<div class="map-popup-detail">${detail}</div>` : ''}
    ${date ? `<div class="map-popup-date">${window.formatDateShort ? window.formatDateShort(date) : date}</div>` : ''}
  </div>`;
}

function filterByCity(cityId) {
  allMarkers.forEach(({ marker, city }) => {
    const show = cityId === 'all' || city === cityId;
    show ? marker.addTo(mapInstance) : marker.remove();
  });
  if (cityId !== 'all' && CITY_META[cityId]) {
    const { lat, lng } = CITY_META[cityId];
    mapInstance.flyTo([lat, lng], 13, { duration: 1.2 });
  } else {
    mapInstance.flyTo([44.5, 10], 5, { duration: 1 });
  }
}

function filterByType(type) {
  allMarkers.forEach(({ marker, type: mType }) => {
    const show = type === 'all' || mType === type;
    show ? marker.addTo(mapInstance) : marker.remove();
  });
}
