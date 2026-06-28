const fallbackHomes = [
  {
    id: 'dn-mykhe-condo', title: 'Светлый кондо у My Khe', area: 'An Thuong, Da Nang', city: 'danang', type: 'apartment', price: 920, score: 92,
    source: 'FB Marketplace', fresh: 'сегодня', specs: ['2 спальни', '72 м²', '7 мин море'],
    details: ['депозит 1 мес', 'контракт от 3 мес', '12 этаж', 'заезд сейчас'],
    tags: ['бассейн', 'спортзал', 'балкон', 'pet ok', 'кафе рядом'],
    about: 'Уютный апартамент в районе An Thuong: много света, рабочий стол у окна, быстрый Wi‑Fi и кухня для нормальной жизни, а не только завтраков.',
    contact: { name: 'Linh Tran', line: '+84 93 822 1044 · владелец', value: '+84938221044' },
    fbUrl: 'https://www.facebook.com/marketplace/',
    photos: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=82',
    ],
    petFriendly: true,
  },
  {
    id: 'dn-sontra-villa', title: 'Тихая вилла с садом в Son Tra', area: 'Son Tra, Da Nang', city: 'danang', type: 'villa', price: 1650, score: 88,
    source: 'FB Marketplace', fresh: '2 часа назад', specs: ['3 спальни', '180 м²', 'сад'],
    details: ['депозит 2 мес', 'контракт от 6 мес', '2 этажа', 'парковка'],
    tags: ['частный двор', 'ванна', 'pet ok', 'тихо'],
    about: 'Дом в спокойной улице рядом с Son Tra. Много места для гостей, отдельная зона под кабинет и небольшой сад для вечерних посиделок.',
    contact: { name: 'Minh Homes', line: '+84 90 533 7711 · агент', value: '+84905337711' },
    fbUrl: 'https://www.facebook.com/marketplace/',
    photos: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=82',
    ],
    petFriendly: true,
  },
  {
    id: 'nt-seaview-studio', title: 'Sea view студия в центре', area: 'Loc Tho, Nha Trang', city: 'nhatrang', type: 'apartment', price: 680, score: 84,
    source: 'FB Marketplace', fresh: 'вчера', specs: ['студия', '42 м²', 'вид море'],
    details: ['депозит 1 мес', 'контракт от 1 мес', '24 этаж', 'ресепшн'],
    tags: ['sea view', 'центр', 'уборка', 'кондиционер'],
    about: 'Компактная студия для одного человека: панорамное окно, отдельный рабочий угол и все рядом пешком. Хорошо для первого месяца в городе.',
    contact: { name: 'Anna Rentals', line: 'Messenger · агент', value: 'Anna Rentals' },
    fbUrl: 'https://www.facebook.com/marketplace/',
    photos: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1200&q=82',
    ],
    petFriendly: false,
  },
  {
    id: 'hcm-thaodien-loft', title: 'Лофт с рабочей зоной', area: 'Thao Dien, Ho Chi Minh City', city: 'hcmc', type: 'apartment', price: 1180, score: 81,
    source: 'FB Marketplace', fresh: 'сегодня', specs: ['1 спальня', '64 м²', 'кафе рядом'],
    details: ['депозит 1 мес', 'контракт от 3 мес', '8 этаж', 'заезд 10 июля'],
    tags: ['рабочий стол', 'охрана', 'прачечная', 'кофейни'],
    about: 'Современный лофт в районе с кафе, сервисами и комьюнити. Внутри спокойно, достаточно розеток и нормальный свет для созвонов.',
    contact: { name: 'Saigon Living', line: '+84 77 120 8810 · агентство', value: '+84771208810' },
    fbUrl: 'https://www.facebook.com/marketplace/',
    photos: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=1200&q=82',
    ],
    petFriendly: false,
  },
  {
    id: 'hoian-garden-house', title: 'Дом у рисовых полей', area: 'Cam Chau, Hoi An', city: 'hoian', type: 'villa', price: 1250, score: 90,
    source: 'FB Marketplace', fresh: '3 часа назад', specs: ['2 спальни', '120 м²', 'терраса'],
    details: ['депозит 1 мес', 'контракт от 3 мес', '1 этаж', 'заезд 5 июля'],
    tags: ['терраса', 'кухня', 'велосипеды', 'тихий район'],
    about: 'Небольшой дом между старым городом и пляжем. Очень спокойный вайб, много зелени, есть терраса для ужинов и место под рабочий стол.',
    contact: { name: 'Hanh Nguyen', line: '+84 91 402 7788 · владелец', value: '+84914027788' },
    fbUrl: 'https://www.facebook.com/marketplace/',
    photos: [
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?auto=format&fit=crop&w=1200&q=82',
    ],
    petFriendly: true,
  },
  {
    id: 'nt-family-apart', title: 'Семейный апарт у Hon Chong', area: 'Hon Chong, Nha Trang', city: 'nhatrang', type: 'apartment', price: 860, score: 86,
    source: 'FB Marketplace', fresh: 'сегодня', specs: ['2 спальни', '78 м²', 'детская'],
    details: ['депозит 1 мес', 'контракт от 2 мес', '15 этаж', 'бассейн'],
    tags: ['детская', 'кухня', 'море рядом', 'pet ok'],
    about: 'Практичный апартамент для семьи: две отдельные спальни, хороший холодильник, закрытая территория и быстрый выход к набережной.',
    contact: { name: 'Blue Coast Homes', line: 'Messenger · агент', value: 'Blue Coast Homes' },
    fbUrl: 'https://www.facebook.com/marketplace/',
    photos: [
      'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1617103996702-96ff29b1c467?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=1200&q=82',
    ],
    petFriendly: true,
  },
  {
    id: 'pq-beach-bungalow', title: 'Бунгало на Phu Quoc для slow beach', area: 'Ong Lang, Phu Quoc', city: 'phuquoc', type: 'villa', price: 1040, score: 89,
    source: 'FB Marketplace', fresh: '4 часа назад', specs: ['1 спальня', '58 м²', '3 мин пляж'],
    details: ['депозит 1 мес', 'контракт от 1 мес', '1 этаж', 'терраса'],
    tags: ['пляж', 'терраса', 'тихо', 'завтраки рядом'],
    about: 'Небольшое бунгало для расслабленного островного режима. Море рядом, район без лишнего шума, хороший вариант на месяц-полтора.',
    contact: { name: 'Island Stay', line: 'Messenger · управляющий', value: 'Island Stay' },
    fbUrl: 'https://www.facebook.com/marketplace/',
    photos: [
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?auto=format&fit=crop&w=1200&q=82',
    ],
    petFriendly: false,
  },
  {
    id: 'dn-riverside-studio', title: 'Riverside студия для первого месяца', area: 'Hai Chau, Da Nang', city: 'danang', type: 'apartment', price: 590, score: 80,
    source: 'FB Marketplace', fresh: 'сегодня', specs: ['студия', '38 м²', 'центр'],
    details: ['депозит 1 мес', 'контракт от 1 мес', '5 этаж', 'лифт'],
    tags: ['центр', 'value', 'кофейни', 'рабочий стол'],
    about: 'Бюджетная база в центре Da Nang: не курортная картинка, зато удобно на старте, рядом еда, сервисы и набережная.',
    contact: { name: 'Trang Nguyen', line: '+84 98 300 4431 · владелец', value: '+84983004431' },
    fbUrl: 'https://www.facebook.com/marketplace/',
    photos: [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1522156373667-4c7234bbd804?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=1200&q=82',
    ],
    petFriendly: false,
  },
];

const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
const API_BASE = window.VIETNEST_API_BASE || (window.location.port === '5174' ? 'http://127.0.0.1:8080' : '');
const STORAGE = {
  favorites: 'vietnest:favorites:v5',
  seen: 'vietnest:seen:v5',
  prefs: 'vietnest:prefs:v5',
  onboarded: 'vietnest:onboarded:v5',
};

const destinations = { all: 'Вьетнам', danang: 'Da Nang', nhatrang: 'Nha Trang', hoian: 'Hoi An', hcmc: 'HCMC', phuquoc: 'Phu Quoc' };
const travelerLabels = { solo: 'соло', couple: 'пара', family: 'семья', friends: 'друзья' };
const vibeLabels = { beach: 'море', workation: 'workation', calm: 'тихо', villa: 'вилла', pool: 'бассейн', pet: 'pet ok' };
const defaultPrefs = { destination: 'danang', traveler: 'couple', vibes: ['beach', 'workation'], budget: 1200, bedrooms: '1' };

let homes = fallbackHomes.map(normalizeHome);

const state = {
  screen: 'discover',
  filter: 'best',
  photo: 0,
  activeDetailId: null,
  currentId: null,
  animating: false,
  favorites: new Set(readJSON(STORAGE.favorites, [])),
  seen: normalizeSeen(readJSON(STORAGE.seen, {})),
  prefs: normalizePrefs(readJSON(STORAGE.prefs, defaultPrefs)),
};

const $ = (id) => document.getElementById(id);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function readJSON(key, fallback) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || 'null');
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // LocalStorage can be unavailable in embedded or test contexts.
  }
}

function readFlag(key) {
  try {
    return Boolean(window.localStorage.getItem(key));
  } catch {
    return false;
  }
}

function setFlag(key) {
  try {
    window.localStorage.setItem(key, '1');
  } catch {
    // ignore
  }
}

function normalizeSeen(value) {
  if (Array.isArray(value)) return Object.fromEntries(value.map((id) => [id, 1]));
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(Object.entries(value).map(([id, count]) => [id, Number(count) || 1]));
}

function normalizePrefs(value) {
  const prefs = { ...defaultPrefs, ...(value || {}) };
  prefs.budget = Number(prefs.budget) || defaultPrefs.budget;
  prefs.vibes = Array.isArray(prefs.vibes) && prefs.vibes.length ? [...new Set(prefs.vibes)] : [...defaultPrefs.vibes];
  prefs.bedrooms = String(prefs.bedrooms || '1');
  return prefs;
}

function escapeHTML(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizeHome(raw) {
  const tags = Array.isArray(raw.tags) ? raw.tags : [];
  const specs = Array.isArray(raw.specs) ? raw.specs : [];
  const details = Array.isArray(raw.details) ? raw.details : [];
  const photos = Array.isArray(raw.photos) && raw.photos.length
    ? raw.photos
    : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=82'];

  return {
    id: String(raw.id || raw.externalId || `${raw.city || 'home'}-${raw.title || Math.random()}`),
    title: raw.title || 'Вариант без названия',
    area: raw.area || destinations[raw.city] || 'Vietnam',
    city: raw.city || 'all',
    type: raw.type || raw.home_type || raw.homeType || raw.property_type || 'apartment',
    price: Number(raw.price || raw.priceUsd || raw.price_usd || 0),
    score: Number(raw.score || raw.matchScore || raw.match_score || 76),
    source: raw.source || 'FB Marketplace',
    fresh: raw.fresh || raw.freshness || 'сегодня',
    specs,
    details,
    tags,
    about: raw.about || raw.description || 'Описание появится после нормализации объявления.',
    contact: {
      name: raw.contact?.name || raw.contactName || 'Контакт в объявлении',
      line: raw.contact?.line || raw.contactLine || 'Messenger · источник',
      value: raw.contact?.value || raw.contactValue || raw.contact?.line || 'Messenger',
    },
    fbUrl: raw.fbUrl || raw.fb_url || raw.sourceUrl || raw.source_url || 'https://www.facebook.com/marketplace/',
    photos,
    petFriendly: Boolean(raw.petFriendly || raw.pet_friendly || tags.some((tag) => /pet|жив/i.test(tag))),
  };
}

function textPool(home) {
  return [home.title, home.area, home.type, home.about, ...home.specs, ...home.details, ...home.tags].join(' ').toLowerCase();
}

function bedrooms(home) {
  const pool = textPool(home);
  if (/студ|studio/.test(pool)) return 0;
  const match = pool.match(/(\d+(?:[.,]\d+)?)\s*(спальн|bed|br)/i);
  return match ? Number(match[1].replace(',', '.')) : null;
}

function hasVibe(home, vibe) {
  const pool = textPool(home);
  const checks = {
    beach: /море|sea|beach|пляж|my khe|hon chong|набереж|вид море|seaview|sea view|ong lang/.test(pool),
    workation: /work|рабоч|wi\s?-?fi|wifi|кафе|кофей|desk|созвон|стол|розет/.test(pool),
    calm: /тихо|сад|зел|rice|спокой|terrace|террас|двор|garden|slow/.test(pool),
    villa: home.type === 'villa' || /вилла|villa|дом|house|bungalow|бунгало/.test(pool),
    pool: /бассейн|pool/.test(pool),
    pet: home.petFriendly || /pet|живот|питом/.test(pool),
    family: /сем|family|дет|2 спаль|3 спаль|две спаль|три спаль/.test(pool),
    value: home.price > 0 && home.price <= Number(state.prefs.budget || defaultPrefs.budget),
  };
  return Boolean(checks[vibe]);
}

function matchesDestination(home) {
  const destination = state.prefs.destination || 'all';
  return destination === 'all' || home.city === destination;
}

function matchesFilter(home) {
  if (state.filter === 'best') return true;
  return hasVibe(home, state.filter);
}

function travelFit(home) {
  let score = Number(home.score || 76);
  const prefs = state.prefs;

  if (home.price > 0) {
    if (home.price <= prefs.budget) score += 10;
    else if (home.price <= prefs.budget * 1.15) score += 2;
    else score -= clamp(Math.round(((home.price / prefs.budget) - 1) * 24), 8, 24);
  }

  for (const vibe of prefs.vibes || []) score += hasVibe(home, vibe) ? 8 : -2;

  const beds = bedrooms(home);
  if (prefs.bedrooms === 'studio') {
    if (beds === 0) score += 8;
    if (beds && beds > 1) score -= 4;
  } else if (beds !== null) {
    const desired = Number(prefs.bedrooms || 1);
    score += beds >= desired ? 6 : -8;
  }

  if (prefs.traveler === 'family' && hasVibe(home, 'family')) score += 8;
  if (prefs.traveler === 'couple' && (hasVibe(home, 'beach') || hasVibe(home, 'calm'))) score += 4;
  if (prefs.traveler === 'solo' && (beds === 0 || beds === 1)) score += 4;
  if (prefs.traveler === 'friends' && beds && beds >= 2) score += 5;
  if (/сегодня|час|today|hour/i.test(home.fresh)) score += 4;
  if (/вчера|yesterday/i.test(home.fresh)) score += 1;

  return clamp(Math.round(score), 34, 99);
}

function priority(home) {
  return travelFit(home) - (Number(state.seen[home.id] || 0) * 18) - (state.favorites.has(home.id) ? 3 : 0);
}

function candidateHomes() {
  return homes
    .filter(matchesDestination)
    .filter(matchesFilter)
    .sort((a, b) => priority(b) - priority(a) || travelFit(b) - travelFit(a) || a.price - b.price);
}

function current() {
  const items = candidateHomes();
  if (!items.length) return null;
  const stillVisible = items.find((home) => home.id === state.currentId);
  if (stillVisible) return stillVisible;
  state.currentId = items[0].id;
  return items[0];
}

function money(value) {
  if (!value) return 'цена по запросу';
  return `$${Number(value).toLocaleString('en-US')}/mo`;
}

function haptic(type = 'light') {
  try {
    tg?.HapticFeedback?.impactOccurred(type);
  } catch {
    // ignore
  }
}

function toast(message) {
  const node = $('toast');
  if (!node) return;
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('show'), 1700);
}

function saveState() {
  writeJSON(STORAGE.favorites, [...state.favorites]);
  writeJSON(STORAGE.seen, state.seen);
  $('favCount').textContent = String(state.favorites.size);
}

function savePrefs() {
  writeJSON(STORAGE.prefs, state.prefs);
}

async function loadHomes() {
  try {
    const response = await fetch(`${API_BASE}/api/listings`);
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const nextHomes = await response.json();
    if (Array.isArray(nextHomes) && nextHomes.length) homes = nextHomes.map(normalizeHome);
  } catch (error) {
    console.warn('Using fallback listings:', error);
  }
}

function reasonChips(home, max = 4) {
  const reasons = [];
  if (home.price > 0 && home.price <= state.prefs.budget) reasons.push('в бюджете');
  if (home.price > state.prefs.budget && home.price <= state.prefs.budget * 1.15) reasons.push('чуть выше бюджета');
  for (const vibe of state.prefs.vibes || []) {
    if (hasVibe(home, vibe)) reasons.push(vibeLabels[vibe] || vibe);
  }
  const beds = bedrooms(home);
  if (beds !== null && state.prefs.bedrooms !== 'studio' && beds >= Number(state.prefs.bedrooms || 1)) reasons.push(`${beds || 'студия'} спал.`);
  if (state.prefs.bedrooms === 'studio' && beds === 0) reasons.push('студия');
  if (/сегодня|час|today|hour/i.test(home.fresh)) reasons.push('свежее');
  if (home.petFriendly) reasons.push('pet ok');
  if (!reasons.length) reasons.push('интересный вайб');
  return [...new Set(reasons)].slice(0, max);
}

function specMarkup(spec) {
  const parts = String(spec).trim().split(/\s+/);
  const main = parts.shift() || spec;
  const rest = parts.join(' ') || 'деталь';
  return `<div class="spec"><b>${escapeHTML(main)}</b><span>${escapeHTML(rest)}</span></div>`;
}

function cardPreviewMarkup(home) {
  const seenCount = Number(state.seen[home.id] || 0);
  return `
    <div class="photo-wrap">
      <img src="${escapeHTML(home.photos[0])}" alt="${escapeHTML(home.title)}" draggable="false" />
      <div class="photo-shade"></div>
      <div class="source-row">
        <span>${escapeHTML(home.source)}</span>
        <span>${escapeHTML(home.fresh)}</span>
      </div>
      <div class="dots">${home.photos.map((_, idx) => `<span class="${idx === 0 ? 'active' : ''}"></span>`).join('')}</div>
      <div class="price">${money(home.price)}</div>
    </div>

    <div class="card-copy">
      <div class="card-topline">
        <p class="area">${escapeHTML(home.area)}</p>
        <span class="seen-pill ${seenCount ? 'seen' : ''}">${seenCount ? `видели ${seenCount}×` : 'новое'}</span>
      </div>
      <h1>${escapeHTML(home.title)}</h1>
      <div class="match-reasons">${reasonChips(home, 3).map((reason) => `<span>${escapeHTML(reason)}</span>`).join('')}</div>
      <div class="specs">${home.specs.slice(0, 3).map(specMarkup).join('')}</div>
      <p class="description">${escapeHTML(home.about)}</p>
      <div class="tags">${home.tags.slice(0, 6).map((tag) => `<span>${escapeHTML(tag)}</span>`).join('')}</div>
    </div>
  `;
}

function renderStackCards(currentHome) {
  const stackHomes = candidateHomes().filter((home) => home.id !== currentHome?.id);
  const nextCard = $('nextHomeCard');
  const thirdCard = $('thirdHomeCard');
  const nextHome = stackHomes[0] || null;
  const thirdHome = stackHomes[1] || null;

  nextCard.classList.toggle('is-hidden', !nextHome);
  nextCard.innerHTML = nextHome ? cardPreviewMarkup(nextHome) : '';

  thirdCard.classList.toggle('is-hidden', !thirdHome);
  thirdCard.innerHTML = thirdHome ? cardPreviewMarkup(thirdHome) : '';
}

function setEmptyCard() {
  const card = $('homeCard');
  $('deckStack').classList.remove('promoting');
  $('nextHomeCard').classList.add('is-hidden');
  $('nextHomeCard').innerHTML = '';
  $('thirdHomeCard').classList.add('is-hidden');
  $('thirdHomeCard').innerHTML = '';
  card.classList.add('empty-card');
  $('positionLabel').textContent = 'нет вариантов';
  $('scoreLabel').textContent = 'измените фильтр';
  $('homePhoto').removeAttribute('src');
  $('homePhoto').alt = '';
  $('sourceBadge').textContent = 'VietNest';
  $('freshBadge').textContent = '';
  $('priceLabel').textContent = '';
  $('areaLabel').textContent = destinations[state.prefs.destination] || 'Вьетнам';
  $('seenPill').textContent = 'пауза';
  $('seenPill').classList.remove('seen');
  $('titleLabel').textContent = 'Под этот режим ничего не нашлось';
  $('matchReasons').innerHTML = '<span>попробуйте другой вайб</span><span>или весь Вьетнам</span>';
  $('specs').innerHTML = '';
  $('description').textContent = 'Свайп-флоу оставляем, но выборка должна быть шире: откройте настройки или переключите быстрый режим.';
  $('tags').innerHTML = '';
  $('photoDots').innerHTML = '';
}

function renderDeck() {
  const items = candidateHomes();
  const home = current();
  const card = $('homeCard');
  $('deckStack').classList.remove('promoting');
  card.classList.remove('exit-left', 'exit-right', 'dragging', 'like-preview', 'nope-preview');
  card.style.transform = '';

  if (!home) {
    setEmptyCard();
    return;
  }

  card.classList.remove('empty-card');
  renderStackCards(home);
  state.photo = clamp(state.photo, 0, Math.max(home.photos.length - 1, 0));
  const seenCount = Number(state.seen[home.id] || 0);
  const unseen = items.filter((item) => !state.seen[item.id]).length;
  const totalSwipes = Object.values(state.seen).reduce((sum, count) => sum + Number(count || 0), 0);

  $('positionLabel').textContent = `новых ${unseen} · свайпов ${totalSwipes}`;
  $('scoreLabel').textContent = `${travelFit(home)}% fit`;
  $('sourceBadge').textContent = home.source;
  $('freshBadge').textContent = home.fresh;
  $('homePhoto').src = home.photos[state.photo];
  $('homePhoto').alt = home.title;
  $('priceLabel').textContent = money(home.price);
  $('areaLabel').textContent = home.area;
  $('seenPill').textContent = seenCount ? `видели ${seenCount}×` : 'новое';
  $('seenPill').classList.toggle('seen', seenCount > 0);
  $('titleLabel').textContent = home.title;
  $('matchReasons').innerHTML = reasonChips(home, 3).map((reason) => `<span>${escapeHTML(reason)}</span>`).join('');
  $('specs').innerHTML = home.specs.slice(0, 3).map(specMarkup).join('');
  $('description').textContent = home.about;
  $('tags').innerHTML = home.tags.slice(0, 6).map((tag) => `<span>${escapeHTML(tag)}</span>`).join('');
  $('photoDots').innerHTML = home.photos.map((_, idx) => `<span class="${idx === state.photo ? 'active' : ''}"></span>`).join('');

  const saved = state.favorites.has(home.id);
  $('saveBtn').innerHTML = saved ? '<span>♥</span><b>Сохранено</b>' : '<span>♥</span><b>В шортлист</b>';
}

function nextCandidateAfter(homeId) {
  const next = candidateHomes().find((home) => home.id !== homeId) || candidateHomes()[0] || null;
  state.currentId = next?.id || null;
  state.photo = 0;
}

function markSeen(home) {
  if (!home) return;
  state.seen[home.id] = Number(state.seen[home.id] || 0) + 1;
}

function animateAndAdvance(direction, done) {
  const card = $('homeCard');
  const stack = $('deckStack');
  state.animating = true;
  card.classList.remove('like-preview', 'nope-preview');
  stack.classList.add('promoting');
  card.classList.add(direction === 'right' ? 'exit-right' : 'exit-left');
  window.setTimeout(() => {
    done?.();
    state.animating = false;
    stack.classList.remove('promoting');
    render();
  }, 260);
}

function saveCurrent() {
  if (state.animating) return;
  const home = current();
  if (!home) return;
  state.favorites.add(home.id);
  markSeen(home);
  saveState();
  haptic('medium');
  animateAndAdvance('right', () => nextCandidateAfter(home.id));
  toast('Сохранено — контакт открыт в шортлисте');
}

function skipCurrent() {
  if (state.animating) return;
  const home = current();
  if (!home) return;
  markSeen(home);
  saveState();
  haptic('light');
  animateAndAdvance('left', () => nextCandidateAfter(home.id));
}

function changePhoto(delta) {
  const home = current();
  if (!home || home.photos.length < 2) return;
  state.photo = (state.photo + delta + home.photos.length) % home.photos.length;
  renderDeck();
}

function outreachMessage(home) {
  return `Hi! Is this place still available? I’m looking for a monthly stay in ${home.area}. Budget around ${money(state.prefs.budget)}, move-in flexible. Could you confirm the deposit, utilities, contract length and viewing time?`;
}

async function copy(text, success = 'Скопировано') {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
  toast(success);
  haptic('light');
}

function openUrl(url) {
  if (!url) return;
  try {
    if (tg?.openLink) tg.openLink(url);
    else window.open(url, '_blank', 'noopener');
  } catch {
    window.location.href = url;
  }
}

function openDialog(dialog) {
  if (!dialog) return;
  if (typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal();
  else dialog.setAttribute('open', '');
}

function closeDialog(dialog) {
  if (!dialog) return;
  if (typeof dialog.close === 'function' && dialog.open) dialog.close();
  else dialog.removeAttribute('open');
}

function detailItems(home) {
  const base = [
    [money(home.price), 'месячно'],
    [home.type === 'villa' ? 'дом/вилла' : 'апартамент', 'тип'],
    [home.fresh, 'свежесть'],
    [destinations[home.city] || home.city, 'город'],
  ];
  const details = home.details.slice(0, 4).map((detail) => {
    const parts = String(detail).split(' ');
    const main = parts.slice(0, 2).join(' ');
    const caption = parts.slice(2).join(' ') || 'условие';
    return [main, caption];
  });
  return [...base, ...details].slice(0, 8);
}

function syncContact(home) {
  const saved = state.favorites.has(home.id);
  $('contactLock').classList.toggle('hidden', saved);
  $('contactCard').classList.toggle('hidden', !saved);
  $('sheetPrimary').textContent = saved ? 'Открыть объявление' : 'Сохранить и открыть';
  if (saved) {
    $('contactName').textContent = home.contact.name;
    $('contactLine').textContent = home.contact.line;
  }
}

function openDetails(home = current()) {
  if (!home) return;
  state.activeDetailId = home.id;
  $('sheetArea').textContent = home.area;
  $('sheetTitle').textContent = home.title;
  $('sheetGallery').innerHTML = home.photos.map((photo, idx) => `<img src="${escapeHTML(photo)}" alt="${escapeHTML(home.title)} фото ${idx + 1}">`).join('');
  $('sheetReasons').innerHTML = reasonChips(home, 6).map((reason) => `<span>${escapeHTML(reason)}</span>`).join('');
  $('detailGrid').innerHTML = detailItems(home).map(([main, caption]) => `
    <div class="detail-item"><b>${escapeHTML(main)}</b><span>${escapeHTML(caption)}</span></div>
  `).join('');
  $('sheetDescription').textContent = home.about;
  syncContact(home);
  openDialog($('detailsSheet'));
}

function activeDetail() {
  return homes.find((home) => home.id === state.activeDetailId) || current();
}

function renderFavorites() {
  const list = $('savedList');
  const saved = [...state.favorites].map((id) => homes.find((home) => home.id === id)).filter(Boolean);

  if (!saved.length) {
    list.innerHTML = '<div class="empty"><strong>Шортлист пуст.</strong><br>Свайпни вправо понравившийся вариант — здесь сразу появятся контакт, FB-ссылка и текст первого сообщения.</div>';
    return;
  }

  list.innerHTML = saved.map((home) => `
    <article class="saved-card" data-id="${escapeHTML(home.id)}">
      <img src="${escapeHTML(home.photos[0])}" alt="${escapeHTML(home.title)}">
      <div class="saved-copy">
        <div>
          <div class="saved-meta"><span>${escapeHTML(home.area)}</span><span>${money(home.price)}</span></div>
          <h3>${escapeHTML(home.title)}</h3>
          <p class="saved-contact">${escapeHTML(home.contact.name)} · ${escapeHTML(home.contact.line)}</p>
        </div>
        <div class="saved-actions">
          <button class="mini-btn" data-action="details" type="button">Детали</button>
          <button class="mini-btn" data-action="copy" type="button">Контакт</button>
          <button class="mini-btn" data-action="message" type="button">Сообщение</button>
          <button class="mini-btn primary-mini" data-action="fb" type="button">FB</button>
          <button class="mini-btn" data-action="remove" type="button">Убрать</button>
        </div>
      </div>
    </article>
  `).join('');
}

function compactPrefsSummary() {
  const vibes = state.prefs.vibes.map((vibe) => vibeLabels[vibe] || vibe).slice(0, 2).join(' · ');
  return `${destinations[state.prefs.destination] || 'Вьетнам'} · ${vibes || 'поездка'} · до $${Number(state.prefs.budget).toLocaleString('en-US')}`;
}

function tripSubline() {
  const beds = state.prefs.bedrooms === 'studio' ? 'студия' : `${state.prefs.bedrooms}+ спальня`;
  const traveler = travelerLabels[state.prefs.traveler] || 'поездка';
  return `${traveler} · ${beds} · просмотренные ниже`;
}

function updatePreferenceUI() {
  $('cityLabel').textContent = destinations[state.prefs.destination] || 'Вьетнам';
  $('tripSummary').textContent = compactPrefsSummary();
  $('tripSubline').textContent = tripSubline();
  $('planSummary').textContent = tripSubline();
  $('brandSubtitle').textContent = state.prefs.destination === 'all' ? 'лучшие варианты по Вьетнаму' : `${destinations[state.prefs.destination]} для поездки`;
  updateOnboardingUI();
}

function renderPlan() {
  const filtered = candidateHomes();
  $('statSeen').textContent = String(Object.values(state.seen).reduce((sum, count) => sum + Number(count || 0), 0));
  $('statSaved').textContent = String(state.favorites.size);
  $('statFresh').textContent = String(filtered.filter((home) => !state.seen[home.id]).length);
  $('planSummary').textContent = tripSubline();
}

function render() {
  updatePreferenceUI();
  renderDeck();
  if (state.screen === 'favorites') renderFavorites();
  renderPlan();
  saveState();
}

function updateOnboardingUI() {
  $$('[data-choice]').forEach((group) => {
    const key = group.dataset.choice;
    const mode = group.dataset.mode;
    $$('button[data-value]', group).forEach((button) => {
      const value = button.dataset.value;
      const active = mode === 'multi' ? (state.prefs[key] || []).includes(value) : state.prefs[key] === value;
      button.classList.toggle('active', active);
    });
  });
  $('budgetRange').value = String(state.prefs.budget);
  $('budgetValue').textContent = `до $${Number(state.prefs.budget).toLocaleString('en-US')}`;
}

function openOnboarding() {
  updateOnboardingUI();
  openDialog($('onboardingSheet'));
}

function resetPrefs() {
  state.prefs = { ...defaultPrefs, vibes: [...defaultPrefs.vibes] };
  state.filter = 'best';
  state.currentId = null;
  state.photo = 0;
  savePrefs();
  updateOnboardingUI();
  $$('[data-filter]').forEach((chip) => chip.classList.toggle('active', chip.dataset.filter === state.filter));
}

function applyPrefsFromOnboarding() {
  state.prefs.budget = Number($('budgetRange').value || defaultPrefs.budget);
  state.currentId = null;
  state.photo = 0;
  setFlag(STORAGE.onboarded);
  savePrefs();
  closeDialog($('onboardingSheet'));
  setScreen('discover');
  render();
  toast('Лента пересобрана под поездку');
}

function setDestination(destination) {
  state.prefs.destination = destination;
  state.currentId = null;
  state.photo = 0;
  savePrefs();
  render();
}

function setFilter(filter) {
  state.filter = filter;
  state.currentId = null;
  state.photo = 0;
  $$('.filter-chip').forEach((chip) => chip.classList.toggle('active', chip.dataset.filter === filter));
  render();
}

function setScreen(name) {
  state.screen = name;
  $$('.screen').forEach((screen) => screen.classList.remove('active'));
  $$('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.screen === name));
  $(`${name}Screen`).classList.add('active');
  if (name === 'favorites') renderFavorites();
  if (name === 'plan') renderPlan();
}

function bindOnboarding() {
  $$('[data-choice]').forEach((group) => {
    group.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-value]');
      if (!button) return;
      const key = group.dataset.choice;
      const mode = group.dataset.mode;
      const value = button.dataset.value;

      if (mode === 'multi') {
        const values = new Set(state.prefs[key] || []);
        if (values.has(value)) values.delete(value);
        else values.add(value);
        state.prefs[key] = [...values];
      } else {
        state.prefs[key] = value;
      }
      updateOnboardingUI();
    });
  });

  $('budgetRange').addEventListener('input', (event) => {
    state.prefs.budget = Number(event.target.value);
    $('budgetValue').textContent = `до $${Number(state.prefs.budget).toLocaleString('en-US')}`;
  });
  $('applyPrefs').addEventListener('click', applyPrefsFromOnboarding);
  $('resetPrefs').addEventListener('click', resetPrefs);
  $('closeOnboarding').addEventListener('click', () => {
    if (!readFlag(STORAGE.onboarded)) applyPrefsFromOnboarding();
    else closeDialog($('onboardingSheet'));
  });
}

function bindDrag() {
  const card = $('homeCard');
  let startX = 0;
  let startY = 0;
  let dx = 0;
  let dragging = false;
  let horizontal = false;
  let pointerId = null;

  card.addEventListener('pointerdown', (event) => {
    if (state.animating || event.target.closest('button') || !current()) return;
    dragging = true;
    horizontal = false;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    dx = 0;
    card.classList.add('dragging');
    card.setPointerCapture?.(pointerId);
  });

  card.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    dx = event.clientX - startX;
    const dy = event.clientY - startY;

    if (!horizontal) {
      if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) return;
      if (Math.abs(dx) < 8) return;
      horizontal = true;
    }

    event.preventDefault();
    const limited = clamp(dx, -156, 156);
    card.style.transform = `translateX(${limited}px) translateY(${-Math.min(Math.abs(limited) / 24, 8)}px) rotate(${clamp(limited / 18, -8, 8)}deg)`;
    card.classList.toggle('like-preview', limited > 72);
    card.classList.toggle('nope-preview', limited < -72);
  });

  function finish() {
    if (!dragging) return;
    dragging = false;
    horizontal = false;
    card.classList.remove('dragging', 'like-preview', 'nope-preview');
    if (pointerId !== null && card.hasPointerCapture?.(pointerId)) card.releasePointerCapture(pointerId);
    if (dx > 96) return saveCurrent();
    if (dx < -96) return skipCurrent();
    card.style.transform = '';
  }

  card.addEventListener('pointerup', finish);
  card.addEventListener('pointercancel', finish);
}

function bindDialogBackdrop(dialog) {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog(dialog);
  });
}

function bind() {
  $('skipBtn').addEventListener('click', skipCurrent);
  $('saveBtn').addEventListener('click', saveCurrent);
  $('detailsBtn').addEventListener('click', () => openDetails());
  $('prevPhoto').addEventListener('click', () => changePhoto(-1));
  $('nextPhoto').addEventListener('click', () => changePhoto(1));
  $('favShortcut').addEventListener('click', () => setScreen('favorites'));
  $('editPrefsBtn').addEventListener('click', openOnboarding);
  $('openOnboardingFromPlan').addEventListener('click', openOnboarding);
  $('closeSheet').addEventListener('click', () => closeDialog($('detailsSheet')));
  $('sheetSecondary').addEventListener('click', () => closeDialog($('detailsSheet')));
  $('cityBtn').addEventListener('click', () => openDialog($('citySheet')));
  $('closeCity').addEventListener('click', () => closeDialog($('citySheet')));
  $('clearBtn').addEventListener('click', () => {
    state.favorites.clear();
    saveState();
    render();
    toast('Шортлист очищен');
  });
  $('resetSeenBtn').addEventListener('click', () => {
    state.seen = {};
    state.currentId = null;
    saveState();
    render();
    toast('Просмотренные снова наверху');
  });
  $('copyContact').addEventListener('click', () => {
    const home = activeDetail();
    if (home) copy(`${home.contact.name}: ${home.contact.value}`, 'Контакт скопирован');
  });
  $('copyMessage').addEventListener('click', () => {
    const home = activeDetail();
    if (home) copy(outreachMessage(home), 'Сообщение скопировано');
  });
  $('sheetPrimary').addEventListener('click', () => {
    const home = activeDetail();
    if (!home) return;
    if (!state.favorites.has(home.id)) {
      state.favorites.add(home.id);
      saveState();
      syncContact(home);
      render();
      toast('Контакт открыт');
      return;
    }
    openUrl(home.fbUrl);
  });

  $$('.filter-chip').forEach((chip) => chip.addEventListener('click', () => setFilter(chip.dataset.filter)));
  $$('.city-options button').forEach((button) => {
    button.addEventListener('click', () => {
      setDestination(button.dataset.destination);
      closeDialog($('citySheet'));
      toast(`${destinations[state.prefs.destination]} выбран`);
    });
  });
  $$('.tab').forEach((tab) => tab.addEventListener('click', () => setScreen(tab.dataset.screen)));

  $('savedList').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    const card = event.target.closest('.saved-card');
    if (!button || !card) return;
    const home = homes.find((item) => item.id === card.dataset.id);
    if (!home) return;
    if (button.dataset.action === 'details') openDetails(home);
    if (button.dataset.action === 'copy') copy(`${home.contact.name}: ${home.contact.value}`, 'Контакт скопирован');
    if (button.dataset.action === 'message') copy(outreachMessage(home), 'Сообщение скопировано');
    if (button.dataset.action === 'fb') openUrl(home.fbUrl);
    if (button.dataset.action === 'remove') {
      state.favorites.delete(home.id);
      saveState();
      render();
      toast('Убрано из шортлиста');
    }
  });

  window.addEventListener('keydown', (event) => {
    if ($('onboardingSheet').open || $('detailsSheet').open || $('citySheet').open) return;
    if (event.key === 'ArrowLeft') skipCurrent();
    if (event.key === 'ArrowRight') saveCurrent();
    if (event.key === 'ArrowUp') openDetails();
  });

  bindOnboarding();
  bindDrag();
  bindDialogBackdrop($('detailsSheet'));
  bindDialogBackdrop($('citySheet'));
  bindDialogBackdrop($('onboardingSheet'));
}

function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
}

window.addEventListener('load', initTelegram);
setTimeout(initTelegram, 400);

(async function boot() {
  bind();
  saveState();
  updatePreferenceUI();
  await loadHomes();
  updatePreferenceUI();
  state.currentId = candidateHomes()[0]?.id || null;
  render();
  if (!readFlag(STORAGE.onboarded)) setTimeout(openOnboarding, 160);
})();
