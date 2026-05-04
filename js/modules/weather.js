/* ============================================================
   WEATHER.JS — Open-Meteo API + cache localStorage
   ============================================================ */

const section = document.getElementById('section-weather');
const CACHE_TTL = 60 * 60 * 1000; // 1 hora

const CITY_COORDS = {
  rome:     { lat: 41.9028, lng: 12.4964, name: 'Roma' },
  florence: { lat: 43.7696, lng: 11.2558, name: 'Florença' },
  assisi:   { lat: 43.0706, lng: 12.6190, name: 'Assis' },
  paris:    { lat: 48.8566, lng: 2.3522,  name: 'Paris' },
};

const WMO_ICONS = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️',
  80: '🌦️', 81: '🌧️', 82: '⛈️',
  85: '🌨️', 86: '❄️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

const WMO_DESC = {
  0: 'Céu limpo', 1: 'Principalmente limpo', 2: 'Parcialmente nublado', 3: 'Nublado',
  45: 'Nevoeiro', 48: 'Nevoeiro com gelo',
  51: 'Garoa leve', 53: 'Garoa moderada', 55: 'Garoa densa',
  61: 'Chuva fraca', 63: 'Chuva moderada', 65: 'Chuva forte',
  71: 'Neve leve', 73: 'Neve moderada', 75: 'Neve forte',
  80: 'Pancadas leves', 81: 'Pancadas moderadas', 82: 'Pancadas fortes',
  85: 'Neve leve', 86: 'Neve forte',
  95: 'Trovoada', 96: 'Trovoada com granizo', 99: 'Trovoada com granizo forte',
};

let currentCity = detectCurrentCity();

export async function init(data) {
  if (!section) return;
  renderSkeleton();
  await loadWeather(currentCity);
}

function detectCurrentCity() {
  const today = new Date().toISOString().slice(0, 10);
  const schedule = [
    { from: '2026-05-17', to: '2026-05-22', city: 'rome' },
    { from: '2026-05-22', to: '2026-05-26', city: 'florence' },
    { from: '2026-05-24', to: '2026-05-24', city: 'assisi' },
    { from: '2026-05-26', to: '2026-05-31', city: 'paris' },
  ];
  for (const s of schedule) {
    if (today >= s.from && today <= s.to) return s.city;
  }
  return 'rome';
}

function renderSkeleton() {
  section.innerHTML = `
    <div class="weather-city-selector">
      ${Object.entries(CITY_COORDS).map(([id, c]) => `
        <button class="weather-city-btn ${id === currentCity ? 'active' : ''}"
          data-city="${id}">
          ${c.name}
        </button>`).join('')}
    </div>
    <div id="weather-content">
      <div class="weather-loading">🌤️ Carregando clima...</div>
    </div>`;

  section.querySelectorAll('.weather-city-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      section.querySelectorAll('.weather-city-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCity = btn.dataset.city;
      loadWeather(currentCity);
    });
  });
}

async function loadWeather(cityId) {
  const content = document.getElementById('weather-content');
  if (!content) return;

  const cacheKey = `weather-${cityId}`;
  const cached = getCached(cacheKey);
  if (cached) {
    renderWeather(cached, cityId, true);
    return;
  }

  content.innerHTML = `<div class="weather-loading">🌤️ Carregando...</div>`;

  const { lat, lng } = CITY_COORDS[cityId];
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}`
    + `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`
    + `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum`
    + `&timezone=auto&forecast_days=7`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('API error');
    const json = await res.json();
    setCache(cacheKey, json);
    renderWeather(json, cityId, false);
  } catch {
    renderOffline(cityId);
  }
}

function renderWeather(json, cityId, fromCache) {
  const content = document.getElementById('weather-content');
  if (!content) return;

  const cur = json.current;
  const daily = json.daily;
  const cityName = CITY_COORDS[cityId].name;
  const cityColor = window.cityColor ? window.cityColor(cityId) : '#C84B31';
  const wmo = cur.weather_code || 0;

  const forecast = (daily.time || []).map((date, i) => ({
    date,
    max: Math.round(daily.temperature_2m_max[i]),
    min: Math.round(daily.temperature_2m_min[i]),
    wmo: daily.weather_code[i],
    rain: daily.precipitation_sum[i],
  }));

  const tempRange = forecast.reduce((acc, d) => ({
    min: Math.min(acc.min, d.min),
    max: Math.max(acc.max, d.max),
  }), { min: 99, max: -99 });

  content.innerHTML = `
    <div class="weather-current-card" style="background:linear-gradient(135deg,${cityColor}dd,${cityColor}99)">
      <div class="weather-city-name">${cityName}</div>
      <div class="weather-main">
        <div>
          <div class="weather-temp">${Math.round(cur.temperature_2m)}<span class="weather-temp-unit">°C</span></div>
        </div>
        <div class="weather-icon">${WMO_ICONS[wmo] || '🌤️'}</div>
      </div>
      <div class="weather-desc">${WMO_DESC[wmo] || 'Indefinido'}</div>
      <div class="weather-details">
        <div class="weather-detail-item">
          <div class="weather-detail-label">Umidade</div>
          <div class="weather-detail-value">${cur.relative_humidity_2m}%</div>
        </div>
        <div class="weather-detail-item">
          <div class="weather-detail-label">Vento</div>
          <div class="weather-detail-value">${Math.round(cur.wind_speed_10m)} km/h</div>
        </div>
        <div class="weather-detail-item">
          <div class="weather-detail-label">Sensação</div>
          <div class="weather-detail-value">${Math.round(cur.apparent_temperature)}°C</div>
        </div>
      </div>
      ${fromCache ? `<div class="weather-updated">Dados em cache</div>` : ''}
    </div>

    <div class="forecast-title">Previsão 7 dias</div>
    <div class="forecast-list">
      ${forecast.map((d, i) => {
        const date = new Date(d.date + 'T00:00:00');
        const label = i === 0 ? 'Hoje' : date.toLocaleDateString('pt-BR', { weekday: 'short' });
        const barPct = (d.max - tempRange.min) / (tempRange.max - tempRange.min + 1) * 100;
        return `
          <div class="forecast-item">
            <span class="forecast-day">${label}</span>
            <span class="forecast-icon">${WMO_ICONS[d.wmo] || '🌤️'}</span>
            <div class="forecast-temps">
              <span class="forecast-min">${d.min}°</span>
              <div class="forecast-bar-wrap">
                <div class="forecast-bar-fill" style="width:${barPct}%;background:${cityColor}"></div>
              </div>
              <span class="forecast-max">${d.max}°</span>
            </div>
            ${d.rain > 0 ? `<span class="forecast-rain">💧 ${d.rain}mm</span>` : '<span></span>'}
          </div>`;
      }).join('')}
    </div>`;
}

function renderOffline(cityId) {
  const content = document.getElementById('weather-content');
  if (!content) return;
  const cityName = CITY_COORDS[cityId].name;
  content.innerHTML = `
    <div class="weather-offline">
      <div class="weather-offline-icon">📡</div>
      <p>Não foi possível carregar o clima de ${cityName}.</p>
      <p>Verifique sua conexão e tente novamente.</p>
      <button onclick="window.App.getItinerary().then(() => loadWeather('${cityId}'))"
        class="btn-secondary">Tentar novamente</button>
    </div>`;
}

function getCached(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
}

function setCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch {}
}
