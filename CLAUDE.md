# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O projeto

PWA de guia de viagem para Pedro & Clarice — lua de mel de 12 anos por Roma, Florença, Assis e Paris (17–31 mai 2026). Instalável no celular, funciona offline, protegido por senha. Hospedado em **viagem.pedrovinces.com.br** via GitHub Pages + GitHub Actions.

## Desenvolvimento local

Não há build step. Para rodar localmente, servir com qualquer servidor HTTP (necessário para ES modules e Service Worker):

```bash
python3 -m http.server 8080
# ou
npx serve .
```

Acessar em `http://localhost:8080`. O Service Worker só ativa em HTTPS ou localhost.

## Deploy

Push para `main` → GitHub Actions (`.github/workflows/deploy.yml`) faz deploy automático para GitHub Pages. Sem build, sem transpile — os arquivos são servidos diretamente.

**Após qualquer alteração de JS/CSS/dados:** bumpar a versão do cache no `sw.js`:
```js
const CACHE = 'nossa-viagem-vXX'; // incrementar
```
Sem isso, usuários com o app instalado continuam na versão antiga.

## Arquitetura

### Fluxo de inicialização

```
index.html carrega
  → script inline: oculta body (visibility:hidden) se não desbloqueado
  → js/app.js (type="module")
      → initLock()  — mostra tela de senha ou pula se já desbloqueado
      → navigate()  — ativa seção via hash (#agenda, #map, etc.)
          → import lazy do módulo correspondente
          → mod.init(itineraryData)
```

### Roteamento

Hash-based: `location.hash` define a seção ativa. `app.js` escuta `hashchange` e chama `navigate(section)`. Cada seção é inicializada **uma única vez** (Set `initialized`). Os módulos são importados dinamicamente (`import()`) ao primeira visita.

### Dados

`data/itinerary.json` é a **fonte da verdade** — alimenta agenda, mapa, documentos e clima. Estrutura:
```
trip, cities[], hotels[], flights[], tickets[], insurance, contacts, days[]
  days[].events[] → { id, type, time, title, detail, notes, history,
                       romantic, tips, steps[], transit, booking,
                       trivia, reading, photo, coordinates, hotel_ref,
                       restaurants[] }
```

`window.App.getItinerary()` carrega e cacheia o JSON. Todos os módulos recebem o objeto completo via `mod.init(data)`.

Outros JSONs: `phrases-it.json`, `phrases-fr.json`, `transport.json`, `religion.json`, `destinations.json` — carregados diretamente pelos seus módulos via `fetch()`.

### Módulos (`js/modules/`)

Cada módulo exporta `init(data)` e gerencia seu próprio `section` element (`document.getElementById('section-X')`). Pattern consistente:

```js
const section = document.getElementById('section-nome');
export async function init(data) { ... }
```

| Módulo | Responsabilidade |
|---|---|
| `agenda.js` | Timeline dia a dia; tabs com IntersectionObserver; event delegation para modais |
| `map.js` | Leaflet.js; visão geral + visão por dia; marcadores e polylines por cidade |
| `phrases.js` | Frasebook IT/FR; busca; TTS com Web Speech API (PBKDF2 voice ranking) |
| `weather.js` | Open-Meteo API; cache localStorage 1h; auto-detecta cidade pela data |
| `religion.js` | Guia católico por cidade; carrega `religion.json` |
| `destinations.js` | Atrações por cidade; carrega `destinations.json` |
| `documents.js` | Voos, hotéis, ingressos, seguro, emergência |
| `transport.js` | Guias de transporte por cidade; carrega `transport.json` |

### Lock screen (`js/lock.js`)

PBKDF2 (100.000 iterações, SHA-256, salt `nv-nossa-viagem-2026`) + rate-limit (5 tentativas, bloqueio 30s). Sessão via `sessionStorage`. O app inicializa **por baixo** da tela de lock (não bloquear `navigate()`).

**Para trocar a senha:** no console do browser com o app aberto:
```js
generateLockHash('novasenha').then(h => console.log(h))
```
Colar o hash resultante em `PWD_HASH` em `lock.js`.

### Service Worker (`sw.js`)

Estratégias de cache por origem:
- **Open-Meteo** → network-first com timeout 4s
- **OSM tiles** → cache-first (tiles imutáveis)
- **Fontes / unpkg CDN** → stale-while-revalidate
- **Tudo mais** (app shell, dados, imagens) → cache-first

### CSS

Variáveis CSS em `css/main.css` (`:root`). Fontes: **Fraunces** (serif, títulos) + **Geist** (sans, corpo) + **Geist Mono** (mono, labels). Dark mode em `css/dark-mode.css` via `[data-theme="dark"]`. Cada seção tem seu próprio CSS em `css/sections/`.

Paleta de cidades:
```
Roma/Florença: #C84B31 (terracota) | Assis: #8B7355 (pedra) | Paris: #4A6FA5
```

### Segurança

- CSP via meta tag em `index.html`
- SRI (`integrity="sha384-..."`) nos scripts Leaflet do CDN unpkg
- Eventos de modal via **event delegation** — dados sensíveis ficam em memória, não serializados no HTML
- `itinerary.json` acessível publicamente (repo público + GitHub Pages) — não incluir dados que precisem de sigilo absoluto

## Globals expostos por `app.js`

```js
window.App.getItinerary()   // Promise → objeto itinerary completo
window.App.openModal(html)  // abre modal com HTML arbitrário
window.App.closeModal()
window.formatDate(dateStr)      // ex: "segunda-feira, 19 de maio"
window.formatDateShort(dateStr) // ex: "19 mai"
window.cityColor(cityId)    // hex da cor da cidade
window.cityName(cityId)     // nome PT-BR
window.cityFlag(cityId)     // emoji da bandeira
window.eventIcon(type)      // emoji do tipo de evento
window.generateLockHash(str) // PBKDF2 hash — usado no console para trocar senha
```
