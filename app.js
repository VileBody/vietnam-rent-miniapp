const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
const API_BASE = window.VIETNEST_API_BASE || (window.location.port === '5174' ? 'http://127.0.0.1:8080' : '');
const UI_THEME = window.VIETNEST_UI_THEME === 'warm' ? 'warm' : 'crisp';
const TADS_SCRIPT_URL = 'https://w.tads.me/widget.js';

applyTheme();
applyRuntimeClasses();
syncAppViewport();
bindViewportSync();

const STORAGE = {
  favorites: 'vietnest:reference:v1:favorites',
  seen: 'vietnest:reference:v1:seen',
  filters: 'vietnest:reference:v1:filters',
  clientId: 'vietnest:reference:v1:clientId',
  language: 'vietnest:reference:v1:language',
};

const I18N = {
  ru: {
    topSubtitle: 'Аренда жилья во Вьетнаме',
    loading: 'Подбираем варианты',
    loadingAria: 'Загрузка приложения',
    region: 'регион',
    shellSubtitle: 'аренда для поездки',
    currentSearchKicker: 'текущий поиск',
    matchingHomes: '{count} вариантов под ваши фильтры',
    swipeView: 'Свайп',
    listView: 'Список',
    quickBest: 'Лучшее',
    quickBeach: 'У моря',
    quickWorkation: 'Workation',
    quickVilla: 'Виллы',
    quickCalm: 'Тихо',
    quickPool: 'Бассейн',
    quickPet: 'Pet OK',
    map: 'Карта',
    mapSubtitle: 'Варианты по текущим фильтрам',
    mapEmptyTitle: 'Нет вариантов с координатами',
    mapEmptyText: 'Измените фильтры, чтобы увидеть объявления на карте.',
    discover: 'Подбор',
    shortlist: 'Избранное',
    filters: 'Фильтры',
    profile: 'Мои поиски',
    actions: 'Действия',
    openFilters: 'Фильтры',
    skip: 'Пропустить',
    info: 'Подробнее',
    addFavorite: 'Добавить в избранное',
    emptyTitle: 'Все варианты просмотрены',
    emptyText: 'Вы посмотрели все варианты по текущим фильтрам.',
    restart: 'Начать заново',
    savedCount: '{count} сохранено',
    city: 'Город',
    budgetMonth: 'Бюджет / мес',
    currency: 'Валюта',
    type: 'Тип жилья',
    bedrooms: 'Спальни',
    reset: 'Сбросить',
    showVariants: 'Показать',
    variants: 'вариантов',
    furnishedOnly: 'Только с мебелью',
    furnishedHint: 'Меблированные варианты',
    profileHeaderSubtitle: 'Сводка текущего поиска',
    saved: 'Сохранено',
    viewed: 'Просмотрено',
    budget: 'Бюджет',
    language: 'Язык',
    currentSearch: 'Текущий поиск',
    searchResults: '{count} вариантов под текущие фильтры',
    searchPreview: 'Ближайшие варианты',
    searchOpenFilters: 'Фильтры',
    searchResetSeen: 'Вернуть просмотренные',
    searchResetDone: 'Просмотренные снова наверху',
    noSearchResults: 'Под эти фильтры ничего не нашлось.',
    allVietnam: 'Весь Вьетнам',
    all: 'Все',
    any: 'Любой',
    anyPlural: 'Любые',
    apartment: 'Квартира',
    villa: 'Вилла',
    furnished: 'С мебелью',
    studio: 'Студия',
    bedShort: 'сп.',
    today: 'сегодня',
    yesterday: 'вчера',
    noSavedTitle: 'Пока ничего не сохранено',
    noSavedText: 'Свайпайте вправо, чтобы сохранить.',
    remove: 'Удалить',
    priceRequest: 'Цена по запросу',
    monthShort: '/мес',
    monthCaption: 'в месяц',
    fit: 'совпадение',
    details: 'детали',
    about: 'Описание',
    amenities: 'Что есть',
    openContacts: 'Открыть контакты',
    openOriginal: 'Открыть оригинал',
    contactAria: 'Открыть контакт',
    back: 'Назад',
    expandPhoto: 'Открыть фото на весь экран',
    closePhoto: 'Закрыть фото',
    prevPhoto: 'Предыдущее фото',
    nextPhoto: 'Следующее фото',
    photoFullAlt: 'Фото жилья на весь экран',
    photoProgress: 'Фото {current} из {total}',
    showPhoto: 'Показать фото {number}',
    homePhoto: '{title} фото {number}',
    viewerPhotoAlt: '{title} фото {number}',
    likedStamp: 'НРАВ',
    skippedStamp: 'НЕТ',
    undoAria: 'Отменить последнее действие',
    undoToast: 'Возвращено назад',
    undoNothing: 'Отменять пока нечего',
    filtersApplied: 'Фильтры применены',
    addedToShortlist: 'Добавлено в избранное',
    sponsored: 'Реклама',
    adProvider: 'Партнер',
    adDefaultCta: 'Подробнее',
    adOpened: 'Открываем предложение',
    searchingAll: 'Ищем по всему Вьетнаму',
    searchingCity: 'Ищем в {city}',
    paywallKicker: 'VietNest Plus',
    paywallViewsTitle: '30 вариантов уже посмотрели',
    paywallContactsTitle: 'Контакты доступны по подписке',
    paywallViewsText: 'Дальше открываем доступ вручную: напишите нам в Telegram, и мы подключим подписку.',
    paywallContactsText: 'Чтобы получить доступ к контактам и оригинальным объявлениям, оплатите подписку. Напишите нам в Telegram, и мы подключим доступ вручную.',
    paywallViewed: 'Просмотрено',
    paywallRemaining: 'Осталось бесплатно:',
    paywallSubscribe: 'Написать за подпиской',
    closePaywall: 'Закрыть окно оплаты',
    demoTitle: 'Квартира с балконом и видом на Han River',
    demoSource: 'Демо',
    demoDetails: 'Демо-объявление',
    demoAbout: 'Демо-объявление используется только если API временно недоступен.',
    fallbackTitle: 'Жилье во Вьетнаме',
    vietnam: 'Вьетнам',
    contactLockedLine: 'Контакты доступны по подписке',
  },
  en: {
    topSubtitle: 'Vietnam rentals',
    loading: 'Finding your next home',
    loadingAria: 'Loading application',
    region: 'region',
    shellSubtitle: 'rentals for your trip',
    currentSearchKicker: 'current search',
    matchingHomes: '{count} homes match your filters',
    swipeView: 'Swipe',
    listView: 'List',
    quickBest: 'Best',
    quickBeach: 'Near the sea',
    quickWorkation: 'Workation',
    quickVilla: 'Villas',
    quickCalm: 'Quiet',
    quickPool: 'Pool',
    quickPet: 'Pet OK',
    map: 'Map',
    mapSubtitle: 'Homes matching current filters',
    mapEmptyTitle: 'No homes with coordinates',
    mapEmptyText: 'Change the filters to see homes on the map.',
    discover: 'Discover',
    shortlist: 'Shortlist',
    filters: 'Filters',
    profile: 'My searches',
    actions: 'Actions',
    openFilters: 'Filters',
    skip: 'Skip',
    info: 'Details',
    addFavorite: 'Add to shortlist',
    emptyTitle: 'All homes viewed',
    emptyText: 'You have viewed every home in the current filters.',
    restart: 'Start over',
    savedCount: '{count} saved',
    city: 'City',
    budgetMonth: 'Budget / mo',
    currency: 'Currency',
    type: 'Home type',
    bedrooms: 'Bedrooms',
    reset: 'Reset',
    showVariants: 'Show',
    variants: 'homes',
    furnishedOnly: 'Furnished only',
    furnishedHint: 'Ready-to-live homes',
    profileHeaderSubtitle: 'Current search summary',
    saved: 'Saved',
    viewed: 'Viewed',
    budget: 'Budget',
    language: 'Language',
    currentSearch: 'Current search',
    searchResults: '{count} homes match current filters',
    searchPreview: 'Next homes',
    searchOpenFilters: 'Filters',
    searchResetSeen: 'Bring viewed back',
    searchResetDone: 'Viewed homes are back on top',
    noSearchResults: 'No homes match these filters.',
    allVietnam: 'All Vietnam',
    all: 'All',
    any: 'Any',
    anyPlural: 'Any',
    apartment: 'Apartment',
    villa: 'Villa',
    furnished: 'Furnished',
    studio: 'Studio',
    bedShort: 'BR',
    today: 'seen today',
    yesterday: 'yesterday',
    noSavedTitle: 'No saved homes yet',
    noSavedText: 'Swipe right to save.',
    remove: 'Remove',
    priceRequest: 'Price on request',
    monthShort: '/month',
    monthCaption: 'monthly',
    fit: 'fit',
    details: 'detail',
    about: 'About',
    amenities: 'Amenities',
    openContacts: 'Unlock contacts',
    openOriginal: 'Open original listing',
    contactAria: 'Open contact',
    back: 'Back',
    expandPhoto: 'Open photo fullscreen',
    closePhoto: 'Close photo',
    prevPhoto: 'Previous photo',
    nextPhoto: 'Next photo',
    photoFullAlt: 'Full-screen home photo',
    photoProgress: 'Photo {current} of {total}',
    showPhoto: 'Show photo {number}',
    homePhoto: '{title} photo {number}',
    viewerPhotoAlt: '{title} photo {number}',
    likedStamp: 'LIKE',
    skippedStamp: 'SKIP',
    undoAria: 'Undo last action',
    undoToast: 'Brought back',
    undoNothing: 'Nothing to undo yet',
    filtersApplied: 'Filters applied',
    addedToShortlist: 'Added to shortlist',
    sponsored: 'Sponsored',
    adProvider: 'Partner',
    adDefaultCta: 'Learn more',
    adOpened: 'Opening offer',
    searchingAll: 'Looking across Vietnam',
    searchingCity: 'Looking in {city}',
    paywallKicker: 'VietNest Plus',
    paywallViewsTitle: '30 homes viewed',
    paywallContactsTitle: 'Contacts are available with a subscription',
    paywallViewsText: 'We unlock access manually: message us in Telegram and we will enable your subscription.',
    paywallContactsText: 'To access contacts and original listings, subscribe first. Message us in Telegram and we will enable access manually.',
    paywallViewed: 'Viewed',
    paywallRemaining: 'Free views left:',
    paywallSubscribe: 'Message for subscription',
    closePaywall: 'Close paywall',
    demoTitle: 'Apartment With Balcony & Han River View',
    demoSource: 'Demo',
    demoDetails: 'Fallback listing',
    demoAbout: 'Demo fallback listing used only when the API is unavailable.',
    fallbackTitle: 'Apartment in Vietnam',
    vietnam: 'Vietnam',
    contactLockedLine: 'Contacts are available with a subscription',
  },
};

let activeLanguage = initialLanguage();

function applyTheme() {
  document.documentElement.dataset.theme = UI_THEME;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', UI_THEME === 'warm' ? '#f4ede2' : '#eceff5');
}

function applyRuntimeClasses() {
  const previewTelegram = new URLSearchParams(window.location.search).has('tg-preview');
  const mobileViewport = Math.min(window.innerWidth || 0, window.screen?.width || window.innerWidth || 0) <= 720;
  const shortViewport = appViewportHeight() <= 820;
  document.documentElement.classList.toggle('is-telegram', Boolean(tg) || previewTelegram || mobileViewport || shortViewport);
}

function appViewportHeight() {
  const candidates = [
    Number(tg?.viewportStableHeight) || 0,
    Number(tg?.viewportHeight) || 0,
    Number(window.visualViewport?.height) || 0,
    Number(window.innerHeight) || 0,
  ].filter((height) => height > 0);
  return Math.max(320, Math.round(candidates[0] || 0));
}

function syncAppViewport() {
  document.documentElement.style.setProperty('--app-height', `${appViewportHeight()}px`);
}

function bindViewportSync() {
  let frame = 0;
  const schedule = () => {
    window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(() => {
      syncAppViewport();
      applyRuntimeClasses();
    });
  };
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('orientationchange', schedule, { passive: true });
  window.visualViewport?.addEventListener('resize', schedule, { passive: true });
  window.visualViewport?.addEventListener('scroll', schedule, { passive: true });
  try {
    tg?.onEvent?.('viewportChanged', schedule);
  } catch {
    // ignore Telegram SDK errors outside Telegram.
  }
}

const cityLabels = {
  all: 'all',
  danang: 'Da Nang',
  hcmc: 'Ho Chi Minh',
  hoian: 'Hoi An',
  nhatrang: 'Nha Trang',
  phuquoc: 'Phu Quoc',
};

const cityCodes = ['all', 'danang', 'nhatrang', 'hoian', 'hcmc', 'phuquoc'];
const typeCodes = ['all', 'apartment', 'villa'];
const bedCodes = ['any', 'studio', '1', '2', '3'];
const currencyCodes = ['usd', 'vnd', 'rub', 'kzt'];

const CURRENCIES = {
  usd: { label: 'USD', symbol: '$', locale: 'en-US', rate: 1, position: 'prefix' },
  vnd: { label: 'VND', symbol: '₫', locale: 'en-US', rate: 25400, position: 'suffix' },
  rub: { label: 'RUB', symbol: '₽', locale: 'ru-RU', rate: 80, position: 'suffix' },
  kzt: { label: 'KZT', symbol: '₸', locale: 'ru-RU', rate: 480, position: 'suffix' },
};

const defaultFilters = {
  city: 'all',
  type: 'all',
  beds: 'any',
  budget: 2500,
  furnished: false,
  currency: 'usd',
};

const $ = (id) => document.getElementById(id);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const fallbackHomes = [
  {
    id: 'fallback-danang',
    title: t('demoTitle'),
    area: 'Son Tra, Da Nang',
    city: 'danang',
    type: 'apartment',
    price: 320,
    score: 91,
    source: t('demoSource'),
    fresh: t('today'),
    specs: [`$320${t('monthShort')}`, '1 bedroom', 'Da Nang'],
    details: [t('demoDetails')],
    tags: ['balcony', 'pool', 'furnished'],
    about: t('demoAbout'),
    contact: { name: 'Facebook Marketplace', line: t('openOriginal'), value: 'https://www.facebook.com/marketplace/' },
    fbUrl: 'https://www.facebook.com/marketplace/',
    photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&q=82&auto=format&fit=crop'],
    petFriendly: false,
  },
];

let homes = fallbackHomes.map(normalizeHome);

const state = {
  screen: 'discover',
  activeDetailId: null,
  detailPhotoIndex: 0,
  viewerHomeId: null,
  viewerPhotoIndex: 0,
  photoIndexes: {},
  language: activeLanguage,
  session: null,
  paywallOpen: false,
  viewMode: 'swipe',
  quickFilter: 'best',
  queue: [],
  history: [],
  animating: false,
  tadsListingSwipes: 0,
  tadsFullscreenOpen: false,
  favorites: new Set(readJSON(STORAGE.favorites, [])),
  seen: normalizeSeen(readJSON(STORAGE.seen, {})),
  filters: normalizeFilters(readJSON(STORAGE.filters, defaultFilters)),
};

const tadsState = {
  scriptPromise: null,
  mountedStaticSlot: '',
  controllers: {},
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

function initialLanguage() {
  const params = new URLSearchParams(window.location.search);
  const queryLanguage = params.get('lang');
  if (queryLanguage === 'ru' || queryLanguage === 'en') {
    try {
      window.localStorage.setItem(STORAGE.language, queryLanguage);
    } catch {
      // ignore storage failures in embedded browsers.
    }
    return queryLanguage;
  }
  try {
    const saved = window.localStorage.getItem(STORAGE.language);
    if (saved === 'ru' || saved === 'en') return saved;
  } catch {
    // ignore storage failures in embedded browsers.
  }
  return 'ru';
}

function t(key, vars = {}) {
  const template = I18N[activeLanguage]?.[key] || I18N.ru[key] || key;
  return Object.entries(vars).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), template);
}

function setText(id, value) {
  const node = $(id);
  if (node) node.textContent = value;
}

function setAria(id, value) {
  const node = $(id);
  if (node) node.setAttribute('aria-label', value);
}

function cityLabel(value) {
  if (value === 'all') return t('allVietnam');
  return cityLabels[value] || t('vietnam');
}

function typeLabel(value) {
  if (value === 'ad') return t('sponsored');
  if (value === 'villa') return t('villa');
  if (value === 'apartment') return t('apartment');
  return t('any');
}

function cityOptions() {
  return cityCodes.map((value) => [value, cityLabel(value)]);
}

function typeOptions() {
  return typeCodes.map((value) => [value, typeLabel(value)]);
}

function bedOptions() {
  return bedCodes.map((value) => [value, value === 'any' ? t('anyPlural') : value === 'studio' ? t('studio') : `${value}+`]);
}

function currencyOptions() {
  return currencyCodes.map((value) => {
    const currency = CURRENCIES[value] || CURRENCIES.usd;
    return [value, `${currency.label} ${currency.symbol}`];
  });
}

function applyI18n() {
  document.documentElement.lang = activeLanguage;
  setText('loaderText', t('loading'));
  setAria('appLoader', t('loadingAria'));
  setText('topSubtitle', t('topSubtitle'));
  setText('shellCityCaption', t('region'));
  setText('shellBrandSubtitle', t('shellSubtitle'));
  setText('tripKicker', t('currentSearchKicker'));
  setText('swipeViewBtn', t('swipeView'));
  setText('listViewBtn', t('listView'));
  setText('mapTitle', t('map'));
  setText('mapSubtitle', t('mapSubtitle'));
  setText('mapEmptyTitle', t('mapEmptyTitle'));
  setText('mapEmptyText', t('mapEmptyText'));
  setAria('screen-discover', t('discover'));
  setAria('screen-shortlist', t('shortlist'));
  setAria('screen-filters', t('filters'));
  setAria('screen-profile', t('profile'));
  setAria('screen-map', t('map'));
  setAria('openFiltersTop', t('openFilters'));
  setAria('actionsLabel', t('actions'));
  setAria('undoBtn', t('undoAria'));
  setAria('skipBtn', t('skip'));
  setAria('infoBtn', t('info'));
  setAria('likeBtn', t('addFavorite'));
  setText('emptyTitle', t('emptyTitle'));
  setText('emptyText', t('emptyText'));
  setText('resetDeckBtn', t('restart'));
  setText('shortlistTitle', t('shortlist'));
  setText('filtersTitle', t('filters'));
  setText('resetFiltersBtn', t('reset'));
  setText('cityLegend', t('city'));
  setText('budgetLegend', t('budgetMonth'));
  setText('currencyLegend', t('currency'));
  setText('typeLegend', t('type'));
  setText('bedLegend', t('bedrooms'));
  setText('furnishedTitle', t('furnishedOnly'));
  setText('furnishedHint', t('furnishedHint'));
  setAria('furnishedToggle', t('furnishedOnly'));
  setText('profileTitle', t('profile'));
  setText('profileHeaderSubtitle', t('profileHeaderSubtitle'));
  setText('profileSavedLabel', t('saved'));
  setText('profileSeenLabel', t('viewed'));
  setText('profileBudgetLabel', t('budget'));
  setText('profileCityLabel', t('city'));
  setText('profileTypeLabel', t('type'));
  setText('profileCurrencyLabel', t('currency'));
  setText('profileLanguageLabel', t('language'));
  setText('profileLanguageValue', activeLanguage.toUpperCase());
  setText('currentSearchLabel', t('currentSearch'));
  setText('editSearchBtn', t('searchOpenFilters'));
  setText('resetSeenBtn', t('searchResetSeen'));
  setText('searchPreviewTitle', t('searchPreview'));
  setText('tabDiscover', t('discover'));
  setText('tabShortlist', t('shortlist'));
  setText('tabFilters', t('filters'));
  setText('tabProfile', t('profile'));
  setText('tabMap', t('map'));
  const quickLabels = {
    best: t('quickBest'),
    beach: t('quickBeach'),
    workation: t('quickWorkation'),
    villa: t('quickVilla'),
    calm: t('quickCalm'),
    pool: t('quickPool'),
    pet: t('quickPet'),
  };
  $$('.quick-chip').forEach((button) => {
    button.textContent = quickLabels[button.dataset.quick] || button.textContent;
  });
  setAria('closeDetailBtn', t('back'));
  setAria('detailExpandBtn', t('expandPhoto'));
  setAria('detailLikeBtn', t('addFavorite'));
  setText('detailMonthLabel', t('monthShort'));
  setText('detailAboutTitle', t('about'));
  setText('detailAmenitiesTitle', t('amenities'));
  setAria('openFbBtn', t('contactAria'));
  setAria('viewerCloseBtn', t('closePhoto'));
  setAria('viewerPrevBtn', t('prevPhoto'));
  setAria('viewerNextBtn', t('nextPhoto'));
  setAria('paywallCloseBtn', t('closePaywall'));
  setText('paywallSubscribeBtn', t('paywallSubscribe'));
  const viewerImage = $('viewerImage');
  if (viewerImage && !viewerImage.src) viewerImage.alt = t('photoFullAlt');
  const resultCount = $('resultCount')?.textContent || '0';
  $('applyFiltersBtn').innerHTML = `${escapeHTML(t('showVariants'))} <span id="resultCount">${escapeHTML(resultCount)}</span> ${escapeHTML(t('variants'))}`;
  const paywallKicker = document.querySelector('.paywall-kicker');
  if (paywallKicker) paywallKicker.textContent = t('paywallKicker');
  const paywallViewed = document.querySelector('#paywallMeter span');
  if (paywallViewed) paywallViewed.textContent = t('paywallViewed');
  updatePaywallNote();
}

function updatePaywallNote() {
  const remaining = $('paywallRemaining')?.textContent || '0';
  const note = $('paywallNote');
  if (note) note.innerHTML = `${escapeHTML(t('paywallRemaining'))} <strong id="paywallRemaining">${escapeHTML(remaining)}</strong>`;
}

function setLanguage(language) {
  activeLanguage = language === 'ru' ? 'ru' : 'en';
  state.language = activeLanguage;
  try {
    window.localStorage.setItem(STORAGE.language, activeLanguage);
  } catch {
    // ignore storage failures in embedded browsers.
  }
  applyI18n();
  render();
  const detailWasOpen = $('detailOverlay').classList.contains('is-open');
  const detailId = state.activeDetailId;
  void loadHomes().then(() => {
    resetQueue();
    render();
    if (detailWasOpen) {
      openDetail(homes.find((home) => home.id === detailId) || activeDetail(), { track: false });
    }
  });
  if ($('photoViewer').classList.contains('is-open')) renderPhotoViewer();
  if (state.paywallOpen) showPaywall(contactsLocked() ? 'contacts' : 'views');
}

function clientId() {
  let id = '';
  try {
    id = window.localStorage.getItem(STORAGE.clientId) || '';
    if (!id) {
      id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      window.localStorage.setItem(STORAGE.clientId, id);
    }
  } catch {
    id = 'volatile-browser-client';
  }
  return id;
}

function authHeaders(extra = {}) {
  const headers = {
    'X-Vietnest-Client-Id': clientId(),
    'X-Vietnest-Language': activeLanguage,
    ...extra,
  };
  if (tg?.initData) headers['X-Telegram-Init-Data'] = tg.initData;
  return headers;
}

async function api(path, options = {}) {
  const headers = authHeaders(options.body ? { 'Content-Type': 'application/json' } : {});
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const error = new Error(payload?.error || `API returned ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function applySession(session, { openPaywall = true } = {}) {
  if (!session) return;
  state.session = session;
  const usage = session.usage || {};
  const remaining = Math.max(0, Number(usage.remaining ?? usage.freeLimit ?? 30));
  $('paywallUsage').textContent = `${usage.viewed || 0}/${usage.freeLimit || window.VIETNEST_FREE_VIEW_LIMIT || 30}`;
  $('paywallRemaining').textContent = String(remaining);
  if (openPaywall && usage.paywalled && state.screen === 'discover') showPaywall();
}

function paywallEnabled() {
  return window.VIETNEST_PAYWALL_ENABLED === true;
}

async function loadSession() {
  try {
    applySession(await api('/api/session'));
  } catch (error) {
    console.warn('Session unavailable:', error);
  }
}

async function recordAction(action, listingId = '', metadata = {}) {
  try {
    const session = await api('/api/events', {
      method: 'POST',
      body: JSON.stringify({ action, listingId, metadata }),
    });
    applySession(session);
    return true;
  } catch (error) {
    if (error.status === 402) {
      applySession(error.payload?.session);
      showPaywall();
      return false;
    }
    console.warn('Action tracking failed:', error);
    return true;
  }
}

async function recordSearch() {
  try {
    await api('/api/searches', {
      method: 'POST',
      body: JSON.stringify({ filters: state.filters, resultsCount: filteredListingCount() }),
    });
  } catch (error) {
    console.warn('Search tracking failed:', error);
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
  filters.currency = CURRENCIES[filters.currency] ? filters.currency : defaultFilters.currency;
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

const preloadedPhotos = new Set();

function preloadPhotos(urls) {
  urls.forEach((url) => {
    if (!url || preloadedPhotos.has(url)) return;
    preloadedPhotos.add(url);
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
  });
}

function waitForImage(url) {
  if (!url) return Promise.resolve();
  return new Promise((resolve) => {
    const image = new Image();
    const done = () => resolve();
    image.onload = done;
    image.onerror = done;
    image.decoding = 'async';
    image.src = url;
    if (image.complete) done();
  });
}

function delay(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function waitForInitialAssets() {
  const criticalHomes = ensureQueue().filter((home) => home.kind === 'listing').slice(0, 3);
  const imagePromises = criticalHomes.map((home) => waitForImage(thumbUrl(home.photos[0], 960)));
  const fontPromise = document.fonts?.ready || Promise.resolve();
  await Promise.allSettled([
    withTimeout(fontPromise, 5000, 'font loading timeout'),
    ...imagePromises.map((promise) => withTimeout(promise, 6000, 'image loading timeout')),
  ]);
}

function hideAppLoader() {
  $('appLoader')?.classList.add('is-hidden');
}

function thumbUrl(url, width = 640) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'images.unsplash.com') {
      parsed.searchParams.set('w', String(width));
      return parsed.toString();
    }
  } catch {
    // Keep relative and opaque remote URLs untouched.
  }
  return url;
}

function tadsTgbWidgetId() {
  return cleanText(window.VIETNEST_TADS_TGB_WIDGET_ID || '');
}

function tadsFullscreenWidgetId() {
  return cleanText(window.VIETNEST_TADS_FULLSCREEN_WIDGET_ID || '');
}

function tadsDebugEnabled() {
  return window.VIETNEST_TADS_DEBUG === true;
}

function tadsTgbFrequency() {
  return clamp(Number(window.VIETNEST_TADS_TGB_FREQUENCY || window.VIETNEST_TADS_FREQUENCY || 5), 1, 50);
}

function tadsFullscreenFrequency() {
  return clamp(Number(window.VIETNEST_TADS_FULLSCREEN_FREQUENCY || 10), 1, 50);
}

function tadsEnabled() {
  return Boolean(tadsTgbWidgetId() || tadsFullscreenWidgetId());
}

function ensureTadsScript() {
  if (!tadsEnabled()) return Promise.reject(new Error('TADS widget id is not configured'));
  if (window.tads?.init) return Promise.resolve(window.tads);
  if (tadsState.scriptPromise) return tadsState.scriptPromise;

  tadsState.scriptPromise = new Promise((resolve, reject) => {
    let preconnect = document.querySelector('link[href="https://api.tads.me"]');
    if (!preconnect) {
      preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = 'https://api.tads.me';
      document.head.appendChild(preconnect);
    }

    const existing = document.querySelector(`script[src="${TADS_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.tads), { once: true });
      existing.addEventListener('error', () => reject(new Error('failed to load TADS script')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = TADS_SCRIPT_URL;
    script.async = true;
    script.addEventListener('load', () => resolve(window.tads), { once: true });
    script.addEventListener('error', () => reject(new Error('failed to load TADS script')), { once: true });
    document.body.appendChild(script);
  });

  return tadsState.scriptPromise;
}

async function ensureTadsController(widgetId, type) {
  if (!widgetId) return null;
  const widgetType = String(type || '').toLowerCase();
  await ensureTadsScript();
  if (!window.tads?.init) throw new Error('TADS script loaded without init API');
  const container = ensureTadsContainer(widgetId, widgetType !== 'static');
  window.tads.controllers = window.tads.controllers || {};
  const key = `${widgetId}:${widgetType}`;
  if (tadsState.controllers[key]) {
    if (widgetType === 'static') tadsState.controllers[key].adContainer = container;
    return tadsState.controllers[key];
  }

  const controller = window.tads.init({
    widgetId,
    type: widgetType,
    debug: tadsDebugEnabled(),
    onShowReward: (result) => {
      void recordAction('tads_show_reward', '', { widgetId, type: widgetType, result });
    },
    onClickReward: (result) => {
      void recordAction('tads_click_reward', '', { widgetId, type: widgetType, result });
    },
    onAdsNotFound: () => {
      void recordAction('tads_ads_not_found', '', { widgetId, type: widgetType });
    },
  });
  window.tads.controllers[widgetId] = controller;
  tadsState.controllers[key] = controller;
  return controller;
}

function ensureTadsContainer(widgetId, hidden = false) {
  const id = `tads-container-${widgetId}`;
  let container = document.getElementById(id);
  if (!container) {
    container = document.createElement('div');
    container.id = id;
  }
  const mount = [...document.querySelectorAll('.tads-card-mount')]
    .find((node) => node.dataset.tadsWidgetId === widgetId);
  if (!hidden && mount) mount.appendChild(container);
  else if (container.parentElement !== document.body) document.body.appendChild(container);
  container.classList.toggle('tads-hidden-host', Boolean(hidden));
  return container;
}

function createTadsStaticHome(slotNumber, feedIndex) {
  const widgetId = tadsTgbWidgetId();
  return {
    kind: 'tads_static',
    id: `tads-static:${widgetId}:slot:${slotNumber}`,
    adId: widgetId,
    feedIndex,
    title: t('sponsored'),
    area: 'TADS',
    city: 'all',
    type: 'ad',
    price: 0,
    score: 99,
    source: 'TADS',
    fresh: t('sponsored'),
    specs: [t('adDefaultCta'), 'TADS'],
    details: [],
    tags: [t('sponsored')],
    about: '',
    contact: { name: 'TADS', line: t('adDefaultCta'), value: '' },
    fbUrl: '',
    photos: fallbackHomes[0].photos,
    petFriendly: false,
    furnished: false,
    beds: null,
    widgetId,
  };
}

function isTadsStaticHome(home) {
  return home?.kind === 'tads_static';
}

function tadsStaticShouldAppearAfter(listingNumber) {
  if (!tadsTgbWidgetId()) return false;
  if (listingNumber % tadsTgbFrequency() !== 0) return false;
  return !tadsFullscreenWidgetId() || listingNumber % tadsFullscreenFrequency() !== 0;
}

function normalizeHome(raw, feedIndex = 0) {
  const photos = Array.isArray(raw.photos) && raw.photos.length
    ? raw.photos.filter(Boolean)
    : fallbackHomes[0].photos;
  const tags = Array.isArray(raw.tags) ? raw.tags.map(cleanText).filter(Boolean) : [];
  const specs = Array.isArray(raw.specs) ? raw.specs.map(cleanText).filter(Boolean) : [];
  const details = Array.isArray(raw.details) ? raw.details.map(cleanText).filter(Boolean) : [];
  const title = cleanText(raw.title || t('fallbackTitle'));
  const about = cleanText(raw.about || raw.description || title);
  const source = cleanText(raw.source || 'Facebook Marketplace');
  const city = cleanText(raw.city || 'all').toLowerCase();
  const type = normalizeType(raw.type || raw.home_type || raw.property_type || title);
  const pool = [title, about, raw.area, type, ...tags, ...specs, ...details].join(' ').toLowerCase();

  return {
    kind: 'listing',
    id: String(raw.id || raw.externalId || raw.external_id || `${city}-${title}`),
    feedIndex,
    title,
    area: cleanText(raw.area || cityLabel(city)),
    city,
    locationCity: cleanText(raw.locationCity || raw.location_city || ''),
    locationDistrict: cleanText(raw.locationDistrict || raw.location_district || ''),
    locationWard: cleanText(raw.locationWard || raw.location_ward || ''),
    locationStreet: cleanText(raw.locationStreet || raw.location_street || ''),
    type,
    price: Number(raw.price || raw.priceUsd || raw.price_usd || 0),
    score: clamp(Number(raw.score || raw.matchScore || raw.match_score || 76), 0, 99),
    source,
    fresh: cleanText(raw.fresh || t('today')),
    specs,
    details,
    tags,
    about,
    contact: {
      name: cleanText(raw.contact?.name || raw.contactName || 'Facebook Marketplace'),
      line: cleanText(raw.contact?.line || raw.contactLine || t('openOriginal')),
      value: cleanText(raw.contact?.value || raw.contactValue || raw.fbUrl || raw.fb_url || ''),
    },
    fbUrl: cleanText(raw.fbUrl || raw.fb_url || raw.sourceUrl || raw.source_url || raw.contact?.value || 'https://www.facebook.com/marketplace/'),
    photos,
    petFriendly: Boolean(raw.petFriendly || raw.pet_friendly || /pet|питом|живот/.test(pool)),
    furnished: /furnished|fully furnished|мебел|меблир|furniture/.test(pool),
    beds: inferBedrooms(pool),
    lat: numberOrNull(raw.latitude ?? raw.lat),
    lng: numberOrNull(raw.longitude ?? raw.lng),
    sourceLat: numberOrNull(raw.sourceLatitude ?? raw.source_latitude),
    sourceLng: numberOrNull(raw.sourceLongitude ?? raw.source_longitude),
    geocodedLat: numberOrNull(raw.geocodedLatitude ?? raw.geocoded_latitude),
    geocodedLng: numberOrNull(raw.geocodedLongitude ?? raw.geocoded_longitude),
    locationPrecision: cleanText(raw.locationPrecision || raw.location_precision || ''),
  };
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) && value !== null && value !== undefined ? number : null;
}

function normalizeAd(raw = {}, feedIndex = 0) {
  const id = cleanText(raw.id || `${feedIndex}`);
  const image = cleanText(raw.imageUrl || raw.image_url || 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=82');
  const title = cleanText(raw.title || t('sponsored'));
  const body = cleanText(raw.body || raw.description || '');
  const ctaUrl = cleanText(raw.ctaUrl || raw.cta_url || '');
  const ctaText = cleanText(raw.ctaText || raw.cta_text || t('adDefaultCta'));
  const provider = cleanText(raw.advertiser || raw.provider || t('adProvider'));
  const label = cleanText(raw.label || t('sponsored'));

  return {
    kind: 'ad',
    id: `ad:${id}`,
    adId: id,
    feedIndex,
    title,
    area: provider,
    city: 'all',
    type: 'ad',
    price: 0,
    score: 99,
    source: provider,
    fresh: label,
    specs: [label, provider, ctaText].filter(Boolean),
    details: [],
    tags: [label, provider].filter(Boolean),
    about: body,
    contact: { name: provider, line: ctaText, value: ctaUrl },
    fbUrl: ctaUrl,
    photos: [image],
    petFriendly: false,
    furnished: false,
    beds: null,
    ctaText,
  };
}

function normalizeFeedItem(item, feedIndex = 0) {
  if (item?.type === 'ad') return normalizeAd(item.ad || item, feedIndex);
  if (item?.type === 'listing') return normalizeHome(item.listing || item, feedIndex);
  return normalizeHome(item, feedIndex);
}

function normalizeType(value) {
  const text = String(value).toLowerCase();
  if (/^ad$|реклама|sponsor|partner/i.test(text)) return 'ad';
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
  if (home.kind !== 'listing') return true;
  const filters = state.filters;
  if (filters.city !== 'all' && home.city !== filters.city) return false;
  if (filters.type !== 'all' && home.type !== filters.type) return false;
  if (home.price && home.price > filters.budget) return false;
  if (filters.furnished && !home.furnished) return false;
  if (filters.beds === 'studio') return home.beds === 0 || /studio|студ/.test(textPool(home));
  if (filters.beds !== 'any' && home.beds !== null && home.beds < Number(filters.beds)) return false;
  if (!matchesQuickFilter(home)) return false;
  return true;
}

function matchesQuickFilter(home) {
  const pool = textPool(home);
  switch (state.quickFilter) {
    case 'beach':
      return /beach|sea view|near sea|my khe|nha trang bay|пляж|море|у моря/.test(pool);
    case 'workation':
      return /wifi|wi-fi|workspace|work desk|office|рабоч|интернет/.test(pool);
    case 'villa':
      return home.type === 'villa';
    case 'calm':
      return /quiet|peaceful|calm|тих|спокой/.test(pool);
    case 'pool':
      return /pool|бассейн/.test(pool);
    case 'pet':
      return home.petFriendly;
    default:
      return true;
  }
}

function fitScore(home) {
  if (home.kind !== 'listing') return 99;
  let score = Number(home.score || 76);
  if (home.price && home.price <= state.filters.budget) score += 4;
  if (home.furnished) score += 3;
  if (home.petFriendly) score += 2;
  score -= Number(state.seen[home.id] || 0) * 12;
  return clamp(Math.round(score), 34, 99);
}

function filteredHomes() {
  const ordered = [...homes].sort((a, b) => Number(a.feedIndex || 0) - Number(b.feedIndex || 0));
  const listings = ordered.filter((home) => home.kind === 'listing' && matchesFilters(home));
  const ads = ordered.filter((home) => home.kind === 'ad');
  const hasTadsStatic = Boolean(tadsTgbWidgetId());
  if (!ads.length && !hasTadsStatic) return listings;

  const result = [];
  let adIndex = 0;
  listings.forEach((home, index) => {
    result.push(home);
    if (tadsStaticShouldAppearAfter(index + 1)) {
      if (ads.length) {
        const ad = ads[adIndex % ads.length];
        result.push({
          ...ad,
          id: `${ad.id}:slot:${index + 1}`,
          feedIndex: Number(home.feedIndex || index) + 0.01,
        });
      } else {
        result.push(createTadsStaticHome(index + 1, Number(home.feedIndex || index) + 0.01));
      }
      adIndex += 1;
    }
  });
  return result;
}

function filteredListingCount() {
  return filteredHomes().filter((home) => home.kind === 'listing').length;
}

function ensureQueue() {
  const candidates = filteredHomes();
  const candidateByID = new Map(candidates.map((home) => [home.id, home]));
  const valid = new Set(candidates.map((home) => home.id));
  state.queue = state.queue.filter((id) => valid.has(id));

  if (!state.queue.length) {
    state.queue = candidates.filter((home) => !state.seen[home.id]).map((home) => home.id);
  }
  return state.queue.map((id) => candidateByID.get(id)).filter(Boolean);
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

function convertPrice(usdValue) {
  const currency = CURRENCIES[state.filters.currency] || CURRENCIES.usd;
  const raw = Number(usdValue) * currency.rate;
  const rounded = currency.rate >= 100 ? Math.round(raw / 100) * 100 : Math.round(raw);
  return { amount: rounded, currency };
}

function formatMoney(usdValue) {
  const { amount, currency } = convertPrice(usdValue);
  const formatted = amount.toLocaleString(currency.locale);
  return currency.position === 'prefix' ? `${currency.symbol}${formatted}` : `${formatted} ${currency.symbol}`;
}

function formatBudget(value = state.filters.budget) {
  return activeLanguage === 'ru' ? `до ${formatMoney(value)}` : `up to ${formatMoney(value)}`;
}

function money(value) {
  if (!value) return t('priceRequest');
  return formatMoney(value);
}

function displayFresh(value = '') {
  const text = cleanText(value);
  if (/seen today|today|сегодня/i.test(text)) return t('today');
  if (/yesterday|вчера/i.test(text)) return t('yesterday');
  return text;
}

function photoIndex(home) {
  if (!home?.photos?.length) return 0;
  return clamp(Number(state.photoIndexes[home.id]) || 0, 0, home.photos.length - 1);
}

function setPhotoIndex(home, index, { syncDetail = false } = {}) {
  if (!home?.photos?.length) return 0;
  const next = (index + home.photos.length) % home.photos.length;
  state.photoIndexes[home.id] = next;
  if (syncDetail || state.activeDetailId === home.id) state.detailPhotoIndex = next;
  return next;
}

function stepPhoto(home, delta, options = {}) {
  return setPhotoIndex(home, photoIndex(home) + delta, options);
}

function currentDetailPhotoIndex(home) {
  if (!home?.photos?.length) return 0;
  return clamp(Number(state.detailPhotoIndex) || 0, 0, home.photos.length - 1);
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
  if (isTadsStaticHome(home)) return [t('adDefaultCta'), 'TADS'];
  if (home.kind === 'ad') return [home.ctaText || t('adDefaultCta'), home.source || t('adProvider')].filter(Boolean);
  const specs = [];
  if (home.beds === 0) specs.push(t('studio'));
  else if (home.beds) specs.push(activeLanguage === 'ru' ? `${home.beds} ${t('bedShort')}` : `${home.beds} ${t('bedShort')}`);
  const areaSpec = home.specs.find((spec) => /m²|sqm|кв/i.test(spec));
  if (areaSpec) specs.push(areaSpec.replace(/^\$\S+\s*/, ''));
  const city = cityLabel(home.city) || home.area || t('vietnam');
  specs.push(city);
  return specs.length ? specs.slice(0, 3) : home.specs.slice(0, 3);
}

function locationLabel(home) {
  const area = cleanText(home.area || '').replace(/\s*,?\s*(Vietnam|Việt Nam|Вьетнам)\s*$/i, '').trim();
  const city = area || cleanText(home.locationCity || '') || cityLabel(home.city) || t('vietnam');
  const district = cleanText(home.locationDistrict || home.locationWard || '');
  if (!district) return city;
  const normalizedCity = city.toLocaleLowerCase();
  const normalizedDistrict = district.toLocaleLowerCase();
  if (normalizedCity.includes(normalizedDistrict) || normalizedDistrict.includes(normalizedCity)) return city;
  return `${city} · ${district}`;
}

function cardMarkup(home, depth) {
  const selectedPhoto = photoIndex(home);
  const photo = home.photos[selectedPhoto] || home.photos[0];
  const cardPhoto = thumbUrl(photo, 960);
  const bgPhoto = thumbUrl(photo, 480);
  const progressPercent = home.photos.length > 1 ? ((selectedPhoto + 1) / home.photos.length) * 100 : 0;
  const specs = displaySpecs(home);
  if (isTadsStaticHome(home)) {
    return `
      <div class="tads-card-shell">
        <div class="card-chips">
          <div class="chip-line">
            <span class="glass-chip solid">${escapeHTML(t('sponsored'))}</span>
            <span class="glass-chip">TADS</span>
          </div>
          <span class="glass-chip">${escapeHTML(t('adDefaultCta'))}</span>
        </div>
        <div class="tads-card-host">
          <div class="tads-card-mount" data-tads-widget-id="${escapeHTML(home.widgetId)}"></div>
          <div class="tads-card-loading">
            <strong>${escapeHTML(t('sponsored'))}</strong>
            <span>${escapeHTML(activeLanguage === 'ru' ? 'Загружаем предложение' : 'Loading offer')}</span>
          </div>
        </div>
        <div class="stamp like">${escapeHTML(t('adDefaultCta'))}</div>
        <div class="stamp skip">${escapeHTML(t('skippedStamp'))}</div>
      </div>
    `;
  }
  if (home.kind === 'ad') {
    return `
      <div class="photo">
        <img class="photo-bg" src="${escapeHTML(bgPhoto)}" alt="" aria-hidden="true" draggable="false" data-home-id="${escapeHTML(home.id)}" data-photo-index="${selectedPhoto}" data-photo-width="480" />
        <img class="photo-main" src="${escapeHTML(cardPhoto)}" alt="${escapeHTML(home.title)}" draggable="false" data-home-id="${escapeHTML(home.id)}" data-photo-index="${selectedPhoto}" data-photo-width="960" />
        <div class="shade"></div>
      </div>
      <div class="card-chips">
        <div class="chip-line">
          <span class="glass-chip solid">${escapeHTML(t('sponsored'))}</span>
          <span class="glass-chip">${escapeHTML(home.source || t('adProvider'))}</span>
        </div>
        <span class="glass-chip">${escapeHTML(home.ctaText || t('adDefaultCta'))}</span>
      </div>
      <div class="stamp like">${escapeHTML(t('adDefaultCta'))}</div>
      <div class="stamp skip">${escapeHTML(t('skippedStamp'))}</div>
      <div class="card-copy ad-copy">
        <div class="card-price"><strong>${escapeHTML(t('sponsored'))}</strong><span>${escapeHTML(home.source || '')}</span></div>
        <h2>${escapeHTML(home.title)}</h2>
        <p>${escapeHTML(home.about)}</p>
        <div class="card-specs">
          ${specs.map((spec, index) => `<span>${specIcon(index)}${escapeHTML(spec)}</span>`).join('')}
        </div>
      </div>
    `;
  }
  return `
    <div class="photo">
      <img class="photo-bg" src="${escapeHTML(bgPhoto)}" alt="" aria-hidden="true" draggable="false" data-home-id="${escapeHTML(home.id)}" data-photo-index="${selectedPhoto}" data-photo-width="480" />
      <img class="photo-main" src="${escapeHTML(cardPhoto)}" alt="${escapeHTML(home.title)}" draggable="false" data-home-id="${escapeHTML(home.id)}" data-photo-index="${selectedPhoto}" data-photo-width="960" />
      <div class="shade"></div>
      ${home.photos.length > 1 ? `<div class="photo-rail" role="progressbar" aria-label="${escapeHTML(t('photoProgress', { current: selectedPhoto + 1, total: home.photos.length }))}" aria-valuemin="1" aria-valuemax="${home.photos.length}" aria-valuenow="${selectedPhoto + 1}"><span style="width: ${progressPercent}%"></span></div>` : ''}
    </div>
    <div class="card-chips">
      <div class="chip-line">
        <span class="glass-chip solid">${escapeHTML(typeLabel(home.type))}</span>
        ${home.furnished ? `<span class="glass-chip">${escapeHTML(t('furnished'))}</span>` : ''}
      </div>
      <span class="glass-chip">${escapeHTML(displayFresh(home.fresh || home.source))}</span>
    </div>
    <div class="stamp like">${escapeHTML(t('likedStamp'))}</div>
    <div class="stamp skip">${escapeHTML(t('skippedStamp'))}</div>
    <div class="card-copy">
      <div class="card-price"><strong>${escapeHTML(money(home.price))}</strong><span>${escapeHTML(t('monthShort'))}</span></div>
      <h2>${escapeHTML(locationLabel(home))}</h2>
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

  preloadPhotos(queue.slice(0, 4).flatMap((home) => home.photos.slice(0, 2).map((photo) => thumbUrl(photo, 960))));

  queue.slice(0, 3).reverse().forEach((home, reverseIndex, stack) => {
    const depth = stack.length - reverseIndex - 1;
    const card = document.createElement('article');
    card.className = `home-card${depth === 0 ? ' is-top' : ''}${home.kind === 'ad' ? ' is-ad' : ''}${isTadsStaticHome(home) ? ' is-tads-ad' : ''}`;
    card.dataset.id = home.id;
    card.dataset.depth = String(depth);
    card.style.zIndex = String(20 - depth);
    card.style.transform = cardPosition(depth);
    card.innerHTML = cardMarkup(home, depth);
    deck.appendChild(card);
    if (depth === 0) attachDrag(card);
  });
  mountTopTadsStaticCard();
}

function discoverListMarkup(home) {
  const saved = state.favorites.has(home.id);
  return `
    <article class="discover-list-card" data-id="${escapeHTML(home.id)}">
      <img src="${escapeHTML(thumbUrl(home.photos[0], 480))}" alt="${escapeHTML(home.title)}" loading="lazy" decoding="async" data-home-id="${escapeHTML(home.id)}" data-photo-index="0" data-photo-width="480" />
      <div class="discover-list-copy">
        <div>
          <div class="discover-list-meta"><span>${escapeHTML(money(home.price))}</span><span>${escapeHTML(`${fitScore(home)}% ${t('fit')}`)}</span></div>
          <h3>${escapeHTML(locationLabel(home))}</h3>
          <p>${escapeHTML(home.title)}</p>
        </div>
        <div class="discover-list-actions">
          <button data-action="details" type="button">${escapeHTML(t('info'))}</button>
          <button data-action="save" type="button">${escapeHTML(saved ? t('saved') : t('addFavorite'))}</button>
        </div>
      </div>
    </article>
  `;
}

function renderDiscoverList() {
  const list = $('discoverList');
  const items = filteredHomes().filter((home) => home.kind === 'listing');
  if (!items.length) {
    list.innerHTML = `<div class="empty-list"><h3>${escapeHTML(t('noSearchResults'))}</h3></div>`;
    return;
  }
  list.innerHTML = items.map(discoverListMarkup).join('');
}

function setViewMode(mode) {
  state.viewMode = mode === 'list' ? 'list' : 'swipe';
  $$('.view-toggle-button').forEach((button) => button.classList.toggle('is-active', button.dataset.view === state.viewMode));
  $('swipeView').classList.toggle('is-hidden', state.viewMode !== 'swipe');
  $('actionsLabel').classList.toggle('is-hidden', state.viewMode !== 'swipe');
  $('discoverList').classList.toggle('is-hidden', state.viewMode !== 'list');
  if (state.viewMode === 'list') renderDiscoverList();
  else renderDeck();
}

let listingsMap = null;
let listingMarkers = [];

function mapCoordinates(home) {
  const lat = home.sourceLat ?? home.geocodedLat ?? home.lat;
  const lng = home.sourceLng ?? home.geocodedLng ?? home.lng;
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
}

function ensureListingsMap() {
  if (listingsMap || !window.L) return listingsMap;
  listingsMap = window.L.map('listingsMap', { zoomControl: true, attributionControl: false }).setView([16.0544, 108.2022], 6);
  window.L.control.attribution({ prefix: '<a href="https://leafletjs.com">Leaflet</a>' }).addTo(listingsMap);
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(listingsMap);
  return listingsMap;
}

function renderMap() {
  const map = ensureListingsMap();
  if (!map) return;
  listingMarkers.forEach((marker) => marker.remove());
  listingMarkers = [];
  const items = filteredHomes().filter((home) => home.kind === 'listing' && mapCoordinates(home));
  $('mapEmpty').classList.toggle('is-hidden', items.length > 0);
  items.forEach((home) => {
    const coordinates = mapCoordinates(home);
    const marker = window.L.marker(coordinates).addTo(map);
    marker.bindPopup(`<div class="map-popup"><strong>${escapeHTML(locationLabel(home))}</strong><span>${escapeHTML(money(home.price))} · ${escapeHTML(home.title)}</span><button type="button" data-map-home="${escapeHTML(home.id)}">${escapeHTML(t('info'))}</button></div>`);
    listingMarkers.push(marker);
  });
  if (items.length) {
    map.fitBounds(window.L.latLngBounds(items.map(mapCoordinates)), { padding: [24, 24], maxZoom: 14 });
  } else {
    map.setView([16.0544, 108.2022], 6);
  }
  window.setTimeout(() => map.invalidateSize(), 60);
}

function handleImageError(event) {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || !image.dataset.homeId) return;
  const home = homes.find((item) => item.id === image.dataset.homeId);
  if (!home?.photos?.length) return;
  const currentIndex = Number(image.dataset.photoIndex || 0);
  const attempts = Number(image.dataset.fallbackAttempts || 0);
  if (attempts >= home.photos.length) return;
  const nextIndex = (currentIndex + 1) % home.photos.length;
  image.dataset.photoIndex = String(nextIndex);
  image.dataset.fallbackAttempts = String(attempts + 1);
  image.src = thumbUrl(home.photos[nextIndex], Number(image.dataset.photoWidth || 960));
}

function withTimeout(promise, timeoutMs, label) {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error(label)), timeoutMs);
    Promise.resolve(promise)
      .then(resolve, reject)
      .finally(() => window.clearTimeout(timeout));
  });
}

function skipUnavailableTadsStatic(home, reason, error = '') {
  if (!isTadsStaticHome(home)) return;
  const current = currentHome();
  if (current?.id !== home.id) return;
  state.seen[home.id] = Number(state.seen[home.id] || 0) + 1;
  state.queue = state.queue.filter((id) => id !== home.id);
  saveState();
  void recordAction('tads_static_skip_unavailable', '', {
    widgetId: home.widgetId,
    slot: home.id,
    reason,
    error,
  });
  render();
}

function mountTopTadsStaticCard() {
  const home = currentHome();
  if (!isTadsStaticHome(home)) return;
  const card = $('deck').querySelector('.home-card[data-depth="0"].is-tads-ad');
  if (!card || card.dataset.tadsMounting === '1') return;
  if (tadsState.mountedStaticSlot === home.id && card.classList.contains('is-tads-loaded')) return;
  card.dataset.tadsMounting = '1';
  tadsState.mountedStaticSlot = home.id;

  ensureTadsController(home.widgetId, 'STATIC')
    .then((controller) => {
      if (!controller?.loadAd || !controller?.showAd) throw new Error('TADS static controller is not ready');
      return withTimeout(controller.loadAd()
        .then((data) => {
          const loadedType = String(data?.type || 'static').toLowerCase();
          if (loadedType !== 'static') return null;
          return controller.showAd();
        }), 5500, 'TADS static load timeout');
    })
    .then(() => {
      card.dataset.tadsMounting = '0';
      card.classList.add('is-tads-loaded');
      void recordAction('tads_static_loaded', '', { widgetId: home.widgetId, slot: home.id });
    })
    .catch((error) => {
      console.warn('TADS static load failed:', error);
      card.dataset.tadsMounting = '0';
      card.classList.remove('is-tads-loaded');
      tadsState.mountedStaticSlot = '';
      void recordAction('tads_static_error', '', { widgetId: home.widgetId, slot: home.id, error: String(error?.message || error) });
      skipUnavailableTadsStatic(home, 'load_failed', String(error?.message || error));
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

function advance(home, meta = {}) {
  state.seen[home.id] = Number(state.seen[home.id] || 0) + 1;
  state.history.push({
    id: home.id,
    saved: Boolean(meta.saved),
    wasFavorite: Boolean(meta.wasFavorite),
  });
  state.queue = state.queue.filter((id) => id !== home.id);
  saveState();
}

function undoLastSwipe() {
  if (state.animating) return;
  const entry = state.history.pop();
  const id = typeof entry === 'string' ? entry : entry?.id;
  if (!id) {
    toast(t('undoNothing'));
    return;
  }

  const home = homes.find((item) => item.id === id);
  if (!home) {
    render();
    return;
  }

  const remainingViews = Math.max(0, Number(state.seen[id] || 0) - 1);
  if (remainingViews > 0) state.seen[id] = remainingViews;
  else delete state.seen[id];

  if (entry?.saved && !entry.wasFavorite) {
    state.favorites.delete(id);
  }

  state.queue = state.queue.filter((itemID) => itemID !== id);
  state.queue.unshift(id);
  saveState();
  render();
  toast(t('undoToast'));
  haptic('light');
}

function isSessionPaywalled() {
  if (!paywallEnabled()) return false;
  return Boolean(state.session?.usage?.paywalled);
}

function paywallVariant() {
  return state.session?.subscription?.paywallVariant || state.session?.user?.paywallVariant || 'view_paywall';
}

function isViewPaywallVariant() {
  return paywallVariant() !== 'contact_paywall';
}

function contactsLocked() {
  if (!paywallEnabled()) return false;
  return Boolean(state.session?.subscription?.contactsLocked || state.session?.subscription?.contactPaywalled);
}

function wouldExceedViewLimit(home) {
  if (!paywallEnabled()) return false;
  if (home?.kind === 'ad') return false;
  const usage = state.session?.usage;
  if (!isViewPaywallVariant()) return false;
  if (!usage || state.session?.user?.isSubscribed || state.seen[home.id]) return false;
  return Boolean(usage.paywalled) || Number(usage.remaining) <= 0;
}

function consumeViewOptimistically(home) {
  if (!paywallEnabled()) return;
  if (home?.kind === 'ad') return;
  const usage = state.session?.usage;
  if (!isViewPaywallVariant()) return;
  if (!usage || state.session?.user?.isSubscribed || state.seen[home.id]) return;
  const nextUsage = {
    ...usage,
    viewed: Number(usage.viewed || 0) + 1,
    remaining: Math.max(0, Number(usage.remaining || 0) - 1),
  };
  nextUsage.paywalled = nextUsage.remaining <= 0;
  applySession({ ...state.session, usage: nextUsage }, { openPaywall: false });
}

function trackSwipeActions(home, direction, save) {
  if (isTadsStaticHome(home)) {
    void recordAction('tads_static_swipe', '', {
      widgetId: home.widgetId,
      direction,
      save,
      slot: home.id,
    });
    return;
  }
  if (home.kind === 'ad') {
    void recordAction(direction === 'left' ? 'ad_skip' : 'ad_impression', '', {
      adId: home.adId,
      direction,
      save,
      source: 'feed',
    });
    return;
  }
  void recordAction('view', home.id, { direction, save }).then((allowed) => {
    if (allowed && save) {
      void recordAction('favorite', home.id, { source: 'swipe' });
    }
  });
}

function shouldShowTadsFullscreen(home) {
  if (home?.kind !== 'listing' || !tadsFullscreenWidgetId()) return false;
  state.tadsListingSwipes += 1;
  return state.tadsListingSwipes % tadsFullscreenFrequency() === 0;
}

function showTadsFullscreen(reason = 'listing_breakpoint') {
  const widgetId = tadsFullscreenWidgetId();
  if (!widgetId || state.tadsFullscreenOpen) return;
  state.tadsFullscreenOpen = true;
  ensureTadsController(widgetId, 'FULLSCREEN')
    .then((controller) => controller?.showAd?.())
    .then(() => {
      void recordAction('tads_fullscreen_show', '', { widgetId, reason });
    })
    .catch((error) => {
      console.warn('TADS fullscreen failed:', error);
      void recordAction('tads_fullscreen_error', '', { widgetId, reason, error: String(error?.message || error) });
    })
    .finally(() => {
      window.setTimeout(() => {
        state.tadsFullscreenOpen = false;
      }, 1200);
    });
}

function animateAndAdvance(direction, { save = false } = {}) {
  if (state.animating) return;
  const home = currentHome();
  const card = $('deck').querySelector('.home-card[data-depth="0"]');
  if (!home || !card) {
    render();
    return;
  }

  if (isSessionPaywalled() || wouldExceedViewLimit(home)) {
    showPaywall();
    return;
  }

  const isAd = home.kind === 'ad';
  const isTadsStatic = isTadsStaticHome(home);
  const showFullscreenAfterAdvance = shouldShowTadsFullscreen(home);
  const wasFavorite = state.favorites.has(home.id);
  const savedBySwipe = save && !isAd && !isTadsStatic;
  state.animating = true;
  const likeStamp = card.querySelector('.stamp.like');
  const skipStamp = card.querySelector('.stamp.skip');
  if (direction === 'right') likeStamp.style.opacity = '1';
  if (direction === 'left') skipStamp.style.opacity = '1';
  animateStackBehind();
  consumeViewOptimistically(home);
  trackSwipeActions(home, direction, save);

  if (save && isTadsStatic) {
    haptic('medium');
  } else if (save && isAd) {
    void recordAction('ad_click', '', { adId: home.adId, source: 'swipe_right' });
    openUrl(home.fbUrl);
    haptic('medium');
  } else if (save) {
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
    advance(home, { saved: savedBySwipe, wasFavorite });
    state.animating = false;
    render();
    if (showFullscreenAfterAdvance) window.setTimeout(() => showTadsFullscreen('after_listing_swipes'), 320);
    if (save && isAd) toast(t('adOpened'));
    else if (save && !isTadsStatic) toast(t('addedToShortlist'));
  }, direction === 'right' ? 600 : 420);
}

function refreshTopCardPhoto(home) {
  const card = $$('.home-card', $('deck')).find((node) => node.dataset.id === home.id);
  if (!card) return;
  const selectedPhoto = photoIndex(home);
  const nextSrc = home.photos[selectedPhoto] || home.photos[0];
  const bg = card.querySelector('.photo-bg');
  const image = card.querySelector('.photo-main');
  const progress = card.querySelector('.photo-rail');
  const progressFill = card.querySelector('.photo-rail span');
  if (bg) bg.src = nextSrc;
  if (image) image.src = nextSrc;
  if (progress) {
    progress.setAttribute('aria-label', t('photoProgress', { current: selectedPhoto + 1, total: home.photos.length }));
    progress.setAttribute('aria-valuenow', String(selectedPhoto + 1));
  }
  if (progressFill) progressFill.style.width = `${((selectedPhoto + 1) / home.photos.length) * 100}%`;
}

function attachDrag(card) {
  let startX = 0;
  let startY = 0;
  let dx = 0;
  let dy = 0;
  let dragging = false;
  let pointerId = null;
  let maxMove = 0;

  function resetCard() {
    card.classList.remove('dragging');
    card.style.transition = 'transform .34s cubic-bezier(.22, 1, .36, 1), opacity .35s ease';
    card.style.transform = cardPosition(0);
    card.style.opacity = '1';
    card.querySelector('.stamp.like').style.opacity = '0';
    card.querySelector('.stamp.skip').style.opacity = '0';
  }

  function releasePointer() {
    if (pointerId !== null && card.hasPointerCapture?.(pointerId)) {
      card.releasePointerCapture(pointerId);
    }
    pointerId = null;
  }

  function cancelDrag(event) {
    if (!dragging) return;
    dragging = false;
    releasePointer();
    resetCard();
    event?.preventDefault?.();
  }

  card.addEventListener('pointerdown', (event) => {
    if (state.animating || event.target.closest('button, a, .tads-card-host, .tads-card-host *')) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    dragging = true;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    dx = 0;
    dy = 0;
    maxMove = 0;
    card.classList.add('dragging');
    card.setPointerCapture?.(pointerId);
  });

  card.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    event.preventDefault();
    dx = event.clientX - startX;
    dy = event.clientY - startY;
    maxMove = Math.max(maxMove, Math.hypot(dx, dy));
    card.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx * .05}deg)`;
    card.querySelector('.stamp.like').style.opacity = dx > 0 ? String(clamp(dx / 110, 0, 1)) : '0';
    card.querySelector('.stamp.skip').style.opacity = dx < 0 ? String(clamp(-dx / 110, 0, 1)) : '0';
  });

  function finish(event) {
    if (!dragging) return;
    dragging = false;
    card.classList.remove('dragging');
    releasePointer();
    if (maxMove < 14) {
      const home = currentHome();
      if (home?.photos?.length > 1) {
        const rect = card.getBoundingClientRect();
        stepPhoto(home, startX < rect.left + rect.width / 2 ? -1 : 1);
        refreshTopCardPhoto(home);
        haptic('light');
      }
      card.style.transform = cardPosition(0);
      card.querySelector('.stamp.like').style.opacity = '0';
      card.querySelector('.stamp.skip').style.opacity = '0';
      event?.preventDefault();
      return;
    }
    if (dx > 105) return animateAndAdvance('right', { save: true });
    if (dx < -105) return animateAndAdvance('left');
    resetCard();
    event?.preventDefault();
  }

  card.addEventListener('dragstart', (event) => event.preventDefault());
  card.addEventListener('selectstart', (event) => event.preventDefault());
  card.addEventListener('contextmenu', (event) => event.preventDefault());
  card.addEventListener('pointerup', finish);
  card.addEventListener('pointercancel', cancelDrag);
  card.addEventListener('lostpointercapture', cancelDrag);
  window.addEventListener('blur', cancelDrag);
}

function setScreen(screen) {
  state.screen = screen;
  $$('.screen').forEach((node) => node.classList.toggle('is-active', node.id === `screen-${screen}`));
  $$('.tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.screen === screen));
  if (screen === 'shortlist') renderShortlist();
  if (screen === 'filters') renderFilters();
  if (screen === 'profile') renderProfile();
  if (screen === 'map') renderMap();
  if (screen === 'discover') setViewMode(state.viewMode);
}

function renderShortlist() {
  const list = $('shortlist');
  const saved = [...state.favorites].map((id) => homes.find((home) => home.id === id)).filter((home) => home?.kind !== 'ad');
  $('shortlistCount').textContent = t('savedCount', { count: saved.length });

  if (!saved.length) {
    list.innerHTML = `
      <div class="empty-list">
        <span><svg viewBox="0 0 24 24"><path d="M6 4h12v17l-6-4-6 4z"/></svg></span>
        <h3>${escapeHTML(t('noSavedTitle'))}</h3>
        <p>${escapeHTML(t('noSavedText'))}</p>
      </div>
    `;
    return;
  }

  list.innerHTML = saved.map((home) => `
    <article class="saved-card" data-id="${escapeHTML(home.id)}">
      <img src="${escapeHTML(thumbUrl(home.photos[0], 360))}" alt="${escapeHTML(home.title)}" loading="lazy" decoding="async" data-home-id="${escapeHTML(home.id)}" data-photo-index="0" data-photo-width="360" />
      <div>
        <strong>${escapeHTML(money(home.price))}<small> ${escapeHTML(t('monthShort'))}</small></strong>
        <h3>${escapeHTML(locationLabel(home))}</h3>
        <p>${escapeHTML(displaySpecs(home).join(' · '))}</p>
      </div>
      <button class="remove" data-remove="${escapeHTML(home.id)}" type="button" aria-label="${escapeHTML(t('remove'))}">
        <svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17"/></svg>
      </button>
    </article>
  `).join('');
}

function renderFilters() {
  $('budgetRange').value = String(state.filters.budget);
  $('budgetLabel').textContent = formatBudget();
  $('furnishedToggle').classList.toggle('is-active', state.filters.furnished);
  $('cityChips').innerHTML = cityOptions().map(([value, label]) => chipButton(value, label, state.filters.city === value)).join('');
  $('currencyChips').innerHTML = currencyOptions().map(([value, label]) => chipButton(value, label, state.filters.currency === value)).join('');
  $('typeChips').innerHTML = typeOptions().map(([value, label]) => chipButton(value, label, state.filters.type === value)).join('');
  $('bedChips').innerHTML = bedOptions().map(([value, label]) => chipButton(value, label, state.filters.beds === value)).join('');
  $('resultCount').textContent = String(filteredListingCount());
}

function chipButton(value, label, active) {
  return `<button class="chip ${active ? 'is-active' : ''}" data-value="${escapeHTML(value)}" type="button">${escapeHTML(label)}</button>`;
}

function renderProfile() {
  const seen = Object.entries(state.seen).reduce((sum, [id, count]) => id.startsWith('ad:') ? sum : sum + Number(count || 0), 0);
  const resultCount = filteredListingCount();
  const currency = CURRENCIES[state.filters.currency] || CURRENCIES.usd;
  $('profileSaved').textContent = String(state.favorites.size);
  $('profileSeen').textContent = String(seen);
  $('profileBudget').textContent = formatMoney(state.filters.budget);
  $('profileCities').textContent = state.filters.city === 'all' ? t('all') : cityLabel(state.filters.city);
  $('profileType').textContent = typeLabel(state.filters.type);
  $('profileCurrency').textContent = currency.label;
  $('profileSubtitle').textContent = state.filters.city === 'all' ? t('searchingAll') : t('searchingCity', { city: cityLabel(state.filters.city) });
  $('profileLanguageValue').textContent = activeLanguage.toUpperCase();
  $('searchSummary').textContent = searchSummary();
  $('searchResultSummary').textContent = t('searchResults', { count: resultCount });
  renderSearchPreview();
}

function searchSummary() {
  const parts = [
    state.filters.city === 'all' ? t('allVietnam') : cityLabel(state.filters.city),
    formatBudget(),
  ];
  if (state.filters.type !== 'all') parts.push(typeLabel(state.filters.type));
  if (state.filters.beds !== 'any') parts.push(state.filters.beds === 'studio' ? t('studio') : `${state.filters.beds}+ ${t('bedrooms').toLowerCase()}`);
  if (state.filters.furnished) parts.push(t('furnished'));
  return parts.join(' · ');
}

function searchPreviewCard(home) {
  return `
    <article class="search-preview-card" data-id="${escapeHTML(home.id)}">
      <img src="${escapeHTML(thumbUrl(home.photos[0], 320))}" alt="${escapeHTML(home.title)}" loading="lazy" decoding="async" data-home-id="${escapeHTML(home.id)}" data-photo-index="0" data-photo-width="320" />
      <div>
        <strong>${escapeHTML(money(home.price))}<small> ${escapeHTML(t('monthShort'))}</small></strong>
        <h4>${escapeHTML(locationLabel(home))}</h4>
        <p>${escapeHTML(home.title)}</p>
      </div>
    </article>
  `;
}

function renderSearchPreview() {
  const list = $('searchPreviewList');
  const items = filteredHomes().filter((home) => home.kind === 'listing').slice(0, 4);
  if (!items.length) {
    list.innerHTML = `<div class="search-preview-empty">${escapeHTML(t('noSearchResults'))}</div>`;
    return;
  }
  list.innerHTML = items.map(searchPreviewCard).join('');
}

function renderCounters() {
  const count = state.favorites.size;
  $('shortlistBadge').textContent = String(count);
  $('shortlistBadge').classList.toggle('is-visible', count > 0);
  $('favoriteShortcutCount').textContent = String(count);
  if (state.screen === 'shortlist') renderShortlist();
  if (state.screen === 'profile') renderProfile();
}

function renderShell() {
  const count = filteredListingCount();
  $('shellCity').textContent = state.filters.city === 'all' ? t('vietnam') : cityLabel(state.filters.city);
  $('tripSummary').textContent = searchSummary();
  $('tripSubline').textContent = t('matchingHomes', { count });
  $('favoriteShortcutCount').textContent = String(state.favorites.size);
  $$('.quick-chip').forEach((button) => button.classList.toggle('is-active', button.dataset.quick === state.quickFilter));
}

function activeDetail() {
  return homes.find((home) => home.id === state.activeDetailId) || currentHome();
}

function detailSpecItems(home) {
  const specs = displaySpecs(home);
  const result = [
    [money(home.price), t('monthCaption')],
    [typeLabel(home.type), t('type')],
    [`${fitScore(home)}%`, t('fit')],
  ];
  specs.forEach((spec) => {
    const parts = String(spec).split(/\s+/);
    result.push([parts.slice(0, 2).join(' '), parts.slice(2).join(' ') || t('details')]);
  });
  return result.slice(0, 6);
}

function openDetail(home = currentHome(), { track = true } = {}) {
  if (!home) return;
  state.activeDetailId = home.id;
  if (track) void recordAction('open_detail', home.id, { screen: state.screen });
  state.detailPhotoIndex = photoIndex(home);
  renderDetailPhoto(home);
  $('detailPrice').textContent = money(home.price);
  $('detailTitle').textContent = home.title;
  $('detailArea').textContent = locationLabel(home);
  $('detailScore').textContent = String(fitScore(home));
  $('detailGallery').innerHTML = home.photos.map((photo, index) => `<button class="detail-thumb${index === state.detailPhotoIndex ? ' is-active' : ''}" data-photo-index="${index}" type="button" aria-label="${escapeHTML(t('showPhoto', { number: index + 1 }))}"><img src="${escapeHTML(thumbUrl(photo, 360))}" alt="${escapeHTML(t('homePhoto', { title: home.title, number: index + 1 }))}" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async" data-home-id="${escapeHTML(home.id)}" data-photo-index="${index}" data-photo-width="360" /></button>`).join('');
  $('detailSpecs').innerHTML = detailSpecItems(home).map(([main, caption]) => `<div><strong>${escapeHTML(main)}</strong><span>${escapeHTML(caption)}</span></div>`).join('');
  $('detailAbout').textContent = home.about;
  const amenities = [...new Set([...home.tags, ...home.details])].filter(Boolean).slice(0, 10);
  $('detailAmenities').innerHTML = (amenities.length ? amenities : ['Facebook Marketplace', home.source]).map((tag) => `<span>${escapeHTML(tag)}</span>`).join('');
  $('detailPrimaryBtn').textContent = state.favorites.has(home.id)
    ? (contactsLocked() ? t('openContacts') : t('openOriginal'))
    : t('addFavorite');
  $('detailOverlay').classList.add('is-open');
  $('detailOverlay').setAttribute('aria-hidden', 'false');
}

function renderDetailPhoto(home = activeDetail()) {
  if (!home) return;
  const index = currentDetailPhotoIndex(home);
  const photo = home.photos[index] || home.photos[0];
  $('detailHero').style.backgroundImage = `url("${photo}")`;
  $$('.detail-thumb', $('detailGallery')).forEach((thumb) => {
    thumb.classList.toggle('is-active', Number(thumb.dataset.photoIndex) === index);
  });
}

function selectDetailPhoto(index) {
  const home = activeDetail();
  if (!home) return;
  state.detailPhotoIndex = setPhotoIndex(home, index, { syncDetail: true });
  renderDetailPhoto(home);
}

function openPhotoViewer(home = activeDetail(), index = state.detailPhotoIndex) {
  if (!home?.photos?.length) return;
  state.viewerHomeId = home.id;
  state.viewerPhotoIndex = setPhotoIndex(home, index, { syncDetail: state.activeDetailId === home.id });
  renderPhotoViewer();
  $('photoViewer').classList.add('is-open');
  $('photoViewer').setAttribute('aria-hidden', 'false');
}

function activeViewerHome() {
  return homes.find((home) => home.id === state.viewerHomeId) || activeDetail();
}

function renderPhotoViewer() {
  const home = activeViewerHome();
  if (!home?.photos?.length) return;
  const index = clamp(Number(state.viewerPhotoIndex) || 0, 0, home.photos.length - 1);
  state.viewerPhotoIndex = index;
  $('viewerImage').src = home.photos[index];
  $('viewerImage').alt = t('viewerPhotoAlt', { title: home.title, number: index + 1 });
  $('viewerCount').textContent = `${index + 1} / ${home.photos.length}`;
}

function stepPhotoViewer(delta) {
  const home = activeViewerHome();
  if (!home?.photos?.length) return;
  state.viewerPhotoIndex = setPhotoIndex(home, state.viewerPhotoIndex + delta, { syncDetail: state.activeDetailId === home.id });
  renderPhotoViewer();
  renderDetailPhoto(home);
}

function closePhotoViewer() {
  $('photoViewer').classList.remove('is-open');
  $('photoViewer').setAttribute('aria-hidden', 'true');
}

function openAd(home, source = 'card') {
  if (!home?.fbUrl) return;
  void recordAction('ad_click', '', { adId: home.adId, source });
  openUrl(home.fbUrl);
}

function openCardInfo() {
  const home = currentHome();
  if (!home) return;
  if (isTadsStaticHome(home)) {
    toast(t('adDefaultCta'));
    return;
  }
  if (home.kind === 'ad') {
    openAd(home, 'info_button');
    return;
  }
  openDetail(home);
}

function showPaywall(reason = 'views') {
  if (!paywallEnabled()) return;
  state.paywallOpen = true;
  const supportUrl = state.session?.subscription?.supportUrl || window.VIETNEST_SUBSCRIPTION_URL || 'https://t.me/teamgenius_support';
  $('paywallSubscribeBtn').dataset.url = supportUrl;
  const contactReason = reason === 'contacts' || contactsLocked();
  $('paywallTitle').textContent = contactReason ? t('paywallContactsTitle') : t('paywallViewsTitle');
  $('paywallText').textContent = contactReason
    ? t('paywallContactsText')
    : t('paywallViewsText');
  $('paywallMeter').style.display = contactReason ? 'none' : '';
  $('paywallNote').style.display = contactReason ? 'none' : '';
  updatePaywallNote();
  $('paywallOverlay').classList.add('is-open');
  $('paywallOverlay').setAttribute('aria-hidden', 'false');
}

function closePaywall() {
  state.paywallOpen = false;
  $('paywallOverlay').classList.remove('is-open');
  $('paywallOverlay').setAttribute('aria-hidden', 'true');
}

function openSubscriptionChat() {
  const url = $('paywallSubscribeBtn').dataset.url || state.session?.subscription?.supportUrl || window.VIETNEST_SUBSCRIPTION_URL;
  void recordAction('paywall_click', '', { viewed: state.session?.usage?.viewed || 0, variant: paywallVariant() });
  openUrl(url);
}

function closeDetail() {
  $('detailOverlay').classList.remove('is-open');
  $('detailOverlay').setAttribute('aria-hidden', 'true');
  closePhotoViewer();
}

function openListingContact(home, source) {
  if (!home) return;
  if (home.kind === 'ad') {
    openAd(home, source);
    return;
  }
  if (contactsLocked() || !home.fbUrl) {
    showPaywall('contacts');
    void recordAction('open_contact', home.id, { source, locked: true });
    return;
  }
  void recordAction('open_facebook', home.id, { source });
  openUrl(home.fbUrl);
}

async function saveDetail() {
  const home = activeDetail();
  if (!home) return;
  if (home.kind === 'ad') {
    openAd(home, 'detail_primary');
    return;
  }
  if (state.favorites.has(home.id)) {
    openListingContact(home, 'detail_primary');
    return;
  }
  state.favorites.add(home.id);
  void recordAction('favorite', home.id, { source: 'detail' });
  saveState();
  renderCounters();
  $('detailPrimaryBtn').textContent = contactsLocked() ? t('openContacts') : t('openOriginal');
  toast(t('addedToShortlist'));
}

async function loadHomes() {
  try {
    const data = await api('/api/feed');
    if (Array.isArray(data) && data.length) {
      homes = data.map(normalizeFeedItem).filter(Boolean);
      return;
    }
  } catch (error) {
    console.warn('Feed unavailable, trying listings:', error);
  }
  try {
    const data = await api('/api/listings');
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

  $('currencyChips').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-value]');
    if (!button) return;
    state.filters.currency = button.dataset.value;
    renderFilters();
    if (state.screen === 'profile') renderProfile();
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
    void recordSearch();
    setScreen('discover');
    toast(t('filtersApplied'));
  });
}

function bind() {
  $$('.tab').forEach((tab) => tab.addEventListener('click', () => setScreen(tab.dataset.screen)));
  $('openFiltersTop').addEventListener('click', () => setScreen('filters'));
  $('mapFiltersBtn').addEventListener('click', () => setScreen('filters'));
  $('cityShortcut').addEventListener('click', () => setScreen('filters'));
  $('favoriteShortcut').addEventListener('click', () => setScreen('shortlist'));
  $('editSearchBtn').addEventListener('click', () => setScreen('filters'));
  $$('.view-toggle-button').forEach((button) => button.addEventListener('click', () => setViewMode(button.dataset.view)));
  $$('.quick-chip').forEach((button) => button.addEventListener('click', () => {
    state.quickFilter = button.dataset.quick || 'best';
    resetQueue();
    render();
  }));
  $('resetSeenBtn').addEventListener('click', () => {
    resetQueue({ clearSeen: true });
    render();
    toast(t('searchResetDone'));
  });
  $('undoBtn')?.addEventListener('click', undoLastSwipe);
  $('skipBtn')?.addEventListener('click', () => animateAndAdvance('left'));
  $('likeBtn').addEventListener('click', () => animateAndAdvance('right', { save: true }));
  $('infoBtn')?.addEventListener('click', openCardInfo);
  $('resetDeckBtn').addEventListener('click', () => {
    resetQueue({ clearSeen: true });
    render();
  });
  $('languageToggleBtn').addEventListener('click', () => {
    setLanguage(activeLanguage === 'ru' ? 'en' : 'ru');
  });

  $('shortlist').addEventListener('click', (event) => {
    const remove = event.target.closest('button[data-remove]');
    if (remove) {
      state.favorites.delete(remove.dataset.remove);
      void recordAction('unfavorite', remove.dataset.remove, { source: 'shortlist' });
      saveState();
      render();
      return;
    }
    const card = event.target.closest('.saved-card[data-id]');
    if (card) openDetail(homes.find((home) => home.id === card.dataset.id));
  });

  $('discoverList').addEventListener('click', (event) => {
    const card = event.target.closest('.discover-list-card[data-id]');
    if (!card) return;
    const home = homes.find((item) => item.id === card.dataset.id);
    if (!home) return;
    const action = event.target.closest('button[data-action]')?.dataset.action;
    if (action === 'save') {
      if (state.favorites.has(home.id)) state.favorites.delete(home.id);
      else state.favorites.add(home.id);
      void recordAction(state.favorites.has(home.id) ? 'favorite' : 'unfavorite', home.id, { source: 'discover_list' });
      saveState();
      render();
      return;
    }
    openDetail(home, { track: true });
  });

  $('screen-map').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-map-home]');
    if (!button) return;
    openDetail(homes.find((home) => home.id === button.dataset.mapHome), { track: true });
  });

  $('searchPreviewList').addEventListener('click', (event) => {
    const card = event.target.closest('.search-preview-card[data-id]');
    if (!card) return;
    openDetail(homes.find((home) => home.id === card.dataset.id), { track: true });
  });

  $('closeDetailBtn').addEventListener('click', closeDetail);
  $('detailExpandBtn').addEventListener('click', () => openPhotoViewer());
  $('detailHero').addEventListener('click', (event) => {
    if (event.target.closest('button')) return;
    openPhotoViewer();
  });
  $('detailGallery').addEventListener('click', (event) => {
    const thumb = event.target.closest('button[data-photo-index]');
    if (!thumb) return;
    selectDetailPhoto(Number(thumb.dataset.photoIndex) || 0);
  });
  $('detailLikeBtn').addEventListener('click', saveDetail);
  $('detailPrimaryBtn').addEventListener('click', saveDetail);
  $('openFbBtn').addEventListener('click', () => {
    const home = activeDetail();
    openListingContact(home, 'detail_secondary');
  });
  $('paywallCloseBtn').addEventListener('click', closePaywall);
  $('paywallSubscribeBtn').addEventListener('click', openSubscriptionChat);
  $('viewerCloseBtn').addEventListener('click', closePhotoViewer);
  $('viewerPrevBtn').addEventListener('click', () => stepPhotoViewer(-1));
  $('viewerNextBtn').addEventListener('click', () => stepPhotoViewer(1));
  $('photoViewer').addEventListener('click', (event) => {
    if (event.target.closest('button')) return;
    const rect = $('photoViewer').getBoundingClientRect();
    stepPhotoViewer(event.clientX < rect.left + rect.width / 2 ? -1 : 1);
  });
  window.addEventListener('keydown', (event) => {
    if ($('photoViewer').classList.contains('is-open')) {
      if (event.key === 'Escape') closePhotoViewer();
      if (event.key === 'ArrowLeft') stepPhotoViewer(-1);
      if (event.key === 'ArrowRight') stepPhotoViewer(1);
    } else if ($('paywallOverlay').classList.contains('is-open') && event.key === 'Escape') {
      closePaywall();
    } else if ($('detailOverlay').classList.contains('is-open') && event.key === 'Escape') {
      closeDetail();
    }
  });

  bindFilters();
  document.addEventListener('error', handleImageError, true);
}

function hasActiveFilters() {
  const f = state.filters;
  return f.city !== defaultFilters.city
    || f.type !== defaultFilters.type
    || f.beds !== defaultFilters.beds
    || f.budget !== defaultFilters.budget
    || f.furnished !== defaultFilters.furnished
    || f.currency !== defaultFilters.currency;
}

function render() {
  if (state.viewMode === 'list') renderDiscoverList();
  else renderDeck();
  renderCounters();
  renderShell();
  $('openFiltersTop')?.classList.toggle('has-active', hasActiveFilters());
  if ($('undoBtn')) $('undoBtn').disabled = state.history.length === 0;
  if (state.screen === 'filters') renderFilters();
  if (state.screen === 'profile') renderProfile();
  if (state.screen === 'map') renderMap();
  saveState();
}

async function init() {
  const loaderStartedAt = Date.now();
  const loaderFailsafe = window.setTimeout(hideAppLoader, 12000);
  try {
    tg?.ready?.();
    tg?.expand?.();
    tg?.disableVerticalSwipes?.();
    syncAppViewport();
    window.setTimeout(syncAppViewport, 120);
    window.setTimeout(syncAppViewport, 450);
  } catch {
    // ignore Telegram SDK errors outside Telegram.
  }
  bind();
  applyI18n();
  renderFilters();
  try {
    await loadSession();
    await loadHomes();
    resetQueue();
    render();
    await waitForInitialAssets();
  } finally {
    const remainingAnimationTime = Math.max(0, 650 - (Date.now() - loaderStartedAt));
    if (remainingAnimationTime) await delay(remainingAnimationTime);
    window.clearTimeout(loaderFailsafe);
    hideAppLoader();
  }
}

init();
