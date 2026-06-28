const fallbackHomes = [
  {
    id: 'dn-mykhe-condo',
    title: 'Светлый кондо у My Khe',
    area: 'An Thuong, Da Nang',
    city: 'danang',
    type: 'apartment',
    price: 920,
    score: 92,
    source: 'FB Marketplace',
    fresh: 'сегодня',
    specs: ['2 спальни', '72 м²', '7 мин море'],
    details: ['депозит 1 мес', 'контракт от 3 мес', '12 этаж', 'заезд сейчас'],
    tags: ['бассейн', 'спортзал', 'балкон', 'pet ok'],
    about: 'Уютный апартамент в районе An Thuong: много света, рабочий стол у окна, быстрый Wi-Fi и кухня для нормальной жизни, а не только завтраков.',
    contact: { name: 'Linh Tran', line: '+84 93 822 1044 · владелец', value: '+84938221044' },
    fbUrl: 'https://www.facebook.com/marketplace/',
    photos: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=82',
    ],
  },
  {
    id: 'dn-sontra-villa',
    title: 'Тихая вилла с садом в Son Tra',
    area: 'Son Tra, Da Nang',
    city: 'danang',
    type: 'villa',
    price: 1650,
    score: 88,
    source: 'FB Marketplace',
    fresh: '2 часа назад',
    specs: ['3 спальни', '180 м²', 'сад'],
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
  },
  {
    id: 'nt-seaview-studio',
    title: 'Sea view студия в центре',
    area: 'Loc Tho, Nha Trang',
    city: 'nhatrang',
    type: 'apartment',
    price: 680,
    score: 84,
    source: 'FB Marketplace',
    fresh: 'вчера',
    specs: ['студия', '42 м²', 'вид море'],
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
  },
  {
    id: 'hcm-thaodien-loft',
    title: 'Лофт с рабочей зоной',
    area: 'Thao Dien, Ho Chi Minh City',
    city: 'hcmc',
    type: 'apartment',
    price: 1180,
    score: 81,
    source: 'FB Marketplace',
    fresh: 'сегодня',
    specs: ['1 спальня', '64 м²', 'кафе рядом'],
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
  },
  {
    id: 'hoian-garden-house',
    title: 'Дом у рисовых полей',
    area: 'Cam Chau, Hoi An',
    city: 'hoian',
    type: 'villa',
    price: 1250,
    score: 90,
    source: 'FB Marketplace',
    fresh: '3 часа назад',
    specs: ['2 спальни', '120 м²', 'терраса'],
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
  },
  {
    id: 'nt-family-apart',
    title: 'Семейный апарт у Hon Chong',
    area: 'Hon Chong, Nha Trang',
    city: 'nhatrang',
    type: 'apartment',
    price: 860,
    score: 86,
    source: 'FB Marketplace',
    fresh: 'сегодня',
    specs: ['2 спальни', '78 м²', 'детская'],
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
  },
];

let homes = [...fallbackHomes];

const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
const API_BASE = window.VIETNEST_API_BASE || (window.location.port === '5174' ? 'http://127.0.0.1:8080' : '');
const state = {
  filter: 'all',
  index: 0,
  photo: 0,
  favorites: new Set(JSON.parse(localStorage.getItem('vietnest:favorites') || '[]')),
};

const $ = (id) => document.getElementById(id);

function matchesFilter(home) {
  if (state.filter === 'all') return true;
  if (state.filter === 'villa') return home.type === 'villa';
  if (state.filter === 'pet') return home.tags.some((tag) => tag.toLowerCase().includes('pet'));
  return home.city === state.filter;
}

function list() {
  return homes.filter(matchesFilter);
}

function current() {
  const items = list();
  return items.length ? items[state.index % items.length] : null;
}

function money(value) {
  return `$${value.toLocaleString('en-US')}/mo`;
}

function haptic(type = 'light') {
  if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred(type);
}

function toast(message) {
  const node = $('toast');
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('show'), 1700);
}

function saveFavoriteState() {
  localStorage.setItem('vietnest:favorites', JSON.stringify([...state.favorites]));
  $('favCount').textContent = String(state.favorites.size);
}

async function loadHomes() {
  try {
    const response = await fetch(`${API_BASE}/api/listings`);
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const nextHomes = await response.json();
    if (Array.isArray(nextHomes) && nextHomes.length) {
      homes = nextHomes;
    }
  } catch (error) {
    console.warn('Using fallback listings:', error);
  }
}

function render() {
  const items = list();
  const home = current();
  const card = $('homeCard');
  card.classList.remove('exit-left', 'exit-right', 'dragging');
  card.style.transform = '';

  if (!home) {
    $('positionLabel').textContent = '0 / 0';
    $('scoreLabel').textContent = 'нет вариантов';
    $('homePhoto').removeAttribute('src');
    $('homePhoto').alt = '';
    $('sourceBadge').textContent = 'FB Marketplace';
    $('freshBadge').textContent = '';
    $('priceLabel').textContent = '';
    $('areaLabel').textContent = 'Vietnam';
    $('titleLabel').textContent = 'Под этот фильтр ничего нет';
    $('specs').innerHTML = '';
    $('description').textContent = 'Выберите другой город или вернитесь ко всем вариантам.';
    $('tags').innerHTML = '';
    $('photoDots').innerHTML = '';
    return;
  }

  state.photo = Math.min(state.photo, home.photos.length - 1);
  $('positionLabel').textContent = `${(state.index % items.length) + 1} / ${items.length}`;
  $('scoreLabel').textContent = `${home.score}% match`;
  $('sourceBadge').textContent = home.source;
  $('freshBadge').textContent = home.fresh;
  $('homePhoto').src = home.photos[state.photo];
  $('homePhoto').alt = home.title;
  $('priceLabel').textContent = money(home.price);
  $('areaLabel').textContent = home.area;
  $('titleLabel').textContent = home.title;
  $('description').textContent = home.about;
  $('specs').innerHTML = home.specs.map((spec) => {
    const [main, ...rest] = spec.split(' ');
    return `<div class="spec"><b>${main}</b><span>${rest.join(' ') || 'деталь'}</span></div>`;
  }).join('');
  $('tags').innerHTML = home.tags.map((tag) => `<span>${tag}</span>`).join('');
  $('photoDots').innerHTML = home.photos.map((_, idx) => `<span class="${idx === state.photo ? 'active' : ''}"></span>`).join('');
  $('saveBtn').textContent = state.favorites.has(home.id) ? '♥' : '♡';
}

function next(kind) {
  const items = list();
  if (!items.length) return;
  $('homeCard').classList.add(kind === 'yes' ? 'exit-right' : 'exit-left');
  setTimeout(() => {
    state.index = (state.index + 1) % items.length;
    state.photo = 0;
    render();
  }, 210);
}

function saveCurrent() {
  const home = current();
  if (!home) return;
  state.favorites.add(home.id);
  saveFavoriteState();
  haptic('medium');
  toast('Добавлено в избранное');
  next('yes');
}

function skipCurrent() {
  if (!current()) return;
  haptic('light');
  next('no');
}

function changePhoto(delta) {
  const home = current();
  if (!home) return;
  state.photo = (state.photo + delta + home.photos.length) % home.photos.length;
  render();
}

function openUrl(url) {
  if (tg && tg.openLink) {
    tg.openLink(url);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

async function copy(value) {
  try {
    await navigator.clipboard.writeText(value);
    toast('Контакт скопирован');
  } catch {
    toast(value);
  }
}

function openDetails(home = current()) {
  if (!home) return;
  $('sheetArea').textContent = home.area;
  $('sheetTitle').textContent = home.title;
  $('sheetDescription').textContent = home.about;
  $('contactName').textContent = home.contact.name;
  $('contactLine').textContent = home.contact.line;
  $('sheetGallery').innerHTML = home.photos.map((src) => `<img src="${src}" alt="${home.title}">`).join('');
  $('detailGrid').innerHTML = [
    ['Цена', money(home.price)],
    ['Контакт', home.contact.name],
    ['Источник', home.source],
    ['Свежесть', home.fresh],
    ...home.details.map((detail) => {
      const [label, ...rest] = detail.split(' ');
      return [label, rest.join(' ')];
    }),
  ].slice(0, 6).map(([label, value]) => `<div class="detail-item"><b>${value || label}</b><span>${value ? label : 'деталь'}</span></div>`).join('');
  $('sheetSave').textContent = state.favorites.has(home.id) ? '♥ Уже в избранном' : '♡ В избранное';
  $('sheetSave').onclick = () => {
    state.favorites.add(home.id);
    saveFavoriteState();
    $('sheetSave').textContent = '♥ Уже в избранном';
    toast('Сохранено');
  };
  $('openFb').onclick = () => openUrl(home.fbUrl);
  $('copyContact').onclick = () => copy(`${home.contact.name}: ${home.contact.value}`);
  $('detailsSheet').showModal();
}

function renderFavorites() {
  const saved = homes.filter((home) => state.favorites.has(home.id));
  if (!saved.length) {
    $('savedList').innerHTML = '<div class="empty">Пока пусто. Нажмите сердечко на карточке, и здесь появятся контакты плюс быстрый переход в Facebook Marketplace.</div>';
    return;
  }
  $('savedList').innerHTML = saved.map((home) => `
    <article class="saved-card" data-id="${home.id}">
      <img src="${home.photos[0]}" alt="${home.title}">
      <div>
        <h3>${home.title}</h3>
        <p>${home.area} · ${money(home.price)}<br>${home.contact.name} · ${home.contact.line}</p>
        <div class="saved-actions">
          <button class="mini-btn" data-action="details" type="button">Подробнее</button>
          <button class="mini-btn" data-action="copy" type="button">Контакт</button>
          <button class="mini-btn" data-action="fb" type="button">FB MP</button>
          <button class="mini-btn" data-action="remove" type="button">Убрать</button>
        </div>
      </div>
    </article>
  `).join('');
}

function setScreen(name) {
  document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.screen === name));
  $(`${name}Screen`).classList.add('active');
  if (name === 'favorites') renderFavorites();
}

function setFilter(filter) {
  state.filter = filter;
  state.index = 0;
  state.photo = 0;
  document.querySelectorAll('.filter-chip').forEach((chip) => chip.classList.toggle('active', chip.dataset.filter === filter));
  render();
}

function bindDrag() {
  const card = $('homeCard');
  let startX = 0;
  let startY = 0;
  let dx = 0;
  let dragging = false;

  card.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button')) return;
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    dx = 0;
    card.classList.add('dragging');
    card.setPointerCapture(event.pointerId);
  });

  card.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 18) return;
    card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
  });

  card.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    card.classList.remove('dragging');
    if (dx > 92) {
      saveCurrent();
      return;
    }
    if (dx < -92) {
      skipCurrent();
      return;
    }
    card.style.transform = '';
  });
}

function bind() {
  $('skipBtn').addEventListener('click', skipCurrent);
  $('saveBtn').addEventListener('click', saveCurrent);
  $('detailsBtn').addEventListener('click', () => openDetails());
  $('prevPhoto').addEventListener('click', () => changePhoto(-1));
  $('nextPhoto').addEventListener('click', () => changePhoto(1));
  $('favShortcut').addEventListener('click', () => setScreen('favorites'));
  $('closeSheet').addEventListener('click', () => $('detailsSheet').close());
  $('cityBtn').addEventListener('click', () => $('citySheet').showModal());
  $('closeCity').addEventListener('click', () => $('citySheet').close());
  $('clearBtn').addEventListener('click', () => {
    state.favorites.clear();
    saveFavoriteState();
    renderFavorites();
  });
  document.querySelectorAll('.filter-chip').forEach((chip) => {
    chip.addEventListener('click', () => setFilter(chip.dataset.filter));
  });
  document.querySelectorAll('.city-options button').forEach((button) => {
    button.addEventListener('click', () => {
      setFilter(button.dataset.filter);
      $('citySheet').close();
    });
  });
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => setScreen(tab.dataset.screen));
  });
  $('savedList').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    const card = event.target.closest('.saved-card');
    if (!button || !card) return;
    const home = homes.find((item) => item.id === card.dataset.id);
    if (!home) return;
    if (button.dataset.action === 'details') openDetails(home);
    if (button.dataset.action === 'copy') copy(`${home.contact.name}: ${home.contact.value}`);
    if (button.dataset.action === 'fb') openUrl(home.fbUrl);
    if (button.dataset.action === 'remove') {
      state.favorites.delete(home.id);
      saveFavoriteState();
      renderFavorites();
    }
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') skipCurrent();
    if (event.key === 'ArrowRight') saveCurrent();
    if (event.key === 'ArrowUp') openDetails();
  });
  bindDrag();
}

if (tg) {
  tg.ready();
  tg.expand();
}

(async function boot() {
  bind();
  saveFavoriteState();
  await loadHomes();
  render();
})();
