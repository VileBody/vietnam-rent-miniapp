const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
const API_BASE = window.VIETNEST_API_BASE || (window.location.port === '5174' ? 'http://127.0.0.1:8080' : '');
const UI_THEME = window.VIETNEST_UI_THEME === 'warm' ? 'warm' : 'crisp';

applyTheme();

const STORAGE = {
  favorites: 'vietnest:reference:v1:favorites',
  seen: 'vietnest:reference:v1:seen',
  filters: 'vietnest:reference:v1:filters',
};

function applyTheme() {
  document.documentElement.dataset.theme = UI_THEME;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', UI_THEME === 'warm' ? '#f4ede2' : '#eceff5');
}

const cityLabels = {
  all: 'All Vietnam',
  danang: 'Da Nang',
  hcmc: 'Ho Chi Minh',
  hoian: 'Hoi An',
  nhatrang: 'Nha Trang',
  phuquoc: 'Phu Quoc',
};

const cityOptions = [
  ['all', 'All Vietnam'],
  ['danang', 'Da Nang'],
  ['nhatrang', 'Nha Trang'],
  ['hoian', 'Hoi An'],
  ['hcmc', 'Ho Chi Minh'],
  ['phuquoc', 'Phu Quoc'],
];

const typeOptions = [
  ['all', 'Any'],
  ['apartment', 'Apartment'],
  ['villa', 'Villa'],
];

const bedOptions = [
  ['any', 'Any'],
  ['studio', 'Studio'],
  ['1', '1+'],
  ['2', '2+'],
  ['3', '3+'],
];

const defaultFilters = {
  city: 'all',
  type: 'all',
  beds: 'any',
  budget: 2500,
  furnished: false,
};

const $ = (id) => document.getElementById(id);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const fallbackHomes = [
  {
    id: 'fallback-danang',
    title: 'Apartment With Balcony & Han River View Pool',
    area: 'Son Tra, Da Nang',
    city: 'danang',
    type: 'apartment',
    price: 320,
    score: 91,
    source: 'Demo',
    fresh: 'seen today',
    specs: ['$320/mo', '1 bed', 'Da Nang'],
    details: ['Fallback listing'],
    tags: ['balcony', 'pool', 'furnished'],
    about: 'Demo fallback listing used only when the API is unavailable.',
    contact: { name: 'Facebook Marketplace', line: 'Open original listing', value: 'https://www.facebook.com/marketplace/' },
    fbUrl: 'https://www.facebook.com/marketplace/',
    photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&q=82&auto=format&fit=crop'],
    petFriendly: false,
  },
];

let homes = fallbackHomes.map(normalizeHome);

const state = {
  screen: 'discover',
  activeDetailId: null,
  queue: [],
  history: [],
  animating: false,
  favorites: new Set(readJSON(STORAGE.favorites, [])),
  seen: normalizeSeen(readJSON(STORAGE.seen, {})),
  filters: normalizeFilters(readJSON(STORAGE.filters, defaultFilters)),
};

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
    // LocalStorage can be unavailable in embedded contexts.
  }
}

function normalizeSeen(value) {
  if (Array.isArray(value)) return Object.fromEntries(value.map((id) => [String(id), 1]));
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(Object.entries(value).map(([id, count]) => [String(id), Number(count) || 1]));
}

function normalizeFilters(value) {
  const filters = { ...defaultFilters, ...(value || {}) };
  filters.budget = clamp(Number(filters.budget) || defaultFilters.budget, 120, 6000);
  filters.city = cityLabels[filters.city] ? filters.city : 'all';
  filters.type = ['all', 'apartment', 'villa'].includes(filters.type) ? filters.type : 'all';
  filters.beds = ['any', 'studio', '1', '2', '3'].includes(String(filters.beds)) ? String(filters.beds) : 'any';
  filters.furnished = Boolean(filters.furnished);
  return filters;
}

function saveState() {
  writeJSON(STORAGE.favorites, [...state.favorites]);
  writeJSON(STORAGE.seen, state.seen);
  writeJSON(STORAGE.filters, state.filters);
}

function escapeHTML(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function cleanText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function normalizeHome(raw) {
  const photos = Array.isArray(raw.photos) && raw.photos.length
    ? raw.photos.filter(Boolean)
    : fallbackHomes[0].photos;
  const tags = Array.isArray(raw.tags) ? raw.tags.map(cleanText).filter(Boolean) : [];
  const specs = Array.isArray(raw.specs) ? raw.specs.map(cleanText).filter(Boolean) : [];
  const details = Array.isArray(raw.details) ? raw.details.map(cleanText).filter(Boolean) : [];
  const title = cleanText(raw.title || 'Apartment in Vietnam');
  const about = cleanText(raw.about || raw.description || title);
  const source = cleanText(raw.source || 'Facebook Marketplace');
  const city = cleanText(raw.city || 'all').toLowerCase();
  const type = normalizeType(raw.type || raw.home_type || raw.property_type || title);
  const pool = [title, about, raw.area, type, ...tags, ...specs, ...details].join(' ').toLowerCase();

  return {
    id: String(raw.id || raw.externalId || raw.external_id || `${city}-${title}`),
    title,
    area: cleanText(raw.area || cityLabels[city] || 'Vietnam'),
    city,
    type,
    price: Number(raw.price || raw.priceUsd || raw.price_usd || 0),
    score: clamp(Number(raw.score || raw.matchScore || raw.match_score || 76), 0, 99),
    source,
    fresh: cleanText(raw.fresh || 'seen today'),
    specs,
    details,
    tags,
    about,
    contact: {
      name: cleanText(raw.contact?.name || raw.contactName || 'Facebook Marketplace'),
      line: cleanText(raw.contact?.line || raw.contactLine || 'Open original listing'),
      value: cleanText(raw.contact?.value || raw.contactValue || raw.fbUrl || raw.fb_url || ''),
    },
    fbUrl: cleanText(raw.fbUrl || raw.fb_url || raw.sourceUrl || raw.source_url || raw.contact?.value || 'https://www.facebook.com/marketplace/'),
    photos,
    petFriendly: Boolean(raw.petFriendly || raw.pet_friendly || /pet|питом|живот/.test(pool)),
    furnished: /furnished|fully furnished|мебел|меблир|furniture/.test(pool),
    beds: inferBedrooms(pool),
  };
}

function normalizeType(value) {
  const text = String(value).toLowerCase();
  if (/villa|house|home|bungalow|вилла|дом/.test(text)) return 'villa';
  return 'apartment';
}

function inferBedrooms(text) {
  if (/studio|студ/.test(text)) return 0;
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*(bed|br|bedroom|спальн)/i);
  if (!match) return null;
  const value = Number(match[1].replace(',', '.'));
  return value > 0 && value <= 20 ? value : null;
}

function textPool(home) {
  return [home.title, home.area, home.type, home.about, ...home.specs, ...home.details, ...home.tags].join(' ').toLowerCase();
}

function matchesFilters(home) {
  const filters = state.filters;
  if (filters.city !== 'all' && home.city !== filters.city) return false;
  if (filters.type !== 'all' && home.type !== filters.type) return false;
  if (home.price && home.price > filters.budget) return false;
  if (filters.furnished && !home.furnished) return false;
  if (filters.beds === 'studio') return home.beds === 0 || /studio|студ/.test(textPool(home));
  if (filters.beds !== 'any' && home.beds !== null && home.beds < Number(filters.beds)) return false;
  return true;
}

function fitScore(home) {
  let score = Number(home.score || 76);
  if (home.price && home.price <= state.filters.budget) score += 4;
  if (home.furnished) score += 3;
  if (home.petFriendly) score += 2;
  score -= Number(state.seen[home.id] || 0) * 12;
  return clamp(Math.round(score), 34, 99);
}

function filteredHomes() {
  return homes
    .filter(matchesFilters)
    .sort((a, b) => fitScore(b) - fitScore(a) || Number(a.price || 999999) - Number(b.price || 999999));
}

function ensureQueue() {
  const candidates = filteredHomes();
  const valid = new Set(candidates.map((home) => home.id));
  state.queue = state.queue.filter((id) => valid.has(id));

  if (!state.queue.length) {
    state.queue = candidates.filter((home) => !state.seen[home.id]).map((home) => home.id);
  }
  return state.queue.map((id) => homes.find((home) => home.id === id)).filter(Boolean);
}

function resetQueue({ clearSeen = false } = {}) {
  if (clearSeen) state.seen = {};
  state.queue = [];
  state.history = [];
  saveState();
}

function currentHome() {
  return ensureQueue()[0] || null;
}

function money(value) {
  if (!value) return 'Price on request';
  return `$${Number(value).toLocaleString('en-US')}`;
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
  node.textContent = message;
  node.classList.add('is-visible');
  clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => node.classList.remove('is-visible'), 1600);
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

function cardPosition(depth) {
  return `translateY(${depth * 12}px) scale(${1 - depth * 0.045})`;
}

function specIcon(index) {
  const icons = [
    '<svg viewBox="0 0 24 24"><path d="M3 11.5V7M3 18v-3h18v3M21 11.5V9a2 2 0 00-2-2h-6v6M3 11.5h18"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M4 16L16 4l4 4L8 20zM8 11l1.5 1.5M12 7l1.5 1.5"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M12 21s-6-5.3-6-10a6 6 0 1112 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>',
  ];
  return icons[index % icons.length];
}

function displaySpecs(home) {
  const specs = [];
  if (home.beds === 0) specs.push('Studio');
  else if (home.beds) specs.push(`${home.beds} BR`);
  const areaSpec = home.specs.find((spec) => /m²|sqm|кв/i.test(spec));
  if (areaSpec) specs.push(areaSpec.replace(/^\$\S+\s*/, ''));
  const city = cityLabels[home.city] || home.area || 'Vietnam';
  specs.push(city);
  return specs.length ? specs.slice(0, 3) : home.specs.slice(0, 3);
}

function cardMarkup(home, depth) {
  const photo = home.photos[0];
  const specs = displaySpecs(home);
  return `
    <div class="photo">
      <img src="${escapeHTML(photo)}" alt="${escapeHTML(home.title)}" draggable="false" />
      <div class="shade"></div>
    </div>
    <div class="card-chips">
      <div class="chip-line">
        <span class="glass-chip solid">${escapeHTML(home.type === 'villa' ? 'Villa' : 'Apartment')}</span>
        ${home.furnished ? '<span class="glass-chip">Furnished</span>' : ''}
      </div>
      <span class="glass-chip">${escapeHTML(home.fresh || home.source)}</span>
    </div>
    <div class="stamp like">LIKE</div>
    <div class="stamp skip">SKIP</div>
    <div class="card-copy">
      <div class="card-price"><strong>${escapeHTML(money(home.price))}</strong><span>/month</span></div>
      <h2>${escapeHTML(home.area)}</h2>
      <p>${escapeHTML(home.title)}</p>
      <div class="card-specs">
        ${specs.map((spec, index) => `<span>${specIcon(index)}${escapeHTML(spec)}</span>`).join('')}
      </div>
    </div>
  `;
}

function renderDeck() {
  const deck = $('deck');
  deck.querySelectorAll('.home-card').forEach((card) => card.remove());
  $('emptyState').classList.remove('is-visible');

  const queue = ensureQueue();
  if (!queue.length) {
    $('emptyState').classList.add('is-visible');
    return;
  }

  queue.slice(0, 3).reverse().forEach((home, reverseIndex, stack) => {
    const depth = stack.length - reverseIndex - 1;
    const card = document.createElement('article');
    card.className = `home-card${depth === 0 ? ' is-top' : ''}`;
    card.dataset.id = home.id;
    card.dataset.depth = String(depth);
    card.style.zIndex = String(20 - depth);
    card.style.transform = cardPosition(depth);
    card.innerHTML = cardMarkup(home, depth);
    deck.appendChild(card);
    if (depth === 0) attachDrag(card);
  });
}

function animateStackBehind() {
  $$('.home-card[data-depth="1"], .home-card[data-depth="2"]', $('deck')).forEach((card) => {
    const nextDepth = Math.max(0, Number(card.dataset.depth) - 1);
    card.style.transition = 'transform .42s cubic-bezier(.22, 1, .36, 1)';
    card.style.transform = cardPosition(nextDepth);
  });
}

function flyToBadge(card) {
  const layer = $('flyLayer');
  const target = $('shortlistTab');
  const layerRect = layer.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const fly = document.createElement('div');
  fly.className = 'fly-heart';
  fly.textContent = '♥';
  const x0 = cardRect.left - layerRect.left + cardRect.width / 2 - 17;
  const y0 = cardRect.top - layerRect.top + cardRect.height / 2 - 17;
  const x1 = targetRect.left - layerRect.left + targetRect.width / 2 - 17;
  const y1 = targetRect.top - layerRect.top + targetRect.height / 2 - 17;
  fly.style.left = `${x0}px`;
  fly.style.top = `${y0}px`;
  layer.appendChild(fly);
  requestAnimationFrame(() => {
    fly.style.transform = `translate(${x1 - x0}px, ${y1 - y0}px) scale(.42)`;
    fly.style.opacity = '.2';
  });
  window.setTimeout(() => {
    fly.remove();
    $('shortlistTab').classList.remove('bump');
    void $('shortlistTab').offsetWidth;
    $('shortlistTab').classList.add('bump');
  }, 560);
}

function advance(home) {
  state.seen[home.id] = Number(state.seen[home.id] || 0) + 1;
  state.history.push(home.id);
  state.queue = state.queue.filter((id) => id !== home.id);
  saveState();
}

function animateAndAdvance(direction, { save = false } = {}) {
  if (state.animating) return;
  const home = currentHome();
  const card = $('deck').querySelector('.home-card[data-depth="0"]');
  if (!home || !card) {
    render();
    return;
  }

  state.animating = true;
  const likeStamp = card.querySelector('.stamp.like');
  const skipStamp = card.querySelector('.stamp.skip');
  if (direction === 'right') likeStamp.style.opacity = '1';
  if (direction === 'left') skipStamp.style.opacity = '1';
  animateStackBehind();

  if (save) {
    state.favorites.add(home.id);
    flyToBadge(card);
    haptic('medium');
  } else {
    haptic('light');
  }

  const x = direction === 'right' ? 520 : -520;
  const rotation = direction === 'right' ? 14 : -20;
  card.style.transition = direction === 'right'
    ? 'transform .6s cubic-bezier(.5, 0, .3, 1), opacity .55s ease-in'
    : 'transform .42s ease-in, opacity .42s';
  card.style.transform = direction === 'right'
    ? `translate(${x}px, 40px) scale(.08) rotate(${rotation}deg)`
    : `translate(${x}px, 30px) rotate(${rotation}deg)`;
  card.style.opacity = '0';

  window.setTimeout(() => {
    advance(home);
    state.animating = false;
    render();
    if (save) toast('Added to shortlist');
  }, direction === 'right' ? 600 : 420);
}

function attachDrag(card) {
  let startX = 0;
  let startY = 0;
  let dx = 0;
  let dy = 0;
  let dragging = false;
  let pointerId = null;

  card.addEventListener('pointerdown', (event) => {
    if (state.animating || event.target.closest('button')) return;
    dragging = true;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    dx = 0;
    dy = 0;
    card.classList.add('dragging');
    card.setPointerCapture?.(pointerId);
  });

  card.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    event.preventDefault();
    dx = event.clientX - startX;
    dy = event.clientY - startY;
    card.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx * .05}deg)`;
    card.querySelector('.stamp.like').style.opacity = dx > 0 ? String(clamp(dx / 110, 0, 1)) : '0';
    card.querySelector('.stamp.skip').style.opacity = dx < 0 ? String(clamp(-dx / 110, 0, 1)) : '0';
  });

  function finish(event) {
    if (!dragging) return;
    dragging = false;
    card.classList.remove('dragging');
    if (pointerId !== null && card.hasPointerCapture?.(pointerId)) card.releasePointerCapture(pointerId);
    if (dx > 105) return animateAndAdvance('right', { save: true });
    if (dx < -105) return animateAndAdvance('left');
    card.style.transition = 'transform .34s cubic-bezier(.22, 1, .36, 1), opacity .35s ease';
    card.style.transform = cardPosition(0);
    card.querySelector('.stamp.like').style.opacity = '0';
    card.querySelector('.stamp.skip').style.opacity = '0';
    event?.preventDefault();
  }

  card.addEventListener('pointerup', finish);
  card.addEventListener('pointercancel', finish);
}

function setScreen(screen) {
  state.screen = screen;
  $$('.screen').forEach((node) => node.classList.toggle('is-active', node.id === `screen-${screen}`));
  $$('.tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.screen === screen));
  if (screen === 'shortlist') renderShortlist();
  if (screen === 'filters') renderFilters();
  if (screen === 'profile') renderProfile();
  if (screen === 'discover') renderDeck();
}

function renderShortlist() {
  const list = $('shortlist');
  const saved = [...state.favorites].map((id) => homes.find((home) => home.id === id)).filter(Boolean);
  $('shortlistCount').textContent = `${saved.length} saved · ${saved.length} в избранном`;

  if (!saved.length) {
    list.innerHTML = `
      <div class="empty-list">
        <span><svg viewBox="0 0 24 24"><path d="M6 4h12v17l-6-4-6 4z"/></svg></span>
        <h3>No saved homes yet</h3>
        <p>Свайпайте вправо, чтобы сохранить.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = saved.map((home) => `
    <article class="saved-card" data-id="${escapeHTML(home.id)}">
      <img src="${escapeHTML(home.photos[0])}" alt="${escapeHTML(home.title)}" />
      <div>
        <strong>${escapeHTML(money(home.price))}<small> /mo</small></strong>
        <h3>${escapeHTML(home.area)}</h3>
        <p>${escapeHTML(displaySpecs(home).join(' · '))}</p>
      </div>
      <button class="remove" data-remove="${escapeHTML(home.id)}" type="button" aria-label="Remove">
        <svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17"/></svg>
      </button>
    </article>
  `).join('');
}

function renderFilters() {
  $('budgetRange').value = String(state.filters.budget);
  $('budgetLabel').textContent = `up to $${Number(state.filters.budget).toLocaleString('en-US')}`;
  $('furnishedToggle').classList.toggle('is-active', state.filters.furnished);
  $('cityChips').innerHTML = cityOptions.map(([value, label]) => chipButton(value, label, state.filters.city === value)).join('');
  $('typeChips').innerHTML = typeOptions.map(([value, label]) => chipButton(value, label, state.filters.type === value)).join('');
  $('bedChips').innerHTML = bedOptions.map(([value, label]) => chipButton(value, label, state.filters.beds === value)).join('');
  $('resultCount').textContent = String(filteredHomes().length);
}

function chipButton(value, label, active) {
  return `<button class="chip ${active ? 'is-active' : ''}" data-value="${escapeHTML(value)}" type="button">${escapeHTML(label)}</button>`;
}

function renderProfile() {
  const seen = Object.values(state.seen).reduce((sum, count) => sum + Number(count || 0), 0);
  $('profileSaved').textContent = String(state.favorites.size);
  $('profileSeen').textContent = String(seen);
  $('profileBudget').textContent = `$${Number(state.filters.budget).toLocaleString('en-US')}`;
  $('profileCities').textContent = cityLabels[state.filters.city] || 'All';
  $('profileType').textContent = state.filters.type === 'all' ? 'Any' : state.filters.type;
  $('profileSubtitle').textContent = state.filters.city === 'all' ? 'Looking across Vietnam' : `Looking in ${cityLabels[state.filters.city]}`;
}

function renderCounters() {
  const count = state.favorites.size;
  $('shortlistBadge').textContent = String(count);
  $('shortlistBadge').classList.toggle('is-visible', count > 0);
  if (state.screen === 'shortlist') renderShortlist();
  if (state.screen === 'profile') renderProfile();
}

function activeDetail() {
  return homes.find((home) => home.id === state.activeDetailId) || currentHome();
}

function detailSpecItems(home) {
  const specs = displaySpecs(home);
  const result = [
    [money(home.price), 'monthly'],
    [home.type === 'villa' ? 'Villa' : 'Apartment', 'type'],
    [`${fitScore(home)}%`, 'fit'],
  ];
  specs.forEach((spec) => {
    const parts = String(spec).split(/\s+/);
    result.push([parts.slice(0, 2).join(' '), parts.slice(2).join(' ') || 'detail']);
  });
  return result.slice(0, 6);
}

function openDetail(home = currentHome()) {
  if (!home) return;
  state.activeDetailId = home.id;
  $('detailHero').style.backgroundImage = `url("${home.photos[0]}")`;
  $('detailPrice').textContent = money(home.price);
  $('detailTitle').textContent = home.title;
  $('detailArea').textContent = home.area;
  $('detailScore').textContent = String(fitScore(home));
  $('detailGallery').innerHTML = home.photos.map((photo, index) => `<img src="${escapeHTML(photo)}" alt="${escapeHTML(home.title)} photo ${index + 1}" />`).join('');
  $('detailSpecs').innerHTML = detailSpecItems(home).map(([main, caption]) => `<div><strong>${escapeHTML(main)}</strong><span>${escapeHTML(caption)}</span></div>`).join('');
  $('detailAbout').textContent = home.about;
  const amenities = [...new Set([...home.tags, ...home.details])].filter(Boolean).slice(0, 10);
  $('detailAmenities').innerHTML = (amenities.length ? amenities : ['Facebook Marketplace', home.source]).map((tag) => `<span>${escapeHTML(tag)}</span>`).join('');
  $('detailPrimaryBtn').textContent = state.favorites.has(home.id) ? 'Open original listing' : 'Add to shortlist';
  $('detailOverlay').classList.add('is-open');
  $('detailOverlay').setAttribute('aria-hidden', 'false');
}

function closeDetail() {
  $('detailOverlay').classList.remove('is-open');
  $('detailOverlay').setAttribute('aria-hidden', 'true');
}

function saveDetail() {
  const home = activeDetail();
  if (!home) return;
  if (state.favorites.has(home.id)) {
    openUrl(home.fbUrl);
    return;
  }
  state.favorites.add(home.id);
  saveState();
  renderCounters();
  $('detailPrimaryBtn').textContent = 'Open original listing';
  toast('Added to shortlist');
}

async function loadHomes() {
  try {
    const response = await fetch(`${API_BASE}/api/listings`);
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const data = await response.json();
    if (Array.isArray(data) && data.length) homes = data.map(normalizeHome);
  } catch (error) {
    console.warn('Using fallback listings:', error);
  }
}

function bindFilters() {
  $('cityChips').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-value]');
    if (!button) return;
    state.filters.city = button.dataset.value;
    resetQueue();
    renderFilters();
  });

  $('typeChips').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-value]');
    if (!button) return;
    state.filters.type = button.dataset.value;
    resetQueue();
    renderFilters();
  });

  $('bedChips').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-value]');
    if (!button) return;
    state.filters.beds = button.dataset.value;
    resetQueue();
    renderFilters();
  });

  $('budgetRange').addEventListener('input', (event) => {
    state.filters.budget = Number(event.target.value);
    resetQueue();
    renderFilters();
  });

  $('furnishedToggle').addEventListener('click', () => {
    state.filters.furnished = !state.filters.furnished;
    resetQueue();
    renderFilters();
  });

  $('resetFiltersBtn').addEventListener('click', () => {
    state.filters = { ...defaultFilters };
    resetQueue();
    renderFilters();
  });

  $('applyFiltersBtn').addEventListener('click', () => {
    saveState();
    setScreen('discover');
    toast('Filters applied');
  });
}

function bind() {
  $$('.tab').forEach((tab) => tab.addEventListener('click', () => setScreen(tab.dataset.screen)));
  $('openFiltersTop').addEventListener('click', () => setScreen('filters'));
  $('skipBtn').addEventListener('click', () => animateAndAdvance('left'));
  $('likeBtn').addEventListener('click', () => animateAndAdvance('right', { save: true }));
  $('infoBtn').addEventListener('click', () => openDetail());
  $('resetDeckBtn').addEventListener('click', () => {
    resetQueue({ clearSeen: true });
    render();
  });

  $('shortlist').addEventListener('click', (event) => {
    const remove = event.target.closest('button[data-remove]');
    if (remove) {
      state.favorites.delete(remove.dataset.remove);
      saveState();
      render();
      return;
    }
    const card = event.target.closest('.saved-card[data-id]');
    if (card) openDetail(homes.find((home) => home.id === card.dataset.id));
  });

  $('closeDetailBtn').addEventListener('click', closeDetail);
  $('detailLikeBtn').addEventListener('click', saveDetail);
  $('detailPrimaryBtn').addEventListener('click', saveDetail);
  $('openFbBtn').addEventListener('click', () => {
    const home = activeDetail();
    if (home) openUrl(home.fbUrl);
  });

  bindFilters();
}

function render() {
  renderDeck();
  renderCounters();
  if (state.screen === 'filters') renderFilters();
  if (state.screen === 'profile') renderProfile();
  saveState();
}

async function init() {
  try {
    tg?.ready?.();
    tg?.expand?.();
  } catch {
    // ignore Telegram SDK errors outside Telegram.
  }
  bind();
  renderFilters();
  await loadHomes();
  resetQueue();
  render();
}

init();
