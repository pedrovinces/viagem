/* ============================================================
   MAP.JS — Leaflet interativo · Controles flutuantes mobile-first
   ============================================================ */

const section = document.getElementById('section-map');
let mapInstance = null;
let allMarkersData = []; // { marker, city, type, dayIdx, coords }
let overviewPolyline = null;
let activeDayPolyline = null;
let currentView = 'overview';
let mapData = null;

const CITY_META = {
  rome:     { color: '#C84B31', name: 'Roma',    lat: 41.9028, lng: 12.4964 },
  florence: { color: '#D4943A', name: 'Florença', lat: 43.7696, lng: 11.2558 },
  assisi:   { color: '#8B7355', name: 'Assis',   lat: 43.0706, lng: 12.6190 },
  paris:    { color: '#4A6FA5', name: 'Paris',   lat: 48.8566, lng: 2.3522  },
};

const ROUTE_CITIES = [
  [41.9028, 12.4964],
  [43.7696, 11.2558],
  [43.0706, 12.6190],
  [48.8566,  2.3522],
];

export async function init(data) {
  if (!section) return;
  mapData = data;
  renderMapShell(data);
  await waitForLeaflet();
  initMap(data);
  watchSection();
}

/* ─── Shell com controles flutuantes ─────────────────────── */

function renderMapShell(data) {
  const days = data.days || [];

  section.innerHTML = `
    <div class="map-wrap" id="map-wrap">

      <!-- Mapa (fundo de tudo) -->
      <div id="leaflet-map"></div>

      <!-- Overlay superior: modo + filtros -->
      <div class="map-overlay map-overlay--top" id="map-overlay-top">

        <!-- Alternador de modo -->
        <div class="map-mode-row">
          <div class="map-mode-pills">
            <button class="map-mode-pill active" data-view="overview">Visão Geral</button>
            <button class="map-mode-pill" data-view="daily">Por Dia</button>
          </div>
        </div>

        <!-- Filtros: visão geral -->
        <div class="map-filter-group" id="map-filters-overview">
          <div class="map-chips-scroll">
            <button class="map-chip map-chip--city active" data-filter="all">Todos</button>
            ${Object.entries(CITY_META).map(([id, m]) =>
              `<button class="map-chip map-chip--city" data-filter="${id}" style="--chip-color:${m.color}">${m.name}</button>`
            ).join('')}
          </div>
          <div class="map-chips-scroll">
            <button class="map-chip map-chip--type active" data-type="all">Tudo</button>
            <button class="map-chip map-chip--type" data-type="church">⛪ Igrejas</button>
            <button class="map-chip map-chip--type" data-type="museum">🖼️ Museus</button>
            <button class="map-chip map-chip--type" data-type="hotel">🏨 Hotéis</button>
            <button class="map-chip map-chip--type" data-type="restaurant">🍽️ Rest.</button>
          </div>
        </div>

        <!-- Abas de dia: modo Por Dia -->
        <div class="map-filter-group map-hidden" id="map-filters-daily">
          <div class="map-chips-scroll map-chips-scroll--days" id="map-day-chips">
            ${days.map((d, i) => {
              const date = new Date(d.date + 'T00:00:00');
              const dayNum = date.getDate();
              const mon = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
              const color = CITY_META[d.city]?.color || '#999';
              return `<button class="map-day-chip" data-day="${i}" style="--chip-color:${color}">
                <span class="map-day-chip-num">${dayNum}</span>
                <span class="map-day-chip-mon">${mon}</span>
              </button>`;
            }).join('')}
          </div>
        </div>

      </div>

      <!-- Overlay inferior: info do dia (só no modo Por Dia) -->
      <div class="map-overlay map-overlay--bottom map-hidden" id="map-day-info"></div>

    </div>`;

  /* Eventos: alternador de modo */
  section.querySelectorAll('.map-mode-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      section.querySelectorAll('.map-mode-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      switchView(btn.dataset.view);
    });
  });

  /* Eventos: filtros de cidade */
  section.querySelectorAll('.map-chip--city').forEach(btn => {
    btn.addEventListener('click', () => {
      section.querySelectorAll('.map-chip--city').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterByCity(btn.dataset.filter);
    });
  });

  /* Eventos: filtros de tipo */
  section.querySelectorAll('.map-chip--type').forEach(btn => {
    btn.addEventListener('click', () => {
      section.querySelectorAll('.map-chip--type').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterByType(btn.dataset.type);
    });
  });

  /* Eventos: abas de dia */
  section.querySelectorAll('.map-day-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      section.querySelectorAll('.map-day-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activateDayView(parseInt(btn.dataset.day));
    });
  });
}

/* ─── Observa quando a seção fica ativa (invalidateSize) ─── */

function watchSection() {
  const obs = new MutationObserver(() => {
    if (section.classList.contains('active') && mapInstance) {
      requestAnimationFrame(() => mapInstance.invalidateSize());
    }
  });
  obs.observe(section, { attributes: true, attributeFilter: ['class'] });
}

/* ─── Troca de modo ──────────────────────────────────────── */

function switchView(view) {
  currentView = view;
  const overviewFilters = document.getElementById('map-filters-overview');
  const dailyFilters    = document.getElementById('map-filters-daily');
  const dayInfoEl       = document.getElementById('map-day-info');

  if (view === 'overview') {
    overviewFilters?.classList.remove('map-hidden');
    dailyFilters?.classList.add('map-hidden');
    dayInfoEl?.classList.add('map-hidden');
    showOverview();
  } else {
    overviewFilters?.classList.add('map-hidden');
    dailyFilters?.classList.remove('map-hidden');
    const todayIdx = findTodayIndex();
    const target   = todayIdx >= 0 ? todayIdx : 0;
    const chip = section.querySelector(`.map-day-chip[data-day="${target}"]`);
    if (chip) {
      section.querySelectorAll('.map-day-chip').forEach(b => b.classList.remove('active'));
      chip.classList.add('active');
      chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    dayInfoEl?.classList.remove('map-hidden');
    activateDayView(target);
  }
}

function findTodayIndex() {
  if (!mapData) return -1;
  const today = new Date().toISOString().slice(0, 10);
  return (mapData.days || []).findIndex(d => d.date === today);
}

function showOverview() {
  if (!mapInstance) return;
  if (activeDayPolyline) { activeDayPolyline.remove(); activeDayPolyline = null; }
  if (overviewPolyline)  overviewPolyline.addTo(mapInstance);
  allMarkersData.forEach(({ marker }) => marker.addTo(mapInstance));
  mapInstance.flyTo([44.5, 10], 5, { duration: 1 });
}

function activateDayView(dayIdx) {
  if (!mapInstance || !mapData) return;
  const L = window.L;
  const dayData = mapData.days[dayIdx];
  if (!dayData) return;

  if (overviewPolyline) overviewPolyline.remove();
  allMarkersData.forEach(({ marker }) => marker.remove());
  if (activeDayPolyline) { activeDayPolyline.remove(); activeDayPolyline = null; }

  const dayMarkers = allMarkersData.filter(m => m.dayIdx === dayIdx);
  dayMarkers.forEach(({ marker }) => marker.addTo(mapInstance));

  const coords = dayMarkers.map(m => m.coords);
  if (coords.length > 1) {
    const color = CITY_META[dayData.city]?.color || '#C84B31';
    activeDayPolyline = L.polyline(coords, {
      color, weight: 3, opacity: 0.9, dashArray: '6,5',
    }).addTo(mapInstance);
  }

  if (coords.length > 0) {
    mapInstance.fitBounds(L.latLngBounds(coords), { padding: [60, 60], maxZoom: 15 });
  } else {
    const cm = CITY_META[dayData.city];
    if (cm) mapInstance.flyTo([cm.lat, cm.lng], 13);
  }

  updateDayInfoPanel(dayData, coords.length);
}

function updateDayInfoPanel(dayData, pointCount) {
  const el = document.getElementById('map-day-info');
  if (!el) return;
  const cm = CITY_META[dayData.city];
  el.innerHTML = `
    <div class="map-day-info-card" style="--accent:${cm?.color || '#C84B31'}">
      <div class="map-day-info-left">
        <span class="map-day-info-city">${cm?.name || ''}</span>
        <span class="map-day-info-title">${dayData.title}</span>
      </div>
      <span class="map-day-info-pts">${pointCount || 0}<br><small>pontos</small></span>
    </div>`;
}

/* ─── Leaflet ────────────────────────────────────────────── */

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

  /* Zoom control acima da nav */
  L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    maxZoom: 19,
  }).addTo(mapInstance);

  /* Linha de rota geral */
  overviewPolyline = L.polyline(ROUTE_CITIES, {
    color: '#C84B31', weight: 2, dashArray: '8,6', opacity: 0.55,
  });
  overviewPolyline.addTo(mapInstance);

  /* Hotéis */
  (data.hotels || []).forEach(hotel => {
    if (!hotel.coordinates) return;
    const cm = CITY_META[hotel.city] || CITY_META.rome;
    const marker = createMarker(L, hotel.coordinates.lat, hotel.coordinates.lng, cm.color, '🏨');
    marker.bindPopup(buildPopup(hotel.name, hotel.address, '🏨 Hotel', cm.color));
    allMarkersData.push({ marker, city: hotel.city, type: 'hotel', dayIdx: -1, coords: [hotel.coordinates.lat, hotel.coordinates.lng] });
    marker.addTo(mapInstance);
  });

  /* Eventos por dia */
  (data.days || []).forEach((day, dayIdx) => {
    (day.events || []).forEach(evt => {
      if (!evt.coordinates) return;
      const cm = CITY_META[day.city] || CITY_META.rome;
      const evtType = evt.type || 'visit';
      const icon = getEventEmoji(evtType);
      const marker = createMarker(L, evt.coordinates.lat, evt.coordinates.lng, cm.color, icon);
      marker.bindPopup(buildPopup(evt.title, evt.detail || '', icon + ' ' + evtType, cm.color, day.date));
      allMarkersData.push({ marker, city: day.city, type: evtType, dayIdx, coords: [evt.coordinates.lat, evt.coordinates.lng] });
      marker.addTo(mapInstance);
    });
  });

  /* Labels de cidade */
  Object.entries(CITY_META).forEach(([, meta]) => {
    const cityIcon = L.divIcon({
      className: '',
      html: `<div class="map-city-label" style="background:${meta.color}">${meta.name}</div>`,
      iconAnchor: [30, 10],
    });
    L.marker([meta.lat, meta.lng], { icon: cityIcon }).addTo(mapInstance);
  });

  /* Forçar tamanho correto logo após render */
  requestAnimationFrame(() => requestAnimationFrame(() => mapInstance.invalidateSize()));
}

function getEventEmoji(type) {
  const icons = {
    flight: '✈️', hotel: '🏨', transfer: '🚆', metro: '🚇',
    walk: '🚶', visit: '📍', church: '⛪', museum: '🖼️',
    meal: '🍽️', restaurant: '🍴', ticket: '🎟️', mass: '✝️',
    tomb: '⚜️', 'free-time': '☀️', shopping: '🛍️', viewpoint: '🔭',
    garden: '🌿', excursion: '🗺️', train: '🚂', bus: '🚌', taxi: '🚕',
  };
  return icons[type] || '📍';
}

function createMarker(L, lat, lng, color, emoji) {
  const icon = L.divIcon({
    className: '',
    html: `<div class="map-marker" style="background:${color}">${emoji}</div>`,
    iconAnchor: [18, 18],
    popupAnchor: [0, -22],
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
  allMarkersData.forEach(({ marker, city }) => {
    (cityId === 'all' || city === cityId) ? marker.addTo(mapInstance) : marker.remove();
  });
  if (cityId !== 'all' && CITY_META[cityId]) {
    const { lat, lng } = CITY_META[cityId];
    mapInstance.flyTo([lat, lng], 13, { duration: 1.2 });
  } else {
    mapInstance.flyTo([44.5, 10], 5, { duration: 1 });
  }
}

function filterByType(type) {
  allMarkersData.forEach(({ marker, type: mType }) => {
    (type === 'all' || mType === type) ? marker.addTo(mapInstance) : marker.remove();
  });
}
