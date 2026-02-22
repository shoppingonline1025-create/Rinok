// ============================================
// AUTOMARKET v7.6 - HIERARCHICAL MODEL SELECTION
// Дата обновления: 2026-02-22
// ============================================
//
// ДОБАВЛЕНО В v7.6:
// ✅ Трёхуровневая иерархия: Марка → Модель → Версия/Комплектация
// ✅ BMW и Honda в иерархической структуре (пример для остальных марок)
// ✅ Модальное окно выбора варианта с опцией "Все {модель}"
// ✅ Улучшенная фильтрация с поддержкой обеих структур
// ✅ Совместимость со старыми данными
//
// ИСПРАВЛЕНО В v7.5:
// ✅ Объявления остаются в "Новинках" ровно 24ч с момента создания
// ✅ Поднятие НЕ возвращает объявление в "Новинки"
// ✅ Поднятые объявления сортируются по lastBoosted в разделе "Все"
// ============================================

// ╔══════════════════════════════════════════╗
// ║  FIREBASE REALTIME DATABASE              ║
// ║  Вставьте URL вашей базы данных          ║
// ║  firebase.google.com → Realtime DB       ║
// ╚══════════════════════════════════════════╝
const FIREBASE_URL = 'https://auto-market26-default-rtdb.europe-west1.firebasedatabase.app';

// ─── Администратор ────────────────────────────────────────────
const ADMIN_TELEGRAM_ID = 814278637; // Telegram ID администратора

function isAdmin() {
    if (!currentUser) return false;
    return String(currentUser.telegramId) === String(ADMIN_TELEGRAM_ID);
}


// ╔══════════════════════════════════════════════════════════════╗
// ║  CLOUDINARY — хранилище изображений                         ║
// ║  Фото загружаются сюда, в Firebase хранятся только URL      ║
// ╚══════════════════════════════════════════════════════════════╝
const CLOUDINARY_CLOUD_NAME = 'dn1fjuedu';
const CLOUDINARY_UPLOAD_PRESET = 'automarket_unsigned';

/**
 * Загрузка одного изображения в Cloudinary
 * @param {string} base64Data - изображение в формате base64 или data URL
 * @returns {Promise<string>} - URL загруженного изображения
 */
async function uploadToCloudinary(base64Data) {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    
    const formData = new FormData();
    formData.append('file', base64Data);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'cars');
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.secure_url) {
            console.log('✅ Cloudinary upload:', data.secure_url);
            return data.secure_url;
        } else {
            throw new Error(data.error?.message || 'Upload failed');
        }
    } catch (error) {
        console.error('❌ Cloudinary upload error:', error);
        throw error;
    }
}

/**
 * Загрузка массива изображений в Cloudinary
 * @param {string[]} base64Photos - массив base64 изображений
 * @param {function} onProgress - колбэк прогресса (index, total)
 * @returns {Promise<string[]>} - массив URL
 */
async function uploadPhotosToCloudinary(base64Photos, onProgress) {
    const urls = [];
    const total = base64Photos.length;
    
    for (let i = 0; i < base64Photos.length; i++) {
        const photo = base64Photos[i];
        
        // Если это уже URL (не base64) — пропускаем загрузку
        if (photo.startsWith('http://') || photo.startsWith('https://')) {
            urls.push(photo);
            if (onProgress) onProgress(i + 1, total);
            continue;
        }
        
        try {
            if (onProgress) onProgress(i + 1, total);
            const cloudinaryUrl = await uploadToCloudinary(photo);
            urls.push(cloudinaryUrl);
        } catch (e) {
            console.error(`Failed to upload photo ${i + 1}:`, e);
            // Не прерываем загрузку остальных фото
            // Можно вернуть base64 как fallback, но лучше пропустить
        }
    }
    
    return urls;
}

/**
 * Оптимизация URL Cloudinary — добавляет трансформации
 * @param {string} url - оригинальный URL
 * @param {number} width - желаемая ширина (по умолчанию 400)
 * @returns {string} - оптимизированный URL
 */
function getOptimizedImageUrl(url, width = 400) {
    // Только для Cloudinary URL
    if (!url || !url.includes('cloudinary.com')) {
        return url;
    }
    // Вставляем трансформации после /upload/
    // f_auto = автоформат (webp/avif), q_auto = автокачество, w_X = ширина
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
}

/**
 * URL для миниатюры (карточка объявления)
 */
function getThumbUrl(url) {
    return getOptimizedImageUrl(url, 400);
}

/**
 * URL для полноразмерного просмотра
 */
function getFullUrl(url) {
    return getOptimizedImageUrl(url, 1200);
}


// Нормализует Firebase array/object → всегда возвращает массив
function normalizeFirebaseArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'object') return Object.values(val);
    return [];
}


// Дополняем машины данными продавца из localStorage (для тестовых объявлений)
function enrichCarsWithSellerInfo(carsArr) {
    const users = DB.getUsers();
    return carsArr.map(car => {
        if (car.sellerInfo) return car; // уже есть — не трогаем
        const seller = users[car.userId];
        if (!seller) return car;
        return {
            ...car,
            sellerInfo: {
                name: seller.name || (seller.firstName + ' ' + (seller.lastName || '')).trim() || 'Продавец',
                username: seller.username || '',
                telegramId: seller.telegramId || seller.id || '',
                phone: seller.phone || '',
                city: seller.city || '',
                rating: Number(seller.rating || 0)
            }
        };
    });
}

// ╔══════════════════════════════════════════╗
// ║  FIREBASE SDK — WebSocket реальное время ║
// ╚══════════════════════════════════════════╝

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAa6huTUbUQrcyUF6t770imckBGcRAelqA",
    authDomain: "auto-market26.firebaseapp.com",
    databaseURL: "https://auto-market26-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "auto-market26",
    storageBucket: "auto-market26.firebasestorage.app",
    messagingSenderId: "175310798996",
    appId: "1:175310798996:web:42d5b24a8ac2ca6bd37481"
};

// Инициализация Firebase SDK
let _fbApp = null;
let _fbDb  = null;
let _carsListener = null; // активная подписка на /cars

function initFirebase() {
    try {
        _fbApp = firebase.initializeApp(FIREBASE_CONFIG);
        _fbDb  = firebase.database();
        console.log('Firebase SDK инициализирован ✅');
        return true;
    } catch(e) {
        console.error('Firebase init error:', e);
        return false;
    }
}

let _lastSyncTime = null;
let _syncError    = null;

function setSyncStatus(state, text) {
    const el = document.getElementById('syncStatus');
    if (!el) return;
    const icons = { ok: '🟢', error: '🔴', loading: '🔄', warn: '🟡' };
    el.textContent = icons[state] || '⏳';
    el.title = text || '';
    el.dataset.state = state;
}

function manualSync() {
    const el = document.getElementById('syncStatus');
    const state = el?.dataset?.state;
    if (state === 'ok') {
        tg.showAlert(`✅ Firebase WebSocket · v7.2\n${cars.length} объявлений\nОбновлено: ${_lastSyncTime?.toLocaleTimeString('ru-RU') || '—'}\n\nДанные обновляются автоматически в реальном времени`);
    } else if (state === 'error') {
        tg.showAlert(`❌ Ошибка: ${_syncError || 'нет соединения'}\n\nПопробуйте перезапустить приложение`);
    } else {
        tg.showAlert('⏳ Подключение к Firebase...');
    }
}

// --- Подписка на /cars через WebSocket (realtime) ---
function syncFromFirebase() {
    if (!_fbDb) { console.warn('Firebase not ready'); return Promise.resolve(); }

    return new Promise((resolve) => {
        setSyncStatus('loading', 'Подключение...');

        // Отписываемся от предыдущего listener если был
        if (_carsListener) {
            firebase.database().ref('cars').off('value', _carsListener);
        }

        let firstLoad = true;

        _carsListener = firebase.database().ref('cars').on('value',
            (snapshot) => {
                const data = snapshot.val();
                _lastSyncTime = new Date();
                _syncError = null;

                if (!data) {
                    // Firebase пуст — заливаем локальные данные
                    const localCars = DB.getCars();
                    if (localCars.length > 0) {
                        pushAllCarsToFirebase(localCars);
                        setSyncStatus('ok', `${localCars.length} объявл.`);
                    } else {
                        setSyncStatus('warn', 'База пуста');
                    }
                    if (firstLoad) { firstLoad = false; resolve(); }
                    return;
                }

                const fbCars = Object.values(data).filter(Boolean);

                // Свои локальные объявления которых ещё нет в Firebase — дозаливаем
                const localCars = DB.getCars();
                const fbIds = new Set(fbCars.map(c => String(c.id)));
                localCars.forEach(localCar => {
                    if (currentUser && String(localCar.userId) === String(currentUser.id)) {
                        if (!fbIds.has(String(localCar.id))) {
                            pushCarToFirebase(localCar);
                            fbCars.push(localCar);
                        }
                    }
                });

                DB.saveCars(fbCars);
                localStorage.setItem('automarket_initialized', 'true');
                cars = fbCars;

                if (firstLoad) {
                    firstLoad = false;
                    resolve(); // разблокируем await syncFromFirebase()
                    setSyncStatus('ok', `${cars.length} объявл. · ${_lastSyncTime.toLocaleTimeString('ru-RU')}`);
                } else {
                    // Последующие обновления — тихо рендерим
                    render();
                    setSyncStatus('ok', `${cars.length} объявл. · ${_lastSyncTime.toLocaleTimeString('ru-RU')}`);
                }
            },
            (error) => {
                _syncError = error.message;
                setSyncStatus('error', error.message);
                console.error('Firebase realtime error:', error);
                if (firstLoad) { firstLoad = false; resolve(); }
            }
        );
    });
}

// --- Сохранить одну машину ---
function pushCarToFirebase(car) {
    if (!_fbDb) return;
    firebase.database().ref(`cars/${car.id}`).set(car)
        .catch(e => {
            console.error('pushCar error:', e);
            setSyncStatus('error', `Ошибка записи: ${e.message}`);
        });
}

// --- Залить несколько машин (первый запуск) ---
function pushAllCarsToFirebase(carsArr) {
    if (!_fbDb) return;
    const obj = {};
    carsArr.forEach(c => { obj[c.id] = c; });
    return firebase.database().ref('cars').update(obj)
        .catch(e => console.error('pushAll error:', e));
}

// --- Удалить машину ---
function deleteCarFromFirebase(carId) {
    if (!_fbDb) return;
    firebase.database().ref(`cars/${carId}`).remove()
        .catch(e => console.error('deleteCarFromFirebase error:', e));
}

// --- Пользователи ---
async function pushUserToFirebase(user) {
    if (!_fbDb || !user?.id) return;
    const userToSave = {...user};
    delete userToSave.photo;
    try {
        await firebase.database().ref(`users/${user.id}`).set(userToSave);
    } catch(e) { console.warn('pushUser error:', e.message); }
}

async function loadUserFromFirebase(userId) {
    if (!_fbDb || !userId) return null;
    try {
        const snap = await firebase.database().ref(`users/${userId}`).once('value');
        return snap.val();
    } catch(e) {
        console.warn('loadUser error:', e.message);
        return null;
    }
}
// Нормализовать subscriptions после загрузки из Firebase
function normalizeSubscriptions(subs) {
    if (!subs) return {autoBoost: {active: false, carIds: [], cars: {}}};
    if (subs.autoBoost) {
        subs.autoBoost.carIds = normalizeFirebaseArray(subs.autoBoost.carIds);
        // cars — объект {carId: {activatedAt, expiresAt}}, нормализация не нужна
        if (!subs.autoBoost.cars) subs.autoBoost.cars = {};
    } else {
        subs.autoBoost = {active: false, carIds: [], cars: {}};
    }
    return subs;
}

// Синхронизировать текущего пользователя с Firebase при входе
async function syncUserFromFirebase(user) {
    const fbUser = await loadUserFromFirebase(user.id);
    if (!fbUser) {
        await pushUserToFirebase(user);
        return user;
    }
    // Берём данные из Firebase (баланс, транзакции, подписки актуальнее)
    const fbSubs = normalizeSubscriptions(fbUser.subscriptions);
    const merged = {
        ...user,
        balance: fbUser.balance ?? user.balance ?? 0,
        transactions: normalizeFirebaseArray(fbUser.transactions ?? user.transactions),
        subscriptions: fbSubs,
        freeBoostAvailableAt: fbUser.freeBoostAvailableAt ?? user.freeBoostAvailableAt ?? null,
        // Данные рейтинга — берём наибольшее (защита от отката)
        ratingPoints:      Math.max(fbUser.ratingPoints  ?? 0, user.ratingPoints  ?? 0),
        ratingLog:         fbUser.ratingLog     ?? user.ratingLog     ?? [],
        ratingFlags:       fbUser.ratingFlags   ?? user.ratingFlags   ?? {},
        streak:            fbUser.streak        ?? user.streak        ?? null,
        boost12hActivated: fbUser.boost12hActivated ?? user.boost12hActivated ?? null,
        tempTop:           fbUser.tempTop       ?? user.tempTop       ?? null,
        viewsData:         fbUser.viewsData     ?? user.viewsData     ?? {},
        favorites:         fbUser.favorites     ?? user.favorites     ?? [],
    };
    if (user.photo) merged.photo = user.photo;
    DB.saveUser(merged);
    return merged;
}

// --- Сжатие фото через canvas (для экономии места) ---
function compressImage(dataUrl, maxSize, quality) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;
            if (width > maxSize || height > maxSize) {
                if (width > height) { height = Math.round(height * maxSize / width); width = maxSize; }
                else { width = Math.round(width * maxSize / height); height = maxSize; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
}

let tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// iOS: отключаем свайп вниз который закрывает приложение
if (tg.disableVerticalSwipes) {
    tg.disableVerticalSwipes();
}

const DB = {
    // Вернуть машины из localStorage (только свои, без фото — экономия места)
    getCars: function() {
        const stored = localStorage.getItem('automarket_cars');
        const initialized = localStorage.getItem('automarket_initialized');
        if (initialized && stored) {
            try { return JSON.parse(stored); } catch(e) { return []; }
        }
        if (!initialized) {
            const initial = initCarsData();
            this._store(initial);
            localStorage.setItem('automarket_initialized', 'true');
            return initial;
        }
        return [];
    },

    // НИКОГДА не сохраняем фото в localStorage — только метаданные
    // Фото живут только в Firebase и в памяти (переменная cars)
    saveCars: function(arr) {
        const userId = (typeof currentUser !== 'undefined' && currentUser) ? currentUser.id : null;
        // Сохраняем только свои объявления, без фото
        const own = userId ? arr.filter(c => String(c.userId) === String(userId)) : arr;
        this._store(own);
    },

    _store: function(arr) {
        // Убираем фото и видео — они хранятся в Firebase
        const stripped = arr.map(function(c) {
            var m = Object.assign({}, c);
            delete m.photos;
            delete m.video;
            return m;
        });
        try {
            localStorage.setItem('automarket_cars', JSON.stringify(stripped));
        } catch(e) {
            // Даже метаданные не влезают — очищаем и пробуем заново
            localStorage.removeItem('automarket_cars');
            try { localStorage.setItem('automarket_cars', JSON.stringify(stripped)); } catch(e2) {
                console.error('localStorage полностью заполнен:', e2);
            }
        }
    },

    deleteCar: function(carId) {
        var saved = this.getCars().filter(function(c) { return c.id !== carId; });
        this._store(saved);
        // Возвращаем из памяти
        return (typeof cars !== 'undefined') ? cars.filter(function(c) { return c.id !== carId; }) : saved;
    },

    updateCar: function(carId, updates) {
        var saved = this.getCars();
        var idx = saved.findIndex(function(c) { return c.id === carId; });
        if (idx !== -1) { saved[idx] = Object.assign({}, saved[idx], updates); this._store(saved); }
        if (typeof cars !== 'undefined') {
            var mi = cars.findIndex(function(c) { return c.id === carId; });
            if (mi !== -1) cars[mi] = Object.assign({}, cars[mi], updates);
        }
        return (typeof cars !== 'undefined') ? cars : saved;
    },

    getUsers: function() {
        return JSON.parse(localStorage.getItem('users') || '{}');
    },

    saveUsers: function(users) {
        localStorage.setItem('users', JSON.stringify(users));
    },

    saveUser: function(user) {
        if (!user || !user.id) return;
        var users = this.getUsers();
        users[user.id] = user;
        this.saveUsers(users);
    },

    getFavorites: function() {
        return JSON.parse(localStorage.getItem('fav') || '[]');
    },

    saveFavorites: function(favorites) {
        localStorage.setItem('fav', JSON.stringify(favorites));
    }
};

let selectedCurrency = '$';
let uploadedPhotos = [];
let uploadedVideo = null;
let currentGalleryIndex = {};
let selectedBrand = '';
let selectedModel = '';
let cars = DB.getCars();
let favorites = DB.getFavorites(); // будет перезаписан из Firebase после initUser
let currentUser = null;
let currentEditField = '';
let formSelectedBrand = '';
let formSelectedModel = '';
let formSelectedVariant = ''; // Новая переменная для версии/комплектации
let formSelectedPartType = '';
let editingCarId = null;

// МНОЖЕСТВЕННЫЙ ВЫБОР - используем массивы
let selectedBrands = [];
let selectedModels = [];

let filters = {
    search: '',
    category: 'all',
    brands: [],  // Массив марок
    models: [],  // Массив моделей
    priceFrom: null,
    priceTo: null,
    yearFrom: null,
    yearTo: null,
    mileageFrom: null,
    mileageTo: null,
    city: '',
    registration: '',
    drive: '',  // Добавлено поле привода
    currency: '$'
};

let currentSection = 'all';
let topExpanded = false;
let newExpanded = false;
let allExpanded = false;

// Пагинация
const ITEMS_PER_PAGE = 20;
let topCurrentPage = 1;
let newCurrentPage = 1;
let allCurrentPage = 1;

function fmt(n) {
    if (n === null || n === undefined || isNaN(n)) return '0';
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function isNew(date) {
    const now = new Date();
    const carDate = typeof date === 'string' ? new Date(date) : date;
    const diffTime = Math.abs(now - carDate);
    const diffHours = diffTime / (1000 * 60 * 60);
    return diffHours <= 24; // Новинки - только 24 часа
}

// Получить дату для сортировки (lastBoosted если есть, иначе createdAt)
function getSortDate(car) {
    return car.lastBoosted || car.createdAt;
}

function formatDate(date) {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '—';
    const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} ${hours}:${mins}`;
}

function formatDateShort(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}`;
}

function setCurrency(c) {
    selectedCurrency = c;
    filters.currency = c;
    document.querySelectorAll('.currency-btn').forEach(b =>
        b.classList.toggle('active', b.textContent.includes(c))
    );
}

function selectCategory(cat) {
    filters.category = cat;
    document.querySelectorAll('.category-chip').forEach(c =>
        c.classList.toggle('active', c.dataset.category === cat)
    );
    
    // Для запчастей скрываем фильтры специфичные для транспорта
    const vehicleOnlyFilters = ['yearFilter', 'mileageFilter', 'driveFilter', 'regFilter'];
    const isParts = cat === 'parts';
    vehicleOnlyFilters.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = isParts ? 'none' : '';
    });
    
    render();
}

function toggleSection(section) {
    currentSection = section;
    render();
}

// TOGGLE для "Все >" - показать/скрыть
function toggleTopAll() {
    topExpanded = !topExpanded;
    const btn = document.getElementById('topAllBtn');
    const scroll = document.getElementById('topListings');
    const expanded = document.getElementById('topAllExpanded');
    
    if (topExpanded) {
        btn.textContent = 'Скрыть ↑';
        scroll.style.display = 'none';
        expanded.style.display = 'block';
        
        topCurrentPage = 1;
        renderExpandedTop();
    } else {
        btn.textContent = 'Все ›';
        scroll.style.display = 'flex';
        expanded.style.display = 'none';
    }
}

function renderExpandedTop() {
    let filtered = getFilteredCars();
    let top = filtered.filter(c => c.isTop);
    const totalPages = Math.ceil(top.length / ITEMS_PER_PAGE);
    
    const startIndex = (topCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageItems = top.slice(startIndex, endIndex);
    
    const expanded = document.getElementById('topAllExpanded');
    expanded.innerHTML = `
        <div class="listings-grid" style="padding: 0 16px;">${pageItems.map(makeCard).join('')}</div>
        ${totalPages > 1 ? `
            <div class="pagination">
                ${topCurrentPage > 1 ? `<button class="pagination-btn" onclick="changeTopPage(${topCurrentPage - 1})">‹ Назад</button>` : '<div></div>'}
                <div class="pagination-info">Страница ${topCurrentPage} из ${totalPages}</div>
                ${topCurrentPage < totalPages ? `<button class="pagination-btn" onclick="changeTopPage(${topCurrentPage + 1})">Вперёд ›</button>` : '<div></div>'}
            </div>
        ` : ''}
    `;
}

function changeTopPage(page) {
    topCurrentPage = page;
    renderExpandedTop();
    document.getElementById('topAllExpanded').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toggleNewAll() {
    newExpanded = !newExpanded;
    const btn = document.getElementById('newAllBtn');
    const scroll = document.getElementById('newListings');
    const expanded = document.getElementById('newAllExpanded');
    
    if (newExpanded) {
        btn.textContent = 'Скрыть ↑';
        scroll.style.display = 'none';
        expanded.style.display = 'block';
        
        newCurrentPage = 1;
        renderExpandedNew();
    } else {
        btn.textContent = 'Все ›';
        scroll.style.display = 'flex';
        expanded.style.display = 'none';
    }
}

function renderExpandedNew() {
    let filtered = getFilteredCars();
    let newCars = filtered.filter(c => isNew(c.createdAt)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const totalPages = Math.ceil(newCars.length / ITEMS_PER_PAGE);
    
    const startIndex = (newCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageItems = newCars.slice(startIndex, endIndex);
    
    const expanded = document.getElementById('newAllExpanded');
    expanded.innerHTML = `
        <div class="listings-grid" style="padding: 0 16px;">${pageItems.map(makeCard).join('')}</div>
        ${totalPages > 1 ? `
            <div class="pagination">
                ${newCurrentPage > 1 ? `<button class="pagination-btn" onclick="changeNewPage(${newCurrentPage - 1})">‹ Назад</button>` : '<div></div>'}
                <div class="pagination-info">Страница ${newCurrentPage} из ${totalPages}</div>
                ${newCurrentPage < totalPages ? `<button class="pagination-btn" onclick="changeNewPage(${newCurrentPage + 1})">Вперёд ›</button>` : '<div></div>'}
            </div>
        ` : ''}
    `;
}

function changeNewPage(page) {
    newCurrentPage = page;
    renderExpandedNew();
    document.getElementById('newAllExpanded').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Toggle для "Все объявления"
function toggleAllAll() {
    allExpanded = !allExpanded;
    const btn = document.getElementById('allAllBtn');
    const scroll = document.getElementById('allListings');
    const expanded = document.getElementById('allAllExpanded');
    
    if (allExpanded) {
        btn.textContent = 'Скрыть ↑';
        scroll.style.display = 'none';
        expanded.style.display = 'block';
        
        allCurrentPage = 1;
        renderExpandedAll();
    } else {
        btn.textContent = 'Все ›';
        scroll.style.display = 'flex';
        expanded.style.display = 'none';
    }
}

function renderExpandedAll() {
    let filtered = getFilteredCars();
    let topIds = filtered.filter(c => c.isTop).map(c => c.id);
    let newIds = filtered.filter(c => isNew(c.createdAt)).map(c => c.id);
    let allCars = filtered.filter(c => !topIds.includes(c.id) && !newIds.includes(c.id))
        .sort((a, b) => new Date(getSortDate(b)) - new Date(getSortDate(a)));
    
    const totalPages = Math.ceil(allCars.length / ITEMS_PER_PAGE);
    
    const startIndex = (allCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageItems = allCars.slice(startIndex, endIndex);
    
    const expanded = document.getElementById('allAllExpanded');
    expanded.innerHTML = `
        <div class="listings-grid" style="padding: 0 16px;">${pageItems.map(makeCard).join('')}</div>
        ${totalPages > 1 ? `
            <div class="pagination">
                ${allCurrentPage > 1 ? `<button class="pagination-btn" onclick="changeAllPage(${allCurrentPage - 1})">‹ Назад</button>` : '<div></div>'}
                <div class="pagination-info">Страница ${allCurrentPage} из ${totalPages}</div>
                ${allCurrentPage < totalPages ? `<button class="pagination-btn" onclick="changeAllPage(${allCurrentPage + 1})">Вперёд ›</button>` : '<div></div>'}
            </div>
        ` : ''}
    `;
}

function changeAllPage(page) {
    allCurrentPage = page;
    renderExpandedAll();
    document.getElementById('allAllExpanded').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getBrands() {
    // parts не имеет своего раздела BRANDS_DATA — используем легковые
    const cat = (filters.category === 'all' || filters.category === 'parts') ? 'car' : filters.category;
    return Object.keys(BRANDS_DATA[cat] || {}).sort();
}

function getModels(brand) {
    const cat = (filters.category === 'all' || filters.category === 'parts') ? 'car' : filters.category;
    const brandData = BRANDS_DATA[cat]?.[brand];
    
    if (!brandData) return [];
    
    // Если это массив (старая структура) - возвращаем как есть
    if (Array.isArray(brandData)) {
        return brandData;
    }
    
    // Если это объект (новая иерархическая структура) - возвращаем ключи (названия моделей)
    return Object.keys(brandData);
}

// МНОЖЕСТВЕННЫЙ ВЫБОР МАРОК
function openModal(id) {
    if (id === 'brandModal') {
        const brands = getBrands();
        const list = document.getElementById('brandList');
        list.innerHTML = brands.map(b =>
            `<div class="brand-option ${selectedBrands.includes(b) ? 'selected' : ''}" onclick="toggleBrandSelection('${b}')">${b}</div>`
        ).join('');
    }
    
    if (id === 'modelModal') {
        if (selectedBrands.length === 0) {
            tg.showAlert('Сначала выберите хотя бы одну марку');
            return;
        }
        
        // Собираем все модели выбранных марок
        let allModels = new Set();
        selectedBrands.forEach(brand => {
            const models = getModels(brand);
            models.forEach(m => allModels.add(m));
        });
        
        const list = document.getElementById('modelList');
        list.innerHTML = Array.from(allModels).sort().map(m =>
            `<div class="brand-option ${selectedModels.includes(m) ? 'selected' : ''}" onclick="toggleModelSelection('${m}')">${m}</div>`
        ).join('');
    }
    
    document.getElementById(id).classList.add('show');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

// TOGGLE выбор марки (множественный)
function toggleBrandSelection(brand) {
    const index = selectedBrands.indexOf(brand);
    if (index > -1) {
        selectedBrands.splice(index, 1);
    } else {
        selectedBrands.push(brand);
    }
    
    // Обновляем визуально
    document.querySelectorAll('#brandList .brand-option').forEach(el => {
        el.classList.toggle('selected', selectedBrands.includes(el.textContent));
    });
}

// TOGGLE выбор модели (множественный)
function toggleModelSelection(model) {
    const index = selectedModels.indexOf(model);
    if (index > -1) {
        selectedModels.splice(index, 1);
    } else {
        selectedModels.push(model);
    }
    
    // Обновляем визуально
    document.querySelectorAll('#modelList .brand-option').forEach(el => {
        el.classList.toggle('selected', selectedModels.includes(el.textContent));
    });
}

function selectBrandOption(brand) {
    selectedBrand = brand;
    document.querySelectorAll('#brandList .brand-option').forEach(el => {
        el.classList.toggle('selected', el.textContent === brand);
    });
}

function selectModelOption(model) {
    selectedModel = model;
    document.querySelectorAll('#modelList .brand-option').forEach(el => {
        el.classList.toggle('selected', el.textContent === model);
    });
}

function applyBrand() {
    filters.brands = [...selectedBrands];
    const btn = document.getElementById('brandFilter');
    
    if (filters.brands.length > 0) {
        const text = filters.brands.length === 1 ? filters.brands[0] : `${filters.brands.length} марки`;
        btn.innerHTML = `${text} <span class="filter-clear" onclick="event.stopPropagation();clearBrand()">×</span>`;
        btn.classList.add('active');
    } else {
        btn.textContent = 'Марка';
        btn.classList.remove('active');
    }
    
    closeModal('brandModal');
    render();
}

function applyModel() {
    filters.models = [...selectedModels];
    const btn = document.getElementById('modelFilter');
    
    if (filters.models.length > 0) {
        const text = filters.models.length === 1 ? filters.models[0] : `${filters.models.length} модели`;
        btn.innerHTML = `${text} <span class="filter-clear" onclick="event.stopPropagation();clearModel()">×</span>`;
        btn.classList.add('active');
    } else {
        btn.textContent = 'Модель';
        btn.classList.remove('active');
    }
    
    closeModal('modelModal');
    render();
}

function applyPrice() {
    let from = parseInt(document.getElementById('priceFrom').value);
    let to = parseInt(document.getElementById('priceTo').value);
    
    if (from > 0 || to > 0) {
        filters.priceFrom = from || null;
        filters.priceTo = to || null;
        
        let text = from && to ? `${fmt(from)}-${fmt(to)}` : from ? `От ${fmt(from)}` : `До ${fmt(to)}`;
        document.getElementById('priceFilter').innerHTML = 
            `${text} ${selectedCurrency} <span class="filter-clear" onclick="event.stopPropagation();clearPrice()">×</span>`;
        document.getElementById('priceFilter').classList.add('active');
    }
    
    closeModal('priceModal');
    render();
}

function applyYear() {
    let from = parseInt(document.getElementById('yearFrom').value);
    let to = parseInt(document.getElementById('yearTo').value);
    
    if (from || to) {
        filters.yearFrom = from || null;
        filters.yearTo = to || null;
        
        let text = from && to ? `${from}-${to}` : from ? `От ${from}` : `До ${to}`;
        document.getElementById('yearFilter').innerHTML = 
            `${text} <span class="filter-clear" onclick="event.stopPropagation();clearYear()">×</span>`;
        document.getElementById('yearFilter').classList.add('active');
    }
    
    closeModal('yearModal');
    render();
}

function applyMileage() {
    let from = parseInt(document.getElementById('mileageFrom').value);
    let to = parseInt(document.getElementById('mileageTo').value);
    
    if (from > 0 || to > 0) {
        filters.mileageFrom = from || null;
        filters.mileageTo = to || null;
        
        let text = from && to ? `${fmt(from)}-${fmt(to)}` : from ? `От ${fmt(from)}` : `До ${fmt(to)}`;
        document.getElementById('mileageFilter').innerHTML = 
            `${text} км <span class="filter-clear" onclick="event.stopPropagation();clearMileage()">×</span>`;
        document.getElementById('mileageFilter').classList.add('active');
    }
    
    closeModal('mileageModal');
    render();
}

function applyCity() {
    let c = document.getElementById('citySelect').value;
    filters.city = c;
    
    const btn = document.getElementById('cityFilter');
    if (c) {
        btn.innerHTML = `${c} <span class="filter-clear" onclick="event.stopPropagation();clearCity()">×</span>`;
        btn.classList.add('active');
    } else {
        btn.textContent = 'Город';
        btn.classList.remove('active');
    }
    
    closeModal('cityModal');
    render();
}

function applyReg() {
    let r = document.getElementById('regSelect').value;
    filters.registration = r;
    
    const btn = document.getElementById('regFilter');
    if (r) {
        btn.innerHTML = `${r} <span class="filter-clear" onclick="event.stopPropagation();clearReg()">×</span>`;
        btn.classList.add('active');
    } else {
        btn.textContent = 'Регистрация';
        btn.classList.remove('active');
    }
    
    closeModal('regModal');
    render();
}

function clearBrand() {
    selectedBrands = [];
    filters.brands = [];
    selectedModels = [];
    filters.models = [];
    
    document.getElementById('brandFilter').textContent = 'Марка';
    document.getElementById('brandFilter').classList.remove('active');
    document.getElementById('modelFilter').textContent = 'Модель';
    document.getElementById('modelFilter').classList.remove('active');
    
    render();
}

function clearModel() {
    selectedModels = [];
    filters.models = [];
    
    document.getElementById('modelFilter').textContent = 'Модель';
    document.getElementById('modelFilter').classList.remove('active');
    
    render();
}

function clearPrice() {
    filters.priceFrom = null;
    filters.priceTo = null;
    
    document.getElementById('priceFilter').textContent = 'Цена';
    document.getElementById('priceFilter').classList.remove('active');
    
    render();
}

function clearYear() {
    filters.yearFrom = null;
    filters.yearTo = null;
    
    document.getElementById('yearFilter').textContent = 'Год';
    document.getElementById('yearFilter').classList.remove('active');
    
    render();
}

function clearMileage() {
    filters.mileageFrom = null;
    filters.mileageTo = null;
    
    document.getElementById('mileageFilter').textContent = 'Пробег';
    document.getElementById('mileageFilter').classList.remove('active');
    
    render();
}

function clearCity() {
    filters.city = '';
    
    document.getElementById('cityFilter').textContent = 'Город';
    document.getElementById('cityFilter').classList.remove('active');
    
    render();
}

function clearReg() {
    filters.registration = '';
    
    document.getElementById('regFilter').textContent = 'Регистрация';
    document.getElementById('regFilter').classList.remove('active');
    
    render();
}

function clearDrive() {
    filters.drive = '';
    
    document.getElementById('driveFilter').textContent = 'Привод';
    document.getElementById('driveFilter').classList.remove('active');
    
    render();
}

function applyDrive() {
    const selected = document.querySelector('input[name="drive"]:checked');
    if (selected) {
        filters.drive = selected.value;
        document.getElementById('driveFilter').textContent = `Привод: ${selected.value}`;
        document.getElementById('driveFilter').classList.add('active');
    }
    
    closeModal('driveModal');
    render();
}

function resetFilters() {
    filters = {
        search: '',
        category: 'all',
        brands: [],
        models: [],
        priceFrom: null,
        priceTo: null,
        yearFrom: null,
        yearTo: null,
        mileageFrom: null,
        mileageTo: null,
        city: '',
        registration: '',
        drive: '',  // Добавлено
        currency: '$'
    };
    
    selectedBrand = '';
    selectedModel = '';
    selectedBrands = [];
    selectedModels = [];
    currentSection = 'all';
    
    document.getElementById('searchInput').value = '';
    document.getElementById('brandFilter').textContent = 'Марка';
    document.getElementById('modelFilter').textContent = 'Модель';
    document.getElementById('priceFilter').textContent = 'Цена';
    document.getElementById('yearFilter').textContent = 'Год';
    document.getElementById('mileageFilter').textContent = 'Пробег';
    document.getElementById('cityFilter').textContent = 'Город';
    document.getElementById('regFilter').textContent = 'Регистрация';
    if (document.getElementById('driveFilter')) {
        document.getElementById('driveFilter').textContent = 'Привод';
    }
    
    // Восстанавливаем видимость всех фильтров
    ['yearFilter', 'mileageFilter', 'driveFilter', 'regFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = '';
    });
    
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    
    selectCategory('all');
}

// Получить отфильтрованные машины
function getFilteredCars() {
    return cars.filter(c => {
        if (filters.search && !`${c.brand} ${c.model} ${c.partTitle || ''}`.toLowerCase().includes(filters.search)) return false;
        if (filters.category !== 'all' && c.category !== filters.category) return false;
        if (filters.brands.length > 0 && !filters.brands.includes(c.brand)) return false;
        
        // Улучшенная фильтрация по моделям для поддержки иерархической структуры
        if (filters.models.length > 0) {
            const matchesModel = filters.models.some(filterModel => {
                // Точное совпадение (для старой структуры)
                if (c.model === filterModel) return true;
                // Частичное совпадение - модель начинается с фильтра (для новой структуры)
                // Например, "Accord 2.0" соответствует фильтру "Accord"
                if (c.model.startsWith(filterModel + ' ')) return true;
                return false;
            });
            if (!matchesModel) return false;
        }
        
        if (filters.priceFrom && c.currency === filters.currency && c.price < filters.priceFrom) return false;
        if (filters.priceTo && c.currency === filters.currency && c.price > filters.priceTo) return false;
        if (filters.yearFrom && c.year < filters.yearFrom) return false;
        if (filters.yearTo && c.year > filters.yearTo) return false;
        if (filters.mileageFrom && c.mileage < filters.mileageFrom) return false;
        if (filters.mileageTo && c.mileage > filters.mileageTo) return false;
        if (filters.city && c.city !== filters.city) return false;
        if (filters.registration && c.registration !== filters.registration) return false;
        if (filters.drive && c.drive !== filters.drive) return false;  // Фильтр по приводу
        return true;
    });
}

function render() {
    let filtered = getFilteredCars();
    
    let top = filtered.filter(c => c.isTop);
    let newCars = filtered.filter(c => isNew(c.createdAt)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Все остальные объявления (не топ и не новые)
    let topIds = top.map(c => c.id);
    let newIds = newCars.map(c => c.id);
    let allCars = filtered.filter(c => !topIds.includes(c.id) && !newIds.includes(c.id))
        .sort((a, b) => new Date(getSortDate(b)) - new Date(getSortDate(a)));
    
    document.getElementById('topCount').textContent = `(${top.length})`;
    document.getElementById('newCount').textContent = `(${newCars.length})`;
    document.getElementById('allCount').textContent = `(${allCars.length})`;
    
    const topContainer = document.getElementById('topListings');
    const newContainer = document.getElementById('newListings');
    const allContainer = document.getElementById('allListings');
    
    topContainer.className = 'listings-scroll';
    newContainer.className = 'listings-scroll';
    allContainer.className = 'listings-scroll';
    
    if (top.length > 0) {
        topContainer.innerHTML = top.map(makeCard).join('');
    } else {
        topContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div>Нет топ объявлений</div></div>';
    }
    
    if (newCars.length > 0) {
        newContainer.innerHTML = newCars.map(makeCard).join('');
    } else {
        newContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div>Нет новых объявлений</div></div>';
    }
    
    if (allCars.length > 0) {
        allContainer.innerHTML = allCars.map(makeCard).join('');
    } else {
        allContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div>Нет объявлений</div></div>';
    }
    
    // Обновляем развернутые списки если они открыты
    if (topExpanded) {
        renderExpandedTop();
    }
    
    if (newExpanded) {
        renderExpandedNew();
    }
    
    if (allExpanded) {
        renderExpandedAll();
    }
}

function makeCard(c) {
    currentGalleryIndex[c.id] = 0;
    let imageHtml = '';
    
    if (c.photos && c.photos.length > 0) {
        const dots = c.photos.map((p, i) => `<span class="gallery-dot ${i === 0 ? 'active' : ''}"></span>`).join('');
        imageHtml = `<div class="car-gallery" data-car-id="${c.id}">
            <img src="${c.photos[0]}">
            <div class="category-badge">${categoryNames[c.category]}</div>
            <div class="date-badge">${formatDateShort(c.createdAt)}</div>
            ${c.photos.length > 1 ? `
                <div class="gallery-arrows">
                    <button class="gallery-arrow" onclick="event.stopPropagation();switchPhoto(${c.id},-1)">‹</button>
                    <button class="gallery-arrow" onclick="event.stopPropagation();switchPhoto(${c.id},1)">›</button>
                </div>
                <div class="gallery-dots">${dots}</div>
            ` : ''}
        </div>`;
    } else {
        const emoji = c.category === 'car' ? '🚗' : c.category === 'truck' ? '🚚' : 
                     c.category === 'parts' ? '🔧' : c.category === 'special' ? '🚜' : 
                     c.category === 'moto' ? '🏍' : '🚤';
        imageHtml = `<div class="car-image">
            <div class="category-badge">${categoryNames[c.category]}</div>
            <div class="date-badge">${formatDateShort(c.createdAt)}</div>
            ${emoji}
        </div>`;
    }
    
    return `<div class="car-card" onclick="showDetail(${c.id})">
        ${imageHtml}
        <div class="car-info">
            ${c.category === 'parts' ? `
                <div class="car-title">${c.partTitle || (c.partType + (c.brand ? ' • ' + c.brand : ''))}</div>
                <div class="car-price">${fmt(c.price)} ${c.currency}</div>
                <div class="car-details">
                    <div><span class="detail-icon">🔧</span> ${c.partType}</div>
                    <div><span class="detail-icon">✅</span> Состояние: <strong>${c.condition}</strong></div>
                    <div><span class="detail-icon">📍</span> Город: <strong>${c.city}</strong></div>
                </div>
            ` : `
                <div class="car-title">${c.brand} ${c.model} ${c.year}</div>
                <div class="car-price">${fmt(c.price)} ${c.currency}</div>
                <div class="car-details">
                    <div><span class="detail-icon">📏</span> Пробег: <strong>${fmt(c.mileage)} км</strong></div>
                    <div><span class="detail-icon">🔧</span> Объем: <strong>${c.engine}</strong></div>
                    <div><span class="detail-icon">⛽</span> Топливо: <strong>${c.fuel}</strong></div>
                    ${c.drive ? `<div><span class="detail-icon">🚙</span> Привод: <strong>${c.drive}</strong></div>` : ''}
                    <div><span class="detail-icon">📍</span> Город: <strong>${c.city}</strong></div>
                    <div><span class="detail-icon">🚘</span> Регистрация: <strong>${c.registration}</strong></div>
                </div>
            `}
        </div>
    </div>`;
}

function switchPhoto(carId, dir) {
    const car = cars.find(c => c.id === carId);
    if (!car || !car.photos || car.photos.length <= 1) return;
    
    if (!currentGalleryIndex[carId]) currentGalleryIndex[carId] = 0;
    currentGalleryIndex[carId] += dir;
    
    if (currentGalleryIndex[carId] < 0) currentGalleryIndex[carId] = car.photos.length - 1;
    if (currentGalleryIndex[carId] >= car.photos.length) currentGalleryIndex[carId] = 0;
    
    const cardElement = document.querySelector(`[data-car-id="${carId}"]`);
    if (cardElement) {
        const img = cardElement.querySelector('.car-gallery img');
        const dots = cardElement.querySelectorAll('.gallery-dot');
        if (img) img.src = car.photos[currentGalleryIndex[carId]];
        dots.forEach((dot, i) => dot.classList.toggle('active', i === currentGalleryIndex[carId]));
    }
}

let detailGalleryIndex = 0;
let currentDetailPhotos = []; // Фото текущего детального просмотра
let photoModalIndex = 0; // Индекс фото в модальном окне
function switchDetailPhoto(dir) {
    const gallery = document.querySelector('.detail-gallery');
    if (!gallery) return;
    
    const images = gallery.querySelectorAll('img');
    if (images.length <= 1) return;
    
    images[detailGalleryIndex].style.display = 'none';
    detailGalleryIndex += dir;
    
    if (detailGalleryIndex < 0) detailGalleryIndex = images.length - 1;
    if (detailGalleryIndex >= images.length) detailGalleryIndex = 0;
    
    images[detailGalleryIndex].style.display = 'block';
}

function showDetail(id) {
    let c = cars.find(x => x.id === id);
    if (!c) return;
    
    // Увеличиваем счётчик просмотров
    incrementView(id);
    
    let isFav = favorites.includes(id);
    detailGalleryIndex = 0;
    
    // Сохраняем фото для модального окна
    currentDetailPhotos = c.photos && c.photos.length > 0 ? [...c.photos] : [];
    
    let galleryHtml = '';
    if (c.photos && c.photos.length > 0) {
        const images = c.photos.map((p, i) => 
            `<img src="${p}" onclick="openPhotoModal(${i})" style="display: ${i === 0 ? 'block' : 'none'}; width: 100%; object-fit: cover; cursor: pointer;">`
        ).join('');
        
        galleryHtml = `<div class="detail-gallery">
            ${images}
            ${c.photos.length > 1 ? `
                <div class="detail-gallery-arrows">
                    <button class="detail-gallery-arrow" onclick="switchDetailPhoto(-1)">‹</button>
                    <button class="detail-gallery-arrow" onclick="switchDetailPhoto(1)">›</button>
                </div>
            ` : ''}
        </div>`;
    } else {
        const emoji = c.category === 'car' ? '🚗' : c.category === 'truck' ? '🚚' : 
                     c.category === 'parts' ? '🔧' : c.category === 'special' ? '🚜' : 
                     c.category === 'moto' ? '🏍' : '🚤';
        galleryHtml = `<div class="detail-gallery">${emoji}</div>`;
    }
    
    let seller = getUserById(c.userId);
    // Если продавец не найден в localStorage — берём встроенные данные из объявления
    let sellerPhone = seller?.phone || c.sellerInfo?.phone || '';
    let sellerName = seller?.name || (seller?.firstName + ' ' + (seller?.lastName || '')).trim() 
                     || c.sellerInfo?.name || 'Продавец';
    let sellerUsername = seller?.username || c.sellerInfo?.username || '';
    let sellerCity = seller?.city || c.sellerInfo?.city || '';
    let sellerRating = seller?.rating || c.sellerInfo?.rating || 0;
    
    // Форматируем телефон для ссылки: убираем пробелы, скобки, дефисы
    const phoneForLink = sellerPhone.replace(/[^+\d]/g, '');
    const hasPhone = phoneForLink.length >= 7;
    
    let contactButtons = '';
    
    // Кнопка Telegram — показывается если есть телефон
    if (hasPhone) {
        contactButtons = `<button class="contact-btn telegram-btn" onclick="openTelegramByPhone('${phoneForLink}')">
            <span class="contact-btn-icon">✈️</span>
            <span class="contact-btn-text">Написать в Telegram</span>
        </button>`;
    }
    
    // Кнопка телефон — показываем номер или заглушку
    if (hasPhone) {
        contactButtons += `<button class="contact-btn phone-btn" onclick="showPhone('${sellerPhone}', '${sellerName}')">
            <span class="contact-btn-icon">📞</span>
            <span class="contact-btn-text">Показать телефон</span>
        </button>`;
    } else {
        contactButtons += `<button class="contact-btn phone-btn" onclick="promptSellerNoPhone()">
            <span class="contact-btn-icon">📞</span>
            <span class="contact-btn-text">Телефон не указан</span>
        </button>`;
    }
    
    document.getElementById('detailContent').innerHTML = `
        ${galleryHtml}
        <div class="detail-info">
            <div class="detail-title">${c.category === 'parts' ? (c.partTitle || c.partType + ' • ' + c.brand) : c.brand + ' ' + c.model}</div>
            <div class="detail-price">${fmt(c.price)} ${c.currency}</div>
            <div class="contact-section">${contactButtons}</div>
            <div class="detail-section">
                <div class="detail-section-title">Характеристики</div>
                <div class="detail-specs">
                    <div class="detail-spec-item"><div class="detail-spec-label">Категория</div><div class="detail-spec-value">${categoryNames[c.category]}</div></div>
                    ${c.category === 'parts' ? `
                        ${c.partTitle ? `<div class="detail-spec-item"><div class="detail-spec-label">Заголовок</div><div class="detail-spec-value">${c.partTitle}</div></div>` : ''}
                        <div class="detail-spec-item"><div class="detail-spec-label">Тип детали</div><div class="detail-spec-value">${c.partType}</div></div>
                        <div class="detail-spec-item"><div class="detail-spec-label">Для марки</div><div class="detail-spec-value">${c.brand}</div></div>
                        ${c.model ? `<div class="detail-spec-item"><div class="detail-spec-label">Модель</div><div class="detail-spec-value">${c.model}</div></div>` : ''}
                        <div class="detail-spec-item"><div class="detail-spec-label">Состояние</div><div class="detail-spec-value">${c.condition}</div></div>
                    ` : `
                        <div class="detail-spec-item"><div class="detail-spec-label">Год</div><div class="detail-spec-value">${c.year}</div></div>
                        <div class="detail-spec-item"><div class="detail-spec-label">Пробег</div><div class="detail-spec-value">${fmt(c.mileage)} км</div></div>
                        <div class="detail-spec-item"><div class="detail-spec-label">Двигатель</div><div class="detail-spec-value">${c.engine}</div></div>
                        <div class="detail-spec-item"><div class="detail-spec-label">Коробка</div><div class="detail-spec-value">${c.transmission}</div></div>
                        <div class="detail-spec-item"><div class="detail-spec-label">Топливо</div><div class="detail-spec-value">${c.fuel}</div></div>
                        ${c.drive ? `<div class="detail-spec-item"><div class="detail-spec-label">Привод</div><div class="detail-spec-value">${c.drive}</div></div>` : ''}
                    `}
                    <div class="detail-spec-item"><div class="detail-spec-label">Город</div><div class="detail-spec-value">${c.city}</div></div>
                    ${c.category !== 'parts' ? `<div class="detail-spec-item"><div class="detail-spec-label">Регистрация</div><div class="detail-spec-value">${c.registration || '—'}</div></div>` : ''}
                </div>
            </div>
            <div class="detail-section">
                <div class="detail-section-title">Описание</div>
                <div>${c.description}</div>
            </div>
            <div class="detail-section">
                <div class="detail-section-title">Продавец</div>
                <div class="seller-info">
                    <div class="seller-name">${sellerName}</div>
                    ${sellerUsername ? `<div class="seller-location">@${sellerUsername}</div>` : ''}
                    ${sellerCity ? `<div class="seller-location">📍 ${sellerCity}</div>` : ''}
                    ${sellerRating ? `<div class="seller-rating">⭐ ${Number(sellerRating).toFixed(1)}</div>` : ''}
                </div>
            </div>
            <div class="detail-section">
                <div class="detail-section-title">Дата размещения</div>
                <div>${formatDate(c.createdAt)}</div>
            </div>
        </div>
    `;
    
    // Добавляем секцию с другими объявлениями продавца
    const sellerOtherCars = cars.filter(car => String(car.userId) === String(c.userId) && car.id !== c.id);
    if (sellerOtherCars.length > 0) {
        document.getElementById('detailContent').innerHTML += `
            <div class="detail-section seller-listings-section">
                <div class="detail-section-title">Другие объявления продавца (${sellerOtherCars.length})</div>
                <div class="seller-listings-scroll">
                    ${sellerOtherCars.map(car => {
                        const carEmoji = car.category === 'car' ? '🚗' : car.category === 'truck' ? '🚚' : 
                                        car.category === 'special' ? '🚜' : car.category === 'moto' ? '🏍' : '🚤';
                        const carImage = car.photos && car.photos.length > 0 
                            ? `<div class="seller-car-image" style="background-image: url('${car.photos[0]}');"></div>`
                            : `<div class="seller-car-image seller-car-emoji">${carEmoji}</div>`;
                        
                        return `
                            <div class="seller-car-card" onclick="event.stopPropagation(); showDetail(${car.id})">
                                ${carImage}
                                <div class="seller-car-info">
                                    <div class="seller-car-title">${car.brand} ${car.model}</div>
                                    <div class="seller-car-price">${fmt(car.price)} ${car.currency}</div>
                                    <div class="seller-car-year">${car.year} г.</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    document.getElementById('detailContent').innerHTML += `
        <div style="padding: 0 16px 16px;">
            <button class="detail-contact-btn" onclick="toggleFav(${id})">
                ${isFav ? '❤️ В избранном' : '🤍 В избранное'}
            </button>
        </div>
    `;
    
    // Закрываем профиль если он открыт
    closePage('profilePage');
    
    openPageWithLock('detailPage');
    
    // Обновляем "Мои объявления" если это моё объявление и профиль открыт
    if (c.userId === currentUser?.id && document.getElementById('profilePage').classList.contains('show')) {
        renderMyListings();
    }
}

// Модальное окно для увеличения фото
function openPhotoModal(index) {
    if (currentDetailPhotos.length === 0) return;
    
    photoModalIndex = index;
    
    const modal = document.getElementById('photoModal');
    const img = document.getElementById('photoModalImg');
    const counter = document.getElementById('photoModalCounter');
    
    img.src = currentDetailPhotos[photoModalIndex];
    
    if (currentDetailPhotos.length > 1) {
        counter.textContent = `${photoModalIndex + 1} / ${currentDetailPhotos.length}`;
        counter.style.display = 'block';
        document.getElementById('photoModalPrev').style.display = 'block';
        document.getElementById('photoModalNext').style.display = 'block';
    } else {
        counter.style.display = 'none';
        document.getElementById('photoModalPrev').style.display = 'none';
        document.getElementById('photoModalNext').style.display = 'none';
    }
    
    modal.classList.add('show');
}

function closePhotoModal() {
    document.getElementById('photoModal').classList.remove('show');
}

function switchPhotoModal(direction) {
    if (currentDetailPhotos.length <= 1) return;
    
    photoModalIndex += direction;
    
    if (photoModalIndex < 0) {
        photoModalIndex = currentDetailPhotos.length - 1;
    }
    if (photoModalIndex >= currentDetailPhotos.length) {
        photoModalIndex = 0;
    }
    
    const img = document.getElementById('photoModalImg');
    const counter = document.getElementById('photoModalCounter');
    
    img.src = currentDetailPhotos[photoModalIndex];
    counter.textContent = `${photoModalIndex + 1} / ${currentDetailPhotos.length}`;
}

function openTelegramByPhone(phone) {
    if (!phone) { tg.showAlert('Телефон продавца не указан'); return; }
    // t.me/+37377711111 открывает чат с человеком по номеру
    const url = `https://t.me/${phone}`;
    if (tg.openTelegramLink) {
        tg.openTelegramLink(url);
    } else {
        window.open(url, '_blank');
    }
}

function promptSellerNoPhone() {
    tg.showAlert('Продавец не указал номер телефона');
}

function showPhone(phone, sellerName) {
    tg.showPopup({
        title: sellerName,
        message: `Телефон:\n${phone}`,
        buttons: [{id: 'close', type: 'close', text: 'Закрыть'}]
    });
}

function getUserById(userId) {
    if (!userId) return null;
    let users = DB.getUsers();
    return users[userId] || null;
}

function toggleFav(id) {
    let idx = favorites.indexOf(id);
    if (idx > -1) favorites.splice(idx, 1);
    else favorites.push(id);
    
    DB.saveFavorites(favorites);
    
    // ═══ БАГ-ФИКС: синхронизируем с Firebase ═══
    if (currentUser) {
        currentUser.favorites = [...favorites];
        saveUser();
    }
    // ═══════════════════════════════════════════
    
    updateFavBadge();
    
    // Обновляем страницу избранного если она открыта
    const favPage = document.getElementById('favoritesPage');
    if (favPage && favPage.classList.contains('show')) {
        renderFavorites();
    }
    
    showDetail(id);
    tg.showAlert(idx > -1 ? 'Удалено из избранного' : 'Добавлено в избранное');
}

function removeFromFav(id) {
    let idx = favorites.indexOf(id);
    if (idx > -1) {
        favorites.splice(idx, 1);
        DB.saveFavorites(favorites);
        
        // ═══ БАГ-ФИКС: синхронизируем с Firebase ═══
        if (currentUser) {
            currentUser.favorites = [...favorites];
            saveUser();
        }
        // ═══════════════════════════════════════════
        
        updateFavBadge();
        renderFavorites();
    }
}

function updateFavBadge() {
    const badge = document.getElementById('favNavBadge');
    if (!badge) return;
    if (favorites.length > 0) {
        badge.textContent = favorites.length;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function openFavorites() {
    renderFavorites();
    openPageWithLock('favoritesPage');
}

function openDetailFromFav(id) {
    showDetail(id);
}

function renderFavorites() {
    const favCars = cars.filter(c => favorites.includes(c.id));
    const subtitle = document.getElementById('favPageSubtitle');
    if (subtitle) {
        subtitle.textContent = favCars.length > 0
            ? `${favCars.length} ${favCars.length === 1 ? 'объявление' : favCars.length < 5 ? 'объявления' : 'объявлений'}`
            : 'Нет сохранённых';
    }

    const container = document.getElementById('favoritesContent');
    if (!container) return;

    if (favCars.length === 0) {
        container.innerHTML = `
            <div class="fav-empty">
                <div class="fav-empty-heart">🤍</div>
                <div class="fav-empty-title">Список пуст</div>
                <div class="fav-empty-text">Нажмите ❤️ в объявлении,<br>чтобы добавить в избранное</div>
                <button class="fav-empty-btn" onclick="closePage('favoritesPage')">Смотреть объявления</button>
            </div>`;
        return;
    }

    container.innerHTML = favCars.map(c => {
        const emoji = c.category === 'car' ? '🚗' : c.category === 'truck' ? '🚚' :
                      c.category === 'special' ? '🚜' : c.category === 'moto' ? '🏍' :
                      c.category === 'parts' ? '🔧' : '🚤';
        const thumbHtml = c.photos && c.photos.length > 0
            ? `<div class="fav-card-thumb" style="background-image:url('${c.photos[0]}');background-size:cover;background-position:center;"></div>`
            : `<div class="fav-card-thumb fav-card-thumb-emoji">${emoji}</div>`;
        const isTop = c.isTop ? `<span class="fav-top-badge">🔥 ТОП</span>` : '';

        return `
            <div class="fav-card" onclick="openDetailFromFav(${c.id})">
                ${thumbHtml}
                <div class="fav-card-body">
                    <div class="fav-card-header">
                        <div class="fav-card-title">${c.category === 'parts' ? (c.partTitle || c.partType || c.brand) : `${c.brand} ${c.model} <span class="fav-card-year">${c.year}</span>`}</div>
                        ${isTop}
                    </div>
                    <div class="fav-card-price">${fmt(c.price)} ${c.currency}</div>
                    <div class="fav-card-meta">
                        ${c.category === 'parts' ? `
                            <span>🔧 ${c.partType || '—'}</span>
                            <span>✅ ${c.condition || '—'}</span>
                        ` : `
                            <span>📏 ${fmt(c.mileage)} км</span>
                            <span>📍 ${c.city}</span>
                        `}
                    </div>
                    ${c.category !== 'parts' ? `
                    <div class="fav-card-meta">
                        <span>⛽ ${c.fuel}</span>
                        <span>⚙️ ${c.transmission}</span>
                    </div>` : `
                    <div class="fav-card-meta">
                        <span>📍 ${c.city}</span>
                    </div>`}
                </div>
                <button class="fav-remove-btn" onclick="event.stopPropagation(); removeFromFav(${c.id})" title="Удалить из избранного">❤️</button>
            </div>`;
    }).join('');
}

// УДАЛЕНИЕ ОБЪЯВЛЕНИЯ
function deleteListing(carId) {
    tg.showPopup({
        title: 'Удаление объявления',
        message: 'Вы уверены, что хотите удалить это объявление?',
        buttons: [
            {id: 'cancel', type: 'cancel', text: 'Отмена'},
            {id: 'delete', type: 'destructive', text: 'Удалить'}
        ]
    }, function(buttonId) {
        if (buttonId === 'delete') {
            // Удаляем из памяти (сохраняем все чужие объявления)
            cars = cars.filter(c => c.id !== carId);
            // Удаляем из localStorage (только метаданные)
            DB.saveCars(cars);
            // Удаляем из Firebase
            deleteCarFromFirebase(carId);
            
            // Удаляем из списка пользователя (id может быть числом или строкой)
            if (currentUser.listings) {
                currentUser.listings = currentUser.listings.filter(id => String(id) !== String(carId));
                saveUser();
            }
            
            tg.showAlert('Объявление удалено', () => {});
            renderMyListings();
            render();
        }
    });
}

// РЕДАКТИРОВАНИЕ ОБЪЯВЛЕНИЯ
function editListing(carId) {
    const car = cars.find(c => c.id === carId);
    if (!car) return;
    
    editingCarId = carId;
    
    // Закрываем профиль, открываем форму
    closePage('profilePage');
    document.getElementById('addPage').classList.add('show');
    
    // Заполняем форму данными
    document.getElementById('category').value = car.category;
    updateFormBrandOptions();
    
    formSelectedBrand = car.brand;
    formSelectedModel = car.model;
    
    document.getElementById('formBrand').value = car.brand;
    document.getElementById('formModel').value = car.model;
    document.getElementById('formBrandInput').value = car.brand;
    document.getElementById('formModelInput').value = car.model;
    
    document.getElementById('year').value = car.year;
    document.getElementById('price').value = car.price;
    document.getElementById('currency').value = car.currency;
    document.getElementById('mileage').value = car.mileage;
    document.getElementById('engine').value = car.engine;
    document.getElementById('transmission').value = car.transmission;
    document.getElementById('fuel').value = car.fuel;
    if (document.getElementById('drive')) {
        document.getElementById('drive').value = car.drive || '';  // Добавлено поле привода
    }
    document.getElementById('city').value = car.city;
    document.getElementById('registration').value = car.registration;
    document.getElementById('description').value = car.description;
    
    // Подставляем телефон из sellerInfo (или профиля как запасной)
    const listingPhoneEl = document.getElementById('listingPhone');
    if (listingPhoneEl) {
        listingPhoneEl.value = car.sellerInfo?.phone || currentUser.phone || '';
    }
    
    // Фото и видео
    uploadedPhotos = car.photos ? [...car.photos] : [];
    uploadedVideo = car.video || null;
    
    // Показываем превью фото
    renderPhotoPreview();
    
    if (uploadedVideo) {
        document.getElementById('videoPreview').innerHTML = 
            `<div class="file-preview-item"><video src="${uploadedVideo}"></video><button type="button" class="file-preview-remove" onclick="removeVideo()">×</button></div>`;
    }
    
    // Меняем текст кнопки
    const submitBtn = document.querySelector('#addForm button[type="submit"]');
    submitBtn.textContent = 'Сохранить изменения';
}

function navigate(page) {
    document.querySelectorAll('.nav-button').forEach(b => b.classList.remove('active'));
    try { event?.target?.closest('.nav-button')?.classList.add('active'); } catch(e) {}

    if (page === 'main') {
        closePage('addPage');
        closePage('detailPage');
        closePage('profilePage');
        closePage('favoritesPage');
        currentSection = 'all';
        render();
    } else if (page === 'add') {
        closePage('profilePage');
        closePage('favoritesPage');
        editingCarId = null;
        document.querySelector('#addForm button[type="submit"]').textContent = 'Опубликовать';
        const phoneEl = document.getElementById('listingPhone');
        if (phoneEl && !phoneEl.value && currentUser?.phone) {
            phoneEl.value = currentUser.phone;
        }
        document.getElementById('addPage').classList.add('show');
    } else if (page === 'favorites') {
        closePage('addPage');
        closePage('detailPage');
        closePage('profilePage');
        openFavorites();
    } else if (page === 'profile') {
        closePage('addPage');
        closePage('detailPage');
        closePage('favoritesPage');
        openProfile();
    } else {
        tg.showAlert('В разработке');
    }
}

function closePage(id) {
    document.getElementById(id).classList.remove('show');
}

function openPageWithLock(id) {
    const el = document.getElementById(id);
    el.scrollTop = 0;
    el.classList.add('show');
}

function openDetailWithView(carId) {
    incrementView(carId);
    showDetail(carId);
}

// Рендер превью фото с кнопками "главное" и "удалить"
function renderPhotoPreview() {
    const preview = document.getElementById('photoPreview');
    preview.innerHTML = '';
    uploadedPhotos.forEach((photo, i) => {
        const div = document.createElement('div');
        div.className = 'file-preview-item' + (i === 0 ? ' photo-main' : '');
        div.innerHTML = `
            <img src="${photo}">
            <button type="button" class="file-preview-remove" onclick="removePhoto(${i})">×</button>
            <button type="button" class="photo-star-btn" onclick="setMainPhoto(${i})" title="Сделать главным">
                ${i === 0 ? '⭐' : '☆'}
            </button>
        `;
        preview.appendChild(div);
    });
}

// Сделать фото главным (переместить на позицию 0)
function setMainPhoto(idx) {
    if (idx === 0) return;
    const main = uploadedPhotos.splice(idx, 1)[0];
    uploadedPhotos.unshift(main);
    renderPhotoPreview();
}

function handlePhotos(e) {
    if (!e.target.files || e.target.files.length === 0) return;
    const newFiles = Array.from(e.target.files);
    const canAdd = 6 - uploadedPhotos.length;
    if (canAdd <= 0) { tg.showAlert('Максимум 6 фото'); return; }
    const files = newFiles.slice(0, canAdd);

    // Читаем файлы строго последовательно через рекурсию (iOS-safe)
    function readNext(i) {
        if (i >= files.length) {
            renderPhotoPreview();
            return;
        }
        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                // Сжимаем до 1000px / качество 0.72 — оптимально для Firebase
                const compressed = await compressImage(event.target.result, 1000, 0.72);
                uploadedPhotos.push(compressed);
            } catch(err) {
                uploadedPhotos.push(event.target.result);
            }
            readNext(i + 1);
        };
        reader.onerror = function() {
            console.warn('Ошибка чтения:', files[i].name);
            readNext(i + 1);
        };
        reader.readAsDataURL(files[i]);
    }
    readNext(0);
}

function handleVideo(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        uploadedVideo = event.target.result;
        document.getElementById('videoPreview').innerHTML = 
            `<div class="file-preview-item"><video src="${event.target.result}"></video><button type="button" class="file-preview-remove" onclick="removeVideo()">×</button></div>`;
    };
    reader.readAsDataURL(file);
}

function removePhoto(idx) {
    uploadedPhotos.splice(idx, 1);
    document.getElementById('photos').value = '';
    renderPhotoPreview();
}

function removeVideo() {
    uploadedVideo = null;
    document.getElementById('video').value = '';
    document.getElementById('videoPreview').innerHTML = '';
}

async function handleSubmit(e) {
    e.preventDefault();

    // Блокируем кнопку немедленно — защита от двойного нажатия
    const submitBtn = document.querySelector('#addForm button[type="submit"]');
    if (submitBtn && submitBtn.dataset.submitting === 'true') {
        return; // уже отправляется — игнорируем
    }
    if (submitBtn) {
        submitBtn.dataset.submitting = 'true';
        submitBtn.textContent = '⏳ Публикация...';
        submitBtn.disabled = true;
    }

    function unblockSubmit() {
        if (submitBtn) {
            submitBtn.dataset.submitting = 'false';
            submitBtn.textContent = 'Опубликовать';
            submitBtn.disabled = false;
        }
    }

    if (!currentUser) {
        tg.showAlert('Ошибка: пользователь не авторизован');
        unblockSubmit();
        return;
    }
    
    const category = document.getElementById('category').value;
    
    if (!category) {
        tg.showAlert('Выберите категорию');
        unblockSubmit();
        return;
    }
    
    // Валидация марки
    const brandValue = document.getElementById('formBrand').value;
    const modelValue = document.getElementById('formModel').value;
    
    if (!brandValue || !brandValue.trim()) {
        tg.showAlert('Пожалуйста, выберите марку');
        unblockSubmit();
        return;
    }
    
    // Для запчастей модель опциональна, для остальных — обязательна
    if (category !== 'parts' && (!modelValue || !modelValue.trim())) {
        tg.showAlert('Пожалуйста, выберите модель');
        unblockSubmit();
        return;
    }
    
    // Валидация телефона
    const phoneInput = document.getElementById('listingPhone');
    const phoneValue = phoneInput ? phoneInput.value.trim() : '';
    if (!phoneValue) {
        tg.showAlert('Укажите номер телефона — покупатели смогут написать вам в Telegram');
        phoneInput && phoneInput.focus();
        unblockSubmit();
        return;
    }
    
    // Валидация объема двигателя (только для не-запчастей)
    const engineEl = document.getElementById('engine');
    if (category !== 'parts' && engineEl && engineEl.value.trim()) {
        const engineValue = engineEl.value.trim();
        if (!/^\d+(\.\d+)?\s*(л)?$/i.test(engineValue)) {
            tg.showAlert('Объем двигателя: укажите только цифры (например: 2.5 или 2.5 л)');
            engineEl.focus();
            unblockSubmit(); // ← БАГ ИСПРАВЛЕН: кнопка разблокируется при ошибке
            return;
        }
    }
    
    // Валидация для запчастей
    if (category === 'parts') {
        const partType = document.getElementById('partType')?.value;
        const condition = document.getElementById('condition')?.value;
        const partTitle = document.getElementById('partTitle')?.value?.trim();
        if (!partType) {
            tg.showAlert('Укажите тип детали');
            unblockSubmit();
            return;
        }
        if (!condition) {
            tg.showAlert('Укажите состояние');
            unblockSubmit();
            return;
        }
        if (!partTitle) {
            tg.showAlert('Укажите заголовок объявления');
            unblockSubmit();
            return;
        }
    }
    
    // ═══════════════════════════════════════════════════════════
    // ЗАГРУЗКА ФОТО В CLOUDINARY
    // ═══════════════════════════════════════════════════════════
    let cloudinaryPhotos = [];
    
    if (uploadedPhotos.length > 0) {
        try {
            submitBtn.textContent = '📤 Загрузка фото...';
            
            cloudinaryPhotos = await uploadPhotosToCloudinary(uploadedPhotos, (current, total) => {
                submitBtn.textContent = `📤 Фото ${current}/${total}...`;
            });
            
            if (cloudinaryPhotos.length === 0 && uploadedPhotos.length > 0) {
                throw new Error('Не удалось загрузить фото');
            }
            
            submitBtn.textContent = '⏳ Сохранение...';
        } catch (e) {
            console.error('Cloudinary upload failed:', e);
            tg.showAlert('Ошибка загрузки фото. Проверьте интернет и попробуйте ещё раз.');
            unblockSubmit();
            return;
        }
    }
    // ═══════════════════════════════════════════════════════════
    
    const carData = {
        category,
        brand: brandValue,
        model: modelValue || '',
        price: parseInt(document.getElementById('price').value),
        currency: document.getElementById('currency').value,
        city: document.getElementById('city').value,
        // Регистрация только для транспорта, не для запчастей
        ...(category !== 'parts' ? { registration: document.getElementById('registration').value } : {}),
        description: document.getElementById('description').value,
        photos: cloudinaryPhotos, // ← URL из Cloudinary вместо base64
        video: uploadedVideo,
        userId: currentUser.id,
        // Для запчастей добавляем partType, condition и заголовок
        ...(category === 'parts' ? {
            partType: document.getElementById('partType').value,
            condition: document.getElementById('condition').value,
            partTitle: document.getElementById('partTitle').value.trim()
        } : {
            // Для транспорта добавляем специфичные поля
            year: parseInt(document.getElementById('year').value),
            mileage: parseInt(document.getElementById('mileage').value),
            engine: document.getElementById('engine').value,
            transmission: document.getElementById('transmission').value,
            fuel: document.getElementById('fuel').value,
            drive: document.getElementById('drive')?.value || null
        }),
        // Встраиваем контакты продавца прямо в объявление
        // чтобы другие пользователи видели их без синхронизации users
        sellerInfo: {
            name: currentUser.name || (currentUser.firstName + ' ' + currentUser.lastName).trim() || 'Продавец',
            username: currentUser.username || '',
            telegramId: currentUser.telegramId || '',
            // Телефон из формы — приоритет, потом из профиля
            phone: (document.getElementById('listingPhone')?.value || '').trim() || currentUser.phone || '',
            city: currentUser.city || '',
            rating: Number(currentUser.rating || 0)
        }
    };
    
    try {
        if (editingCarId) {
            // РЕДАКТИРОВАНИЕ — обновляем в памяти и Firebase
            carData.id = editingCarId;
            const editIdx = cars.findIndex(c => c.id === editingCarId);
            if (editIdx !== -1) cars[editIdx] = { ...cars[editIdx], ...carData };
            DB.saveCars(cars);
            pushCarToFirebase(carData);
            editingCarId = null;
            unblockSubmit();
            tg.showAlert('Изменения сохранены!');
        } else {
            // НОВОЕ ОБЪЯВЛЕНИЕ
            carData.id = Date.now() * 1000 + Math.floor(Math.random() * 1000);
            carData.isTop = false;
            carData.createdAt = new Date().toISOString();

            cars.push(carData);
            DB.saveCars(cars);
            pushCarToFirebase(carData);

            if (!currentUser.listings) currentUser.listings = [];
            currentUser.listings.push(carData.id);
            saveUser();

            awardPoints('LISTING_PUBLISHED');
            if (uploadedPhotos.length >= 6) awardPoints('ALL_PHOTOS');
            if (uploadedVideo) awardPoints('VIDEO_ADDED');

            let msg = 'Объявление опубликовано!\n+10 очков рейтинга';
            if (uploadedPhotos.length >= 6) msg += '\n+10 за все фото';
            if (uploadedVideo) msg += '\n+10 за видео';

            unblockSubmit();
            tg.showAlert(msg);
        }
    } catch(err) {
        console.error('handleSubmit error:', err);
        unblockSubmit();
        tg.showAlert('Ошибка публикации: ' + err.message);
        return;
    }

    // Очистка формы
    document.getElementById('addForm').reset();
    uploadedPhotos = [];
    uploadedVideo = null;
    formSelectedBrand = '';
    formSelectedModel = '';
    formSelectedVariant = '';
    formSelectedPartType = '';
    document.getElementById('photoPreview').innerHTML = '';
    document.getElementById('videoPreview').innerHTML = '';
    document.getElementById('formBrandInput').value = '';
    document.getElementById('formModelInput').value = '';
    const partTitleEl = document.getElementById('partTitle');
    if (partTitleEl) partTitleEl.value = '';
    // Сбрасываем телефон (reset не трогает его если он был заполнен вручную)
    const phoneElClear = document.getElementById('listingPhone');
    if (phoneElClear) phoneElClear.value = '';
    document.querySelector('#addForm button[type="submit"]').textContent = 'Опубликовать';
    
    // Закрываем форму
    closePage('addPage');
    
    // Переключаемся на главную
    document.querySelectorAll('.nav-button').forEach(b => b.classList.remove('active'));
    const mainBtn = document.querySelector('.nav-button[onclick*="main"]');
    if (mainBtn) {
        mainBtn.classList.add('active');
    }
    
    closePage('profilePage');
    closePage('detailPage');
    
    // Вызываем render
    currentSection = 'all';
    topExpanded = false;
    newExpanded = false;
    allExpanded = false;
    render();
}

// Инициализация тестовых пользователей для объявлений
function initTestUsers() {
    let users = DB.getUsers();
    
    const testUsers = [
        {id: 'user_1', username: 'ivan_petrov', firstName: 'Иван', lastName: 'Петров', phone: '+373 777 11 111', city: 'Тирасполь'},
        {id: 'user_2', username: 'maria_sidorova', firstName: 'Мария', lastName: 'Сидорова', phone: '+373 777 22 222', city: 'Кишинёв'},
        {id: 'user_3', username: 'alex_ivanov', firstName: 'Алексей', lastName: 'Иванов', phone: '+373 777 33 333', city: 'Бельцы'},
        {id: 'user_4', username: 'elena_smirnova', firstName: 'Елена', lastName: 'Смирнова', phone: '+373 777 44 444', city: 'Рыбница'},
        {id: 'user_5', username: 'dmitry_kozlov', firstName: 'Дмитрий', lastName: 'Козлов', phone: '+373 777 55 555', city: 'Тирасполь'}
    ];
    
    testUsers.forEach(u => {
        // Всегда перезаписываем тестовых пользователей (чтобы исправить старый строковый рейтинг)
        const existing = users[u.id];
        users[u.id] = {
            id: u.id,
            telegramId: u.id,
            username: u.username,
            firstName: u.firstName,
            lastName: u.lastName,
            name: `${u.firstName} ${u.lastName}`,
            phone: u.phone,
            email: '',
            city: u.city,
            balance: 0,
            listings: existing?.listings || [],
            views: existing?.views || Math.floor(Math.random() * 500),
            rating: existing?.rating ? parseFloat(existing.rating) : parseFloat((Math.random() * 2 + 3).toFixed(1)),
            registeredAt: existing?.registeredAt || new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
        };
    });
    
    DB.saveUsers(users);
}

async function initUser() {
    // Инициализируем тестовых пользователей для объявлений
    initTestUsers();
    
    const tgUser = tg.initDataUnsafe?.user;
    
    if (tgUser) {
        const userId = tgUser.id;
        let users = DB.getUsers();
        
        if (!users[userId]) {
            users[userId] = {
                id: userId,
                telegramId: userId,
                username: tgUser.username || '',
                firstName: tgUser.first_name || '',
                lastName: tgUser.last_name || '',
                name: '',
                phone: '',
                email: '',
                city: '',
                balance: 0,
                transactions: [],
                listings: [],
                views: 0,
                rating: 0.0,
                subscriptions: { autoBoost: { active: false, carIds: [], cars: {} } },
                registeredAt: new Date().toISOString()
            };
            DB.saveUsers(users);
        }
        
        currentUser = users[userId];
        // Гарантируем subscriptions для старых пользователей без этого поля
        if (!currentUser.subscriptions) {
            currentUser.subscriptions = { autoBoost: { active: false, carIds: [], cars: {} } };
        }
        // Ждём Firebase — данные актуальнее (баланс, подписки)
        try {
            currentUser = await syncUserFromFirebase(currentUser);
        } catch(e) {
            console.warn('Firebase user sync failed, using local:', e.message);
        }
    } else {
        const testId = 'test_user';
        let users = DB.getUsers();
        
        if (!users[testId]) {
            users[testId] = {
                id: testId,
                telegramId: testId,
                username: 'testuser',
                firstName: 'Тестовый',
                lastName: 'Пользователь',
                name: '',
                phone: '+373 XXX XX XXX',
                email: '',
                city: '',
                balance: 0,
                transactions: [],
                listings: [],
                views: 0,
                rating: 0.0,
                subscriptions: { autoBoost: { active: false, carIds: [], cars: {} } },
                registeredAt: new Date().toISOString()
            };
            DB.saveUsers(users);
        }
        
        currentUser = users[testId];
        // Гарантируем subscriptions для старых пользователей без этого поля
        if (!currentUser.subscriptions) {
            currentUser.subscriptions = { autoBoost: { active: false, carIds: [], cars: {} } };
        }
        // Ждём Firebase
        try {
            currentUser = await syncUserFromFirebase(currentUser);
        } catch(e) {
            console.warn('Firebase user sync failed, using local:', e.message);
        }
    }
}

// ╔══════════════════════════════════════════╗
// ║  СИСТЕМА РЕЙТИНГА                        ║
// ╚══════════════════════════════════════════╝



const RATING_POINTS = {
    LISTING_PUBLISHED:  10,  // опубликовал объявление
    LISTING_50_VIEWS:   15,  // объявление получило 50 просмотров
    LISTING_2_WEEKS:    15,  // объявление активно >2 недель
    BOOST_FREE:          5,  // бесплатное поднятие
    BOOST_PAID:         15,  // платное поднятие
    PROFILE_COMPLETE:   30,  // заполнил имя+телефон+город+фото
    ALL_PHOTOS:         10,  // добавил 6 фото при публикации
    VIDEO_ADDED:        10,  // добавил видео при публикации
    STREAK_7_DAYS:      25,  // открыл приложение 7 дней подряд
    BALANCE_TOPUP:      10,  // пополнил баланс
};

// Начислить очки рейтинга
function awardPoints(reason, customPoints = null) {
    if (!currentUser) return;
    if (!currentUser.ratingPoints) currentUser.ratingPoints = 0;
    if (!currentUser.ratingLog) currentUser.ratingLog = [];

    const pts = customPoints !== null ? customPoints : (RATING_POINTS[reason] || 0);
    if (pts <= 0) return;

    currentUser.ratingPoints += pts;

    // Лог последних 20 начислений
    currentUser.ratingLog.unshift({
        reason,
        pts,
        total: currentUser.ratingPoints,
        date: new Date().toISOString()
    });
    if (currentUser.ratingLog.length > 20) currentUser.ratingLog.length = 20;

    // Сохраняем локально сразу, в Firebase — батчем через debounce
    DB.saveUser(currentUser);
    _debouncePushUser();

}

// ─── Проверка и начисление за заполненный профиль ──────────────
function checkProfileComplete() {
    if (!currentUser) return;
    if (currentUser.ratingFlags?.profileComplete) return; // уже начислено

    const hasName  = !!(currentUser.name?.trim());
    const hasPhone = !!(currentUser.phone?.trim());
    const hasCity  = !!(currentUser.city?.trim());
    const hasPhoto = !!(currentUser.photo);

    if (hasName && hasPhone && hasCity && hasPhoto) {
        if (!currentUser.ratingFlags) currentUser.ratingFlags = {};
        currentUser.ratingFlags.profileComplete = true;
        awardPoints('PROFILE_COMPLETE');
        tg.showAlert('✅ Профиль заполнен!\n+30 очков рейтинга');
    }
}

// ─── Streak: ежедневный вход ────────────────────────────────────
function checkDailyStreak() {
    if (!currentUser) return;
    const today = getTodayStr();
    const streak = currentUser.streak || { days: 0, lastDate: '', counted: false };

    if (streak.lastDate === today) return; // уже отмечен сегодня

    const yesterday = (() => {
        const d = new Date(); d.setDate(d.getDate() - 1);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })();

    if (streak.lastDate === yesterday) {
        streak.days++;
    } else {
        streak.days = 1; // сброс серии
    }
    streak.lastDate = today;
    streak.counted = false;
    currentUser.streak = streak;

    // Начислить за 7-дневную серию
    if (streak.days > 0 && streak.days % 7 === 0 && !streak.counted) {
        streak.counted = true;
        currentUser.streak = streak;
        DB.saveUser(currentUser); // сохраняем counted=true ДО debounce awardPoints
        awardPoints('STREAK_7_DAYS');
    } else {
        saveUser();
    }
}

// ─── Проверка 50 просмотров у объявлений пользователя ───────────
function checkListingViewsMilestones() {
    if (!currentUser) return;
    const myCars = cars.filter(c => String(c.userId) === String(currentUser.id));
    if (!currentUser.ratingFlags) currentUser.ratingFlags = {};

    myCars.forEach(car => {
        const views = getViews(car.id);
        const flagKey = `views50_${car.id}`;
        if (views.total >= 50 && !currentUser.ratingFlags[flagKey]) {
            currentUser.ratingFlags[flagKey] = true;
            awardPoints('LISTING_50_VIEWS');
        }
    });
}

// ─── Проверка объявлений активных >2 недель ─────────────────────
function checkListingAgeBonus() {
    if (!currentUser) return;
    const myCars = cars.filter(c => String(c.userId) === String(currentUser.id));
    if (!currentUser.ratingFlags) currentUser.ratingFlags = {};
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

    myCars.forEach(car => {
        const flagKey = `age2w_${car.id}`;
        if (!currentUser.ratingFlags[flagKey] && new Date(car.createdAt).getTime() <= twoWeeksAgo) {
            currentUser.ratingFlags[flagKey] = true;
            awardPoints('LISTING_2_WEEKS');
        }
    });
}

// Debounce: отправляем пользователя в Firebase не чаще раза в 2 секунды
// Это предотвращает зависание когда awardPoints вызывается 3 раза подряд
let _pushUserTimer = null;
function _debouncePushUser() {
    if (_pushUserTimer) clearTimeout(_pushUserTimer);
    _pushUserTimer = setTimeout(() => {
        pushUserToFirebase(currentUser);
        _pushUserTimer = null;
    }, 2000);
}

function saveUser() {
    if (!currentUser) return;
    // Сохраняем favorites прямо в currentUser чтобы они попали в Firebase
    currentUser.favorites = favorites || [];
    DB.saveUser(currentUser);
    pushUserToFirebase(currentUser); // синхронизируем с Firebase
}

// --- Фото профиля ---
function openProfilePhotoInput() {
    document.getElementById('profilePhotoInput').click();
}

async function handleProfilePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(ev) {
        const compressed = await compressImage(ev.target.result, 300, 0.80);
        currentUser.photo = compressed;
        saveUser();
        renderProfileAvatar();
        // Проверяем заполненность профиля после добавления фото
        checkProfileComplete();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
}


// ─── Работа с балансом и транзакциями ────────────────────────
function addTransaction(type, amount, details = {}) {
    if (!currentUser.transactions) currentUser.transactions = [];
    currentUser.transactions.unshift({
        date: new Date().toISOString(),
        type,
        amount,
        ...details
    });
    if (currentUser.transactions.length > 100) {
        currentUser.transactions = currentUser.transactions.slice(0, 100);
    }
    saveUser(); // localStorage + Firebase
}

function hasBalance(amount) {
    return (currentUser.balance || 0) >= amount;
}

function deductBalance(amount, type, details = {}) {
    if (!hasBalance(amount)) {
        tg.showAlert('Недостаточно средств на балансе');
        return false;
    }
    currentUser.balance = (currentUser.balance || 0) - amount;
    addTransaction(type, -amount, details);
    updateBalanceDisplay();
    return true;
}

function addBalance(amount, method = 'manual') {
    currentUser.balance = (currentUser.balance || 0) + amount;
    addTransaction('deposit', amount, {method});
    updateBalanceDisplay();
    awardPoints('BALANCE_TOPUP');
}

function updateBalanceDisplay() {
    const el = document.getElementById('profileBalance');
    if (el) el.textContent = currentUser.balance;
}

function togglePremium() {
    const content = document.getElementById('premiumContent');
    const isOpen = content.style.display !== 'none';
    content.style.display = isOpen ? 'none' : 'block';
}

function openTopUp() {
    // Используем нативный confirm как fallback если tg.showPopup не сработал
    try {
        tg.showPopup({
            title: '💳 Пополнение баланса',
            message: `Текущий баланс: ${currentUser.balance || 0} лей\n\nРеальная оплата в разработке.\nДля теста нажмите "Добавить 100 лей".`,
            buttons: [
                {id: 'add100', type: 'default', text: '+ 100 лей (тест)'},
                {id: 'add500', type: 'default', text: '+ 500 лей (тест)'},
                {id: 'cancel', type: 'cancel', text: 'Отмена'}
            ]
        }, (buttonId) => {
            if (buttonId === 'add100') {
                addBalance(100, 'test');
                tg.showAlert(`✅ Баланс пополнен!\nНовый баланс: ${currentUser.balance} лей`);
            } else if (buttonId === 'add500') {
                addBalance(500, 'test');
                tg.showAlert(`✅ Баланс пополнен!\nНовый баланс: ${currentUser.balance} лей`);
            }
        });
    } catch(e) {
        // Fallback если tg.showPopup недоступен
        const amount = 100;
        addBalance(amount, 'test');
        alert(`✅ Тест: добавлено ${amount} лей\nНовый баланс: ${currentUser.balance} лей`);
    }
}


// ─── Поднятие объявлений ──────────────────────────────────────

// Интервал бесплатного поднятия в зависимости от уровня и активации
function getFreeBoostIntervalHours() {
    // 12ч если бонус куплен и не истёк, иначе 24ч
    const boost12Active = currentUser.boost12hActivated &&
                          new Date(currentUser.boost12hActivated) > new Date();
    return boost12Active ? 12 : 24;
}

function canFreeBoost() {
    if (!currentUser.freeBoostAvailableAt) return true;
    return new Date() >= new Date(currentUser.freeBoostAvailableAt);
}

function getNextFreeBoostTime() {
    if (!currentUser.freeBoostAvailableAt) return null;
    const available = new Date(currentUser.freeBoostAvailableAt);
    if (new Date() >= available) return null;
    const diff = available - new Date();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}ч ${minutes}м`;
}

function boostListing(carId, paid = false) {
    // ═══ БАГ-ФИКС: приводим к числу для корректного сравнения ═══
    carId = Number(carId);
    // ═══════════════════════════════════════════════════════════
    
    const car = cars.find(c => c.id === carId);
    if (!car) return;
    
    // Проверяем подписку автоподнятия
    const autoBoostCarIds = normalizeFirebaseArray(currentUser.subscriptions?.autoBoost?.carIds).map(Number);
    const hasAutoBoost = currentUser.subscriptions?.autoBoost?.active && 
                        autoBoostCarIds.includes(carId);
    
    if (hasAutoBoost) {
        tg.showAlert('Это объявление уже поднимается автоматически 5 раз в день');
        return;
    }
    
    const isFree = canFreeBoost();
    
    if (paid || !isFree) {
        // Платное поднятие
        const cost = 15;
        if (!hasBalance(cost)) {
            tg.showPopup({
                title: 'Недостаточно средств',
                message: `Стоимость поднятия: ${cost} лей\nВаш баланс: ${currentUser.balance} лей\n\nПополнить баланс?`,
                buttons: [
                    {id: 'topup', type: 'default', text: 'Пополнить'},
                    {id: 'cancel', type: 'cancel', text: 'Отмена'}
                ]
            }, (btnId) => {
                if (btnId === 'topup') openTopUp();
            });
            return;
        }
        
        if (!deductBalance(cost, 'boost', {carId, title: `${car.brand} ${car.model}`})) {
            return;
        }
        
        performBoost(car);
        awardPoints('BOOST_PAID');
        tg.showAlert('Объявление поднято! (-15 лей)\n+15 очков рейтинга');
    } else {
        // Бесплатное поднятие
        performBoost(car);
        // Интервал зависит от уровня: 12ч (уровень 2+) или 24ч
        const hours = getFreeBoostIntervalHours();
        const next = new Date(Date.now() + hours * 3600000);
        currentUser.freeBoostAvailableAt = next.toISOString();
        saveUser();
        awardPoints('BOOST_FREE');
        tg.showAlert(`Объявление поднято бесплатно!\n+5 очков рейтинга\nСледующее через ${hours} ч`);
    }
    
    // Обновляем в памяти (не перезагружаем из DB — потеряем фото)
    const boostIdx = cars.findIndex(c => c.id === car.id);
    if (boostIdx !== -1) cars[boostIdx] = car;
    DB.saveCars(cars);
    pushCarToFirebase(car);
    renderMyListings();
}

function performBoost(car) {
    // ❗ createdAt НЕ меняется - объявление остаётся в "Новинках" только 24ч с момента создания
    // Только lastBoosted обновляется для сортировки в ленте
    car.lastBoosted = new Date().toISOString();
}

// ─── Временный Топ (уровень 3+) ───────────────────────────────

// Проверить, доступен ли временный Топ пользователю
function canUseTempTop() {
    const pts = currentUser.ratingPoints || 0;
    return pts >= 200; // достаточно очков для покупки
}

// Активировать временный Топ для объявления (24ч)
function activateTempTop(carId, skipConfirm = false) {
    carId = Number(carId);
    
    // Проверка уровня — защита от прямого вызова в обход canUseTempTop()
    // skipConfirm=true означает вызов из buyTempTop (очки уже проверены и списаны)
    if (!skipConfirm && !canUseTempTop()) {
        tg.showAlert('Функция «Поставить в Топ» доступна с уровня 2 (500 очков)');
        return;
    }
    
    const activeTempTop = currentUser.tempTop;
    if (activeTempTop && activeTempTop.carId && new Date(activeTempTop.expiresAt) > new Date()) {
        const remaining = getTimeLeft(activeTempTop.expiresAt);
        tg.showAlert(`У вас уже активен Топ для другого объявления.\nОсталось: ${remaining}`);
        return;
    }
    
    const car = cars.find(c => c.id === carId);
    if (!car) return;
    
    const doTop = () => {
        const expiresAt = new Date(Date.now() + 24 * 3600000).toISOString();
        currentUser.tempTop = { carId, expiresAt };
        const carIdx = cars.findIndex(c => c.id === carId);
        if (carIdx !== -1) {
            cars[carIdx].isTop = true;
            cars[carIdx].tempTopExpiresAt = expiresAt;
            DB.saveCars(cars);
            pushCarToFirebase(cars[carIdx]);
        }
        saveUser();
        render();
        renderMyListings();
        const expStr = new Date(expiresAt).toLocaleString('ru-RU', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
        tg.showAlert(`✅ Объявление в Топе!\nДействует до: ${expStr}`);
    };

    if (skipConfirm) {
        doTop();
        return;
    }

    const carTitle = `${car.partTitle || car.brand + ' ' + car.model}`.trim();
    tg.showPopup({
        title: '🔥 Добавить в Топ',
        message: `${carTitle}\n\n✓ В разделе «Топ» 24 часа\n✓ Оригинал остаётся в общем списке`,
        buttons: [
            {id: 'yes', type: 'default', text: 'Активировать'},
            {id: 'no', type: 'cancel', text: 'Отмена'}
        ]
    }, (btn) => { if (btn === 'yes') doTop(); });
}

// Удалить истёкшие временные Топы
function cleanExpiredTempTops() {
    const now = new Date();
    let changed = false;
    cars = cars.map(car => {
        if (car.tempTopExpiresAt && new Date(car.tempTopExpiresAt) <= now) {
            delete car.tempTopExpiresAt;
            car.isTop = false;
            pushCarToFirebase(car);
            changed = true;
        }
        return car;
    });
    if (changed) {
        DB.saveCars(cars);
        render();
    }
    // Чистим в профиле пользователей
    if (currentUser?.tempTop?.expiresAt && new Date(currentUser.tempTop.expiresAt) <= now) {
        currentUser.tempTop = null;
        saveUser();
    }
}

// Вспомогательная: время до истечения
function getTimeLeft(isoDate) {
    const diff = new Date(isoDate) - new Date();
    if (diff <= 0) return '0ч';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}ч ${m}м` : `${m}м`;
}

function activateAutoBoost(carId) {
    // Приводим к числу для надёжного сравнения
    carId = Number(carId);
    const car = cars.find(c => c.id === carId);
    if (!car) return;
    
    // Гарантируем структуру subscriptions
    if (!currentUser.subscriptions) currentUser.subscriptions = {};
    if (!currentUser.subscriptions.autoBoost) {
        currentUser.subscriptions.autoBoost = {active: false, carIds: [], cars: {}};
    }
    if (!Array.isArray(currentUser.subscriptions.autoBoost.carIds)) {
        currentUser.subscriptions.autoBoost.carIds = normalizeFirebaseArray(currentUser.subscriptions.autoBoost.carIds);
    }
    if (!currentUser.subscriptions.autoBoost.cars) {
        currentUser.subscriptions.autoBoost.cars = {};
    }
    
    const carIds = currentUser.subscriptions.autoBoost.carIds.map(Number);
    const hasActive = currentUser.subscriptions.autoBoost.active;
    const carCount = carIds.length;
    
    // Уже активно для этого объявления?
    if (hasActive && carIds.includes(carId)) {
        manageAutoBoost(carId);
        return;
    }
    
    let cost = 50; // первое объявление
    if (hasActive && carCount > 0) cost = 20; // дополнительные
    
    const carTitle = `${car.brand} ${car.model} ${car.year || ''}`.trim();
    
    tg.showPopup({
        title: '🔄 Автоподнятие',
        message: `Активировать для:\n${carTitle}\n\n✓ 5 раз в день (00:00, 05:00, 10:00, 15:00, 19:00)\n✓ Срок: 1 месяц\n✓ Бесплатное ручное поднятие сохраняется\n\nСтоимость: ${cost} лей/мес\nВаш баланс: ${currentUser.balance || 0} лей`,
        buttons: [
            {id: 'buy', type: 'default', text: `Купить за ${cost} лей`},
            {id: 'cancel', type: 'cancel', text: 'Отмена'}
        ]
    }, (btnId) => {
        if (btnId !== 'buy') return;
        
        if (!hasBalance(cost)) {
            tg.showPopup({
                title: 'Недостаточно средств',
                message: `Стоимость: ${cost} лей\nВаш баланс: ${currentUser.balance || 0} лей\n\nПополнить баланс?`,
                buttons: [
                    {id: 'topup', type: 'default', text: 'Пополнить'},
                    {id: 'cancel', type: 'cancel', text: 'Отмена'}
                ]
            }, (b) => { if (b === 'topup') openTopUp(); });
            return;
        }
        
        if (!deductBalance(cost, 'autoboost', {carId, title: carTitle})) return;
        
        // Срок действия — месяц с сегодня
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        
        currentUser.subscriptions.autoBoost.active = true;
        // Храним ID как числа
        if (!currentUser.subscriptions.autoBoost.carIds.map(Number).includes(carId)) {
            currentUser.subscriptions.autoBoost.carIds.push(carId);
        }
        currentUser.subscriptions.autoBoost.cars[carId] = {
            activatedAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString()
        };
        
        saveUser();
        renderMyListings();
        renderProfile();
        
        tg.showAlert(`✅ Автоподнятие активировано!\nОбъявление: ${carTitle}\nАктивно до: ${expiresAt.toLocaleDateString('ru-RU')}`);
    });
}

function manageAutoBoost(carId) {
    carId = Number(carId);
    const car = cars.find(c => c.id === carId);
    if (!car) return;
    
    const carTitle = `${car.brand} ${car.model} ${car.year || ''}`.trim();
    const carBoost = currentUser.subscriptions?.autoBoost?.cars?.[carId];
    const expiresAt = carBoost?.expiresAt 
        ? new Date(carBoost.expiresAt) 
        : new Date(currentUser.subscriptions?.autoBoost?.expiresAt); // fallback
    
    const expiresStr = expiresAt && !isNaN(expiresAt) 
        ? expiresAt.toLocaleDateString('ru-RU') 
        : 'не указан';
    
    tg.showPopup({
        title: '🔄 Автоподнятие активно',
        message: `${carTitle}\n\n✅ Статус: активно\n📅 Активно до: ${expiresStr}\n\nПоднимается 5 раз в день:\n00:00, 05:00, 10:00, 15:00, 19:00`,
        buttons: [
            {id: 'disable', type: 'destructive', text: '🗑 Отключить'},
            {id: 'close', type: 'cancel', text: 'Закрыть'}
        ]
    }, (btnId) => {
        if (btnId === 'disable') {
            disableAutoBoost(carId);
        }
    });
}

function disableAutoBoost(carId) {
    carId = Number(carId);
    if (!currentUser.subscriptions?.autoBoost?.carIds) return;
    
    // Нормализуем на случай Firebase object
    currentUser.subscriptions.autoBoost.carIds = normalizeFirebaseArray(currentUser.subscriptions.autoBoost.carIds).map(Number);
    const idx = currentUser.subscriptions.autoBoost.carIds.indexOf(carId);
    if (idx === -1) return;
    
    currentUser.subscriptions.autoBoost.carIds.splice(idx, 1);
    
    // Удаляем per-car данные
    if (currentUser.subscriptions.autoBoost.cars) {
        delete currentUser.subscriptions.autoBoost.cars[carId];
    }
    
    if (currentUser.subscriptions.autoBoost.carIds.length === 0) {
        currentUser.subscriptions.autoBoost.active = false;
    }
    
    saveUser(); // localStorage + Firebase
    renderMyListings();
    renderProfile();
    tg.showAlert('Автоподнятие отключено');
}

// renderProfile — обновляет данные профиля БЕЗ перехода на страницу
// (вызывается после изменений баланса/подписок когда профиль уже открыт)
function renderProfile() {
    if (!currentUser) return;
    
    // Обновляем баланс
    updateBalanceDisplay();
    
    // Статистика
    const myListings = cars.filter(c => String(c.userId) === String(currentUser.id));
    const statListings = document.getElementById('statListings');
    if (statListings) statListings.textContent = myListings.length;
    
    const statRating = document.getElementById('statRating');
    if (statRating) statRating.textContent = currentUser.ratingPoints || 0;
    
    // Статус автоподнятия в Premium секции
    const autoBoostStatus = document.getElementById('autoBoostStatus');
    if (autoBoostStatus) {
        const carIds = normalizeFirebaseArray(currentUser.subscriptions?.autoBoost?.carIds).map(Number);
        const isActive = currentUser.subscriptions?.autoBoost?.active && carIds.length > 0;
        if (isActive) {
            autoBoostStatus.textContent = `Активна (${carIds.length} объявл.)`;
            autoBoostStatus.classList.add('active');
        } else {
            autoBoostStatus.textContent = 'Неактивна';
            autoBoostStatus.classList.remove('active');
        }
    }
    
    renderRatingLevel();
    renderMyListings();
}

// Обновляем отображение очков и стрика в шапке профиля
function renderRatingLevel() {
    const pts = currentUser.ratingPoints || 0;
    const streak = currentUser.streak?.days || 0;

    const valEl = document.getElementById('pointsBalanceValue');
    if (valEl) valEl.textContent = pts;

    const streakEl = document.getElementById('streakDaysDisplay');
    if (streakEl) streakEl.textContent = streak;

    const avgEl = document.getElementById('profileAvgRating');
    if (avgEl) avgEl.textContent = pts;
    
    const statEl = document.getElementById('statRating');
    if (statEl) statEl.textContent = pts;
}

// История начислений
const RATING_LABELS = {
    LISTING_PUBLISHED: '📝 Опубликовал объявление',
    LISTING_50_VIEWS:  '👁 50 просмотров объявления',
    LISTING_2_WEEKS:   '📅 Объявление активно 2 недели',
    BOOST_FREE:        '⬆️ Бесплатное поднятие',
    BOOST_PAID:        '⬆️ Платное поднятие',
    PROFILE_COMPLETE:  '✅ Профиль заполнен полностью',
    ALL_PHOTOS:        '📷 Добавил 6 фото',
    VIDEO_ADDED:       '🎥 Добавил видео',
    STREAK_7_DAYS:     '🔥 7 дней подряд в приложении',
    BALANCE_TOPUP:     '💳 Пополнение баланса',
};

function toggleRatingLog() {
    const section = document.getElementById('ratingLogSection');
    const isOpen  = section.style.display !== 'none';
    
    if (!isOpen) {
        const log  = currentUser.ratingLog || [];
        const list = document.getElementById('ratingLogList');
        if (log.length === 0) {
            list.innerHTML = '<div class="rating-log-empty">Пока нет начислений</div>';
        } else {
            list.innerHTML = log.map(entry => {
                const d = new Date(entry.date);
                const dateStr = `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}`;
                return `<div class="rating-log-item">
                    <span class="rating-log-label">${RATING_LABELS[entry.reason] || entry.reason}</span>
                    <span class="rating-log-pts">+${entry.pts} · ${dateStr}</span>
                </div>`;
            }).join('');
        }
    }
    
    section.style.display = isOpen ? 'none' : 'block';
}

function renderProfileAvatar() {
    const wrap = document.getElementById('profileAvatarWrap');
    if (!wrap) return;
    if (currentUser.photo) {
        // Используем img тег для корректной обрезки квадратной аватарки
        wrap.style.backgroundImage = '';
        let img = wrap.querySelector('.profile-avatar-img');
        if (!img) {
            img = document.createElement('img');
            img.className = 'profile-avatar-img';
            img.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;border-radius:0;';
            wrap.insertBefore(img, wrap.firstChild);
        }
        img.src = currentUser.photo;
        wrap.querySelector('.profile-avatar-letter').style.display = 'none';
    } else {
        wrap.style.backgroundImage = '';
        const existImg = wrap.querySelector('.profile-avatar-img');
        if (existImg) existImg.remove();
        const letter = wrap.querySelector('.profile-avatar-letter');
        letter.style.display = 'flex';
        letter.textContent = currentUser.firstName 
            ? currentUser.firstName[0].toUpperCase() 
            : '👤';
    }
}

// ─── Вкладки профиля ──────────────────────────────────────────
function switchProfileTab(tab) {
    // Явные ID — совместимо и с tabAch и с tabAchievements в HTML
    const tabIds = {
        main:         'tabMain',
        achievements: document.getElementById('tabAchievements') ? 'tabAchievements' : 'tabAch',
        listings:     'tabListings'
    };
    ['main', 'achievements', 'listings'].forEach(t => {
        const btn = document.getElementById(tabIds[t]);
        const content = document.getElementById('tabContent' + t.charAt(0).toUpperCase() + t.slice(1));
        const isActive = t === tab;
        if (btn) btn.classList.toggle('active', isActive);
        if (content) content.style.display = isActive ? 'block' : 'none';
    });
    if (tab === 'achievements') renderAchievements();
    if (tab === 'listings') renderMyListings();
}

// ─── Раздел достижений ────────────────────────────────────────
function renderAchievements() {
    const pts = currentUser.ratingPoints || 0;
    const container = document.getElementById('achievementsContainer');
    if (!container) return;

    // Стрик
    const streak = currentUser.streak || { days: 0, lastDate: '' };
    const streakDays = streak.days || 0;
    const streakLastDate = streak.lastDate || '—';
    const today = getTodayStr();
    const isStreakActiveToday = streak.lastDate === today;

    // Статус услуг
    const boost12hExpiresAt = currentUser.boost12hActivated || null;
    const boost12hActive    = boost12hExpiresAt && new Date(boost12hExpiresAt) > new Date();
    const boost12hLeft      = boost12hActive ? getTimeLeft(boost12hExpiresAt) : null;

    const tt = currentUser.tempTop;
    const tempTopActive = tt?.carId && new Date(tt?.expiresAt) > new Date();
    const tempTopLeft   = tempTopActive ? getTimeLeft(tt.expiresAt) : null;

    const SHOP_ITEMS = [
        {
            id: 'boost12h',
            icon: '⬆️',
            title: 'Поднятие раз в 12 часов',
            desc: 'Бесплатно поднимать объявления каждые 12ч вместо 24ч. Действует 3 суток.',
            cost: 150,
            active: boost12hActive,
            activeLabel: boost12hLeft ? `Активно · осталось ${boost12hLeft}` : 'Активно',
            action: "buyBoost12h()"
        },
        {
            id: 'tempTop',
            icon: '🔥',
            title: 'Объявление в Топ на 24 часа',
            desc: 'Одно объявление дублируется в раздел «Топ» на 24 часа. После — остаётся в общих.',
            cost: 200,
            active: tempTopActive,
            activeLabel: tempTopLeft ? `Активно · осталось ${tempTopLeft}` : 'Активно',
            action: "buyTempTop()"
        }
    ];

    // Как заработать очки
    const HOW_TO_EARN = [
        { icon: '📝', text: 'Публикация объявления', pts: '+10' },
        { icon: '👁', text: '50 просмотров объявления', pts: '+15' },
        { icon: '📅', text: 'Объявление активно 2 недели', pts: '+15' },
        { icon: '✅', text: 'Заполнить профиль полностью', pts: '+30' },
        { icon: '📷', text: '6 фото при публикации', pts: '+10' },
        { icon: '🎥', text: 'Добавить видео', pts: '+10' },
        { icon: '⬆️', text: 'Поднять объявление', pts: '+5–15' },
        { icon: '🔥', text: '7 дней подряд в приложении', pts: '+25' },
        { icon: '💳', text: 'Пополнение баланса', pts: '+10' },
    ];

    container.innerHTML = `
        <div class="shop-section-title">🔥 Активность</div>
        <div class="streak-card ${isStreakActiveToday ? 'streak-active' : ''}">
            <div class="streak-main">
                <div class="streak-flame">🔥</div>
                <div class="streak-info">
                    <div class="streak-count">${streakDays} <span class="streak-unit">дней подряд</span></div>
                    <div class="streak-sub">${isStreakActiveToday ? '✅ Сегодня уже отмечено' : `Последний вход: ${streakLastDate}`}</div>
                </div>
            </div>
            <div class="streak-milestone">
                <div class="streak-milestone-text">До бонуса +25 очков: ещё ${7 - (streakDays % 7)} ${(7 - (streakDays % 7)) === 7 ? '(серия!✨)' : 'дн.'}</div>
            </div>
        </div>

        <div class="shop-section-title" style="margin-top:16px">🛒 Магазин услуг</div>
        ${SHOP_ITEMS.map(item => {
            const canAfford = pts >= item.cost;
            return `
            <div class="shop-item ${item.active ? 'shop-active' : ''} ${!canAfford && !item.active ? 'shop-unaffordable' : ''}">
                <div class="shop-item-header">
                    <span class="shop-item-icon">${item.icon}</span>
                    <div class="shop-item-info">
                        <div class="shop-item-title">${item.title}</div>
                        <div class="shop-item-desc">${item.desc}</div>
                    </div>
                </div>
                <div class="shop-item-footer">
                    ${item.active
                        ? `<div class="shop-item-status">${item.activeLabel}</div>`
                        : `<div class="shop-item-cost ${canAfford ? '' : 'shop-not-enough'}">
                               ${canAfford ? '⭐' : '🔒'} ${item.cost} очков
                           </div>
                           <button class="shop-buy-btn ${canAfford ? '' : 'shop-disabled'}"
                               onclick="${canAfford ? item.action : ''}">
                               ${canAfford ? 'Купить' : 'Мало очков'}
                           </button>`
                    }
                </div>
            </div>`;
        }).join('')}

        <div class="shop-section-title" style="margin-top:16px">💡 Как заработать очки</div>
        <div class="earn-list">
            ${HOW_TO_EARN.map(r => `
            <div class="earn-item">
                <span class="earn-icon">${r.icon}</span>
                <span class="earn-text">${r.text}</span>
                <span class="earn-pts">${r.pts}</span>
            </div>`).join('')}
        </div>
        ${isAdmin() ? `
        <div class="shop-section-title" style="margin-top:16px">📋 История переводов</div>
        <div id="adminTransferHistory" class="admin-transfer-history"></div>
        ` : ''}
    `;

    if (isAdmin()) renderAdminTransferHistory();
}
// Активировать режим 12ч поднятий на 3 суток
function activate12hBoost() { buyBoost12h(); }

function buyBoost12h() {
    const pts = currentUser.ratingPoints || 0;
    const COST = 150;

    if (boost12hActive_()) {
        tg.showAlert(`Уже активно!\nОсталось: ${getTimeLeft(currentUser.boost12hActivated)}`);
        return;
    }
    if (pts < COST) {
        tg.showAlert(`Недостаточно очков.\nНужно: ${COST} · У вас: ${pts}`);
        return;
    }

    tg.showPopup({
        title: '⬆️ Поднятие раз в 12 часов',
        message: `Списать ${COST} очков?\n\n✓ Поднятие объявлений каждые 12ч\n✓ Срок: 3 суток\n✓ Ваш баланс после: ${pts - COST} очков`,
        buttons: [
            {id: 'yes', type: 'default', text: `Купить за ${COST} очков`},
            {id: 'no',  type: 'cancel',  text: 'Отмена'}
        ]
    }, (btn) => {
        if (btn !== 'yes') return;
        currentUser.ratingPoints -= COST;
        const expiresAt = new Date(Date.now() + 3 * 24 * 3600000).toISOString();
        currentUser.boost12hActivated = expiresAt;
        saveUser();
        const expStr = new Date(expiresAt).toLocaleString('ru-RU', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
        tg.showAlert(`✅ Активировано до ${expStr}!\nТеперь можно поднимать раз в 12 часов.\nОстаток очков: ${currentUser.ratingPoints}`);
        renderAchievements();
        renderRatingLevel();
    });
}

// Вспомогательная без параметров
function boost12hActive_() {
    const exp = currentUser.boost12hActivated;
    return exp && new Date(exp) > new Date();
}

function buyTempTop() {
    const pts = currentUser.ratingPoints || 0;
    const COST = 200;
    const tt = currentUser.tempTop;
    const alreadyActive = tt?.carId && new Date(tt?.expiresAt) > new Date();

    if (alreadyActive) {
        tg.showAlert(`Уже активно!\nОсталось: ${getTimeLeft(tt.expiresAt)}`);
        return;
    }
    if (pts < COST) {
        tg.showAlert(`Недостаточно очков.\nНужно: ${COST} · У вас: ${pts}`);
        return;
    }

    const myListings = cars.filter(c => String(c.userId) === String(currentUser.id));
    if (!myListings.length) {
        tg.showAlert('У вас нет активных объявлений');
        return;
    }

    const doActivate = (carId) => {
        currentUser.ratingPoints -= COST;
        activateTempTop(carId, true); // true = уже списали очки
        saveUser();
        renderAchievements();
        renderRatingLevel();
    };

    if (myListings.length === 1) {
        const car = myListings[0];
        const title = (car.partTitle || `${car.brand} ${car.model}`).trim();
        tg.showPopup({
            title: '🔥 Объявление в Топ',
            message: `Списать ${COST} очков?\n\n«${title}»\n✓ В разделе Топ на 24 часа\n✓ Ваш баланс после: ${pts - COST} очков`,
            buttons: [
                {id: 'yes', type: 'default', text: `Купить за ${COST} очков`},
                {id: 'no',  type: 'cancel',  text: 'Отмена'}
            ]
        }, (btn) => { if (btn === 'yes') doActivate(car.id); });
        return;
    }

    // Несколько объявлений — выбор
    const buttons = myListings.slice(0, 5).map(c => ({
        id: String(c.id),
        type: 'default',
        text: `${(c.partTitle || c.brand + ' ' + (c.model||'')).trim()} · ${fmt(c.price)} ${c.currency}`.substring(0, 40)
    }));
    buttons.push({id: 'cancel', type: 'cancel', text: 'Отмена'});

    tg.showPopup({
        title: '🔥 Выберите объявление для Топа',
        message: `Стоимость: ${COST} очков · Срок: 24 часа\nВаш баланс после: ${pts - COST} очков`,
        buttons
    }, (btn) => {
        if (btn === 'cancel' || !btn) return;
        doActivate(Number(btn));
    });
}

// Выбрать объявление для tempTop
function chooseTempTopListing() {
    const pts = currentUser.ratingPoints || 0;
    if (pts < 200) {
        tg.showAlert('Недостаточно очков. Нужно минимум 200 очков.');
        return;
    }
    const myListings = cars.filter(c => String(c.userId) === String(currentUser.id));
    if (!myListings.length) {
        tg.showAlert('У вас нет активных объявлений');
        return;
    }

    // Если одно объявление — активируем сразу
    if (myListings.length === 1) {
        activateTempTop(myListings[0].id);
        return;
    }

    // Несколько — показываем список через popup
    const buttons = myListings.slice(0, 5).map(c => ({
        id: String(c.id),
        type: 'default',
        text: `${c.partTitle || c.brand + ' ' + (c.model||'')} · ${fmt(c.price)} ${c.currency}`.substring(0, 40)
    }));
    buttons.push({id: 'cancel', type: 'cancel', text: 'Отмена'});

    tg.showPopup({
        title: '🔥 Выберите объявление',
        message: 'Какое объявление добавить в Топ на 24 часа?',
        buttons
    }, (btn) => {
        if (btn === 'cancel' || !btn) return;
        activateTempTop(Number(btn));
        renderAchievements();
    });
}

function _setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function openProfile() {
    if (!currentUser) {
        tg.showAlert('Ошибка загрузки профиля');
        return;
    }

    try { switchProfileTab('main'); } catch(e) { console.warn('switchProfileTab:', e.message); }
    try { renderProfileAvatar(); } catch(e) { console.warn('renderProfileAvatar:', e.message); }

    _setText('profileName', currentUser.name || (currentUser.firstName + ' ' + (currentUser.lastName || '')).trim() || 'Пользователь');
    _setText('profileId', 'ID: ' + currentUser.telegramId);

    const myListings = cars.filter(c => String(c.userId) === String(currentUser.id));
    _setText('statListings', myListings.length);
    _setText('statViews', currentUser.views || 0);
    _setText('statRating', currentUser.ratingPoints || 0);

    try { updateBalanceDisplay(); } catch(e) { console.warn('updateBalanceDisplay:', e.message); }
    try { renderRatingLevel(); } catch(e) { console.warn('renderRatingLevel:', e.message); }

    const autoBoostStatus = document.getElementById('autoBoostStatus');
    if (autoBoostStatus) {
        const isActive = currentUser.subscriptions?.autoBoost?.active;
        const carCount = normalizeFirebaseArray(currentUser.subscriptions?.autoBoost?.carIds).length;
        if (isActive && carCount > 0) {
            autoBoostStatus.textContent = `Активна (${carCount} объявл.)`;
            autoBoostStatus.classList.add('active');
        } else {
            autoBoostStatus.textContent = 'Неактивна';
            autoBoostStatus.classList.remove('active');
        }
    }

    _setText('profileNameField', currentUser.name || 'Не указано');
    _setText('profilePhoneField', currentUser.phone || 'Не указан');
    _setText('profileEmailField', currentUser.email || 'Не указан');
    _setText('profileCityField', currentUser.city || 'Не указан');
    _setText('profileRegDate', formatDate(new Date(currentUser.registeredAt)));
    _setText('profileTotalViews', currentUser.views || 0);
    _setText('profileAvgRating', currentUser.ratingPoints || 0);

    try { renderMyListings(); } catch(e) { console.warn('renderMyListings:', e.message); }

    // Показываем кнопку "Перевести" только администратору
    const transferBtn = document.getElementById('adminTransferBtn');
    if (transferBtn) {
        transferBtn.style.display = isAdmin() ? 'inline-flex' : 'none';
    }

    openPageWithLock('profilePage');
}


// ─── Счётчики просмотров объявлений ───────────────────────────
function getViewKey(carId) { return `views_${carId}`; }

function getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Debounce для сохранения viewsData в Firebase
let _viewsSaveTimer = null;
function _debounceSaveViews() {
    if (_viewsSaveTimer) clearTimeout(_viewsSaveTimer);
    _viewsSaveTimer = setTimeout(() => {
        if (currentUser) saveUser();
        _viewsSaveTimer = null;
    }, 3000); // батчим запросы — сохраняем не чаще раза в 3 сек
}

// Увеличить счётчик при открытии объявления — пишем в Firebase через currentUser
function incrementView(carId) {
    const today = getTodayStr();
    const key = String(carId);

    // Также обновляем localStorage как кеш для быстрого чтения
    const lsKey = getViewKey(carId);
    let lsData = JSON.parse(localStorage.getItem(lsKey) || '{"today":0,"total":0,"date":""}');
    if (lsData.date !== today) { lsData.today = 0; lsData.date = today; }
    lsData.today++;
    lsData.total++;
    localStorage.setItem(lsKey, JSON.stringify(lsData));

    // Если объявление принадлежит текущему пользователю — сохраняем в Firebase
    if (currentUser) {
        if (!currentUser.viewsData) currentUser.viewsData = {};
        const v = currentUser.viewsData[key] || { today: 0, total: 0, date: '' };
        if (v.date !== today) { v.today = 0; v.date = today; }
        v.today++;
        v.total++;
        currentUser.viewsData[key] = v;
        _debounceSaveViews();
    }
}

// Получить счётчик для отображения — сначала Firebase, fallback localStorage
function getViews(carId) {
    const today = getTodayStr();
    const key = String(carId);

    // Firebase данные (для объявлений текущего пользователя)
    if (currentUser?.viewsData?.[key]) {
        const v = { ...currentUser.viewsData[key] };
        if (v.date !== today) { v.today = 0; }
        return v;
    }

    // Fallback: localStorage
    const lsKey = getViewKey(carId);
    let data = JSON.parse(localStorage.getItem(lsKey) || '{"today":0,"total":0,"date":""}');
    if (data.date !== today) { data.today = 0; }
    return data;
}

function renderMyListings() {
    if (!currentUser) return;
    const myListings = cars.filter(c => String(c.userId) === String(currentUser.id));
    const container = document.getElementById('myListingsContainer');
    if (!container) return; // страница профиля ещё не в DOM
    
    if (myListings.length === 0) {
        container.innerHTML = `<div class="my-listings-empty"><div class="my-listings-empty-icon">📋</div><div>У вас пока нет объявлений</div></div>`;
        return;
    }
    
    container.innerHTML = myListings.map(car => {
        const emoji = car.category === 'car' ? '🚗' : car.category === 'truck' ? '🚚' : 
                     car.category === 'special' ? '🚜' : car.category === 'moto' ? '🏍' : 
                     car.category === 'parts' ? '🔧' : '🚤';
        
        // Показываем фото если есть, иначе эмодзи
        let thumbHtml = '';
        if (car.photos && car.photos.length > 0) {
            thumbHtml = `<div class="my-listing-thumb" onclick="showDetail(${car.id})" style="background-image: url('${car.photos[0]}'); background-size: cover; background-position: center;"></div>`;
        } else {
            thumbHtml = `<div class="my-listing-thumb" onclick="showDetail(${car.id})">${emoji}</div>`;
        }
        
        const views = getViews(car.id);
        const isFree = canFreeBoost();
        const nextFree = getNextFreeBoostTime();
        // Нормализуем carIds — Firebase может вернуть объект вместо массива
        const autoBoostCarIds = normalizeFirebaseArray(currentUser.subscriptions?.autoBoost?.carIds).map(Number);
        const hasAutoBoost = currentUser.subscriptions?.autoBoost?.active && autoBoostCarIds.includes(Number(car.id));
        
        let boostButton = '';
        let autoBoostButton = '';
        
        // Кнопка автоподнятия
        if (hasAutoBoost) {
            const carBoost = currentUser.subscriptions?.autoBoost?.cars?.[car.id];
            const expiresAt = carBoost?.expiresAt 
                ? new Date(carBoost.expiresAt) 
                : (currentUser.subscriptions?.autoBoost?.expiresAt ? new Date(currentUser.subscriptions.autoBoost.expiresAt) : null);
            const expiresStr = expiresAt && !isNaN(expiresAt) 
                ? `до ${expiresAt.toLocaleDateString('ru-RU')}` 
                : '';
            const expiresBadge = expiresStr ? `<span class="boost-expires">${expiresStr}</span>` : '';
            autoBoostButton = `<button class="my-listing-autoboost active" onclick="event.stopPropagation(); manageAutoBoost(${car.id})">🔄 Автоподнятие активно ${expiresBadge}</button>`;
        } else {
            autoBoostButton = `<button class="my-listing-autoboost-add" onclick="event.stopPropagation(); activateAutoBoost(${car.id})">➕ Автоподнятие — 50 лей/мес</button>`;
        }
        
        // Кнопка ручного поднятия
        if (isFree) {
            boostButton = `<button class="my-listing-boost free" onclick="event.stopPropagation(); boostListing(${car.id})">⬆️ Поднять бесплатно</button>`;
        } else if (nextFree) {
            boostButton = `<button class="my-listing-boost paid" onclick="event.stopPropagation(); boostListing(${car.id}, true)">⬆️ Поднять — 15 лей</button>
                          <div class="boost-timer">Бесплатно через ${nextFree}</div>`;
        } else {
            boostButton = `<button class="my-listing-boost paid" onclick="event.stopPropagation(); boostListing(${car.id}, true)">⬆️ Поднять — 15 лей</button>`;
        }
        
        // Кнопка временного Топа (уровень 3+)
        let tempTopButton = '';
        if (canUseTempTop()) {
            const activeTempTop = currentUser.tempTop;
            const isThisCarTop = activeTempTop?.carId === Number(car.id) && 
                                 activeTempTop?.expiresAt && new Date(activeTempTop.expiresAt) > new Date();
            if (isThisCarTop) {
                const left = getTimeLeft(activeTempTop.expiresAt);
                tempTopButton = `<button class="my-listing-tempTop active" onclick="event.stopPropagation()">🔥 В Топе ещё ${left}</button>`;
            } else if (!activeTempTop || new Date(activeTempTop?.expiresAt) <= new Date()) {
                tempTopButton = `<button class="my-listing-tempTop" onclick="event.stopPropagation(); activateTempTop(${car.id})">🔥 Поставить в Топ · 24ч</button>`;
            }
        }
        
        return `<div class="my-listing-item">
            ${thumbHtml}
            <div class="my-listing-row">
                <div class="my-listing-info" onclick="showDetail(${car.id})">
                    <div class="my-listing-title">${car.category === 'parts' ? (car.partTitle || car.partType || car.brand) : car.brand + ' ' + car.model + ' ' + (car.year || '')}</div>
                    <div class="my-listing-price">${fmt(car.price)} ${car.currency}</div>
                    <div class="my-listing-date">${formatDate(car.createdAt)}</div>
                    <div class="my-listing-views">
                        <span class="views-today">👁 <b>${views.today}</b></span>
                        <span class="views-total">📊 <b>${views.total}</b></span>
                    </div>
                </div>
                <div class="my-listing-actions">
                    <button class="my-listing-btn edit-btn" onclick="editListing(${car.id})">✏️</button>
                    <button class="my-listing-btn delete-btn" onclick="deleteListing(${car.id})">🗑️</button>
                </div>
            </div>
            <div class="my-listing-boost-section">
                ${boostButton}
                ${tempTopButton}
                ${autoBoostButton}
            </div>
        </div>`;
    }).join('');
}

function editField(field) {
    currentEditField = field;
    const titles = {name: 'Имя', phone: 'Телефон', email: 'Email', city: 'Город'};
    const placeholders = {name: 'Введите имя', phone: '+373...', email: 'email@example.com', city: 'Тирасполь'};
    
    document.getElementById('editFieldTitle').textContent = titles[field] || 'Редактировать';
    document.getElementById('editFieldInput').placeholder = placeholders[field] || '';
    document.getElementById('editFieldInput').value = currentUser[field] || '';
    document.getElementById('editProfileModal').classList.add('show');
}

function saveField() {
    const value = document.getElementById('editFieldInput').value.trim();
    
    if (!value) {
        tg.showAlert('Введите значение');
        return;
    }
    
    currentUser[currentEditField] = value;
    saveUser();
    
    document.getElementById(`profile${currentEditField.charAt(0).toUpperCase() + currentEditField.slice(1)}Field`).textContent = value;
    
    closeEditModal();
    tg.showAlert('Сохранено');
    
    // Проверяем заполненность профиля
    checkProfileComplete();
}

function closeEditModal() {
    document.getElementById('editProfileModal').classList.remove('show');
}

function topUpBalance() {
    tg.showAlert('Функция в разработке');
}

// ─── Админ: перевод баланса другому пользователю ──────────────

let _transferSearchTimer = null;

function openAdminTransfer() {
    if (!isAdmin()) {
        tg.showAlert('Доступ запрещён');
        return;
    }
    // Сбрасываем поля
    const ridEl = document.getElementById('transferRecipientId');
    const amtEl = document.getElementById('transferAmount');
    const cmtEl = document.getElementById('transferComment');
    const infoEl = document.getElementById('transferRecipientInfo');
    const errEl = document.getElementById('transferError');
    if (ridEl) ridEl.value = '';
    if (amtEl) amtEl.value = '';
    if (cmtEl) cmtEl.value = '';
    if (infoEl) { infoEl.textContent = ''; infoEl.className = 'admin-transfer-recipient-info'; }
    if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }

    document.getElementById('adminTransferModal').style.display = 'flex';

    // Поиск пользователя при вводе ID
    if (ridEl) {
        ridEl.oninput = function() {
            clearTimeout(_transferSearchTimer);
            const val = this.value.trim();
            if (infoEl) { infoEl.textContent = ''; infoEl.className = 'admin-transfer-recipient-info'; }
            if (!val || val.length < 5) return;
            infoEl.textContent = '🔍 Поиск...';
            _transferSearchTimer = setTimeout(() => findTransferRecipient(val), 600);
        };
    }
}

function closeAdminTransfer() {
    document.getElementById('adminTransferModal').style.display = 'none';
}

async function findTransferRecipient(telegramId) {
    const infoEl = document.getElementById('transferRecipientInfo');
    if (!infoEl) return;
    try {
        // Firebase может хранить telegramId как число или строку — проверяем оба варианта
        const numId = Number(telegramId);
        const strId = String(telegramId);

        let data = null;

        // Попытка 1: как строка
        const snap1 = await firebase.database()
            .ref('users')
            .orderByChild('telegramId')
            .equalTo(strId)
            .once('value');
        data = snap1.val();

        // Попытка 2: как число (если строка не нашла)
        if (!data && !isNaN(numId)) {
            const snap2 = await firebase.database()
                .ref('users')
                .orderByChild('telegramId')
                .equalTo(numId)
                .once('value');
            data = snap2.val();
        }

        // Попытка 3: по ключу узла (userId === telegramId)
        if (!data) {
            const snap3 = await firebase.database()
                .ref(`users/${numId}`)
                .once('value');
            const u = snap3.val();
            if (u) data = { [numId]: u };
        }
        if (!data) {
            const snap3b = await firebase.database()
                .ref(`users/${strId}`)
                .once('value');
            const u = snap3b.val();
            if (u) data = { [strId]: u };
        }

        if (!data) {
            infoEl.textContent = '❌ Пользователь не найден';
            infoEl.className = 'admin-transfer-recipient-info error';
            return;
        }
        const user = Object.values(data)[0];
        const name = user.name || ((user.firstName || '') + ' ' + (user.lastName || '')).trim() || 'Без имени';
        infoEl.innerHTML = `✅ <b>${name}</b> · Баланс: ${user.balance || 0} лей`;
        infoEl.className = 'admin-transfer-recipient-info success';
        infoEl.dataset.userId = Object.keys(data)[0];
        infoEl.dataset.userName = name;
    } catch(e) {
        infoEl.textContent = '⚠️ Ошибка поиска: ' + e.message;
        infoEl.className = 'admin-transfer-recipient-info error';
    }
}

async function confirmAdminTransfer() {
    if (!isAdmin()) { tg.showAlert('Доступ запрещён'); return; }

    const ridEl   = document.getElementById('transferRecipientId');
    const amtEl   = document.getElementById('transferAmount');
    const cmtEl   = document.getElementById('transferComment');
    const infoEl  = document.getElementById('transferRecipientInfo');
    const errEl   = document.getElementById('transferError');
    const btn     = document.getElementById('transferConfirmBtn');

    const telegramId = (ridEl?.value || '').trim();
    const amount     = parseInt(amtEl?.value || '0');
    const comment    = (cmtEl?.value || '').trim();

    // Валидация
    function showErr(msg) {
        if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
    }
    if (errEl) errEl.style.display = 'none';

    if (!telegramId) { showErr('Введите Telegram ID получателя'); return; }
    if (String(telegramId) === String(ADMIN_TELEGRAM_ID)) { showErr('Нельзя переводить самому себе'); return; }
    if (!amount || amount < 1) { showErr('Введите сумму больше 0'); return; }
    if (!infoEl?.dataset?.userId) { showErr('Сначала дождитесь поиска пользователя'); return; }

    const recipientKey  = infoEl.dataset.userId;
    const recipientName = infoEl.dataset.userName || 'Пользователь';

    // Блокируем кнопку
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Отправка...'; }

    try {
        // Загружаем актуальные данные получателя из Firebase
        const snap = await firebase.database().ref(`users/${recipientKey}`).once('value');
        const recipient = snap.val();
        if (!recipient) throw new Error('Пользователь не найден в базе');

        const newBalance = (recipient.balance || 0) + amount;

        // Запись транзакции получателя
        const recipientTx = {
            type: 'deposit',
            amount,
            method: 'admin_transfer',
            comment: comment || 'Перевод от администратора',
            from: 'admin',
            date: new Date().toISOString()
        };
        const recipientTxs = Array.isArray(recipient.transactions)
            ? [recipientTx, ...recipient.transactions].slice(0, 100)
            : [recipientTx];

        // Обновляем баланс получателя в Firebase
        await firebase.database().ref(`users/${recipientKey}`).update({
            balance: newBalance,
            transactions: recipientTxs
        });

        // Сохраняем запись о переводе в историю admin'а
        if (!currentUser.adminTransfers) currentUser.adminTransfers = [];
        currentUser.adminTransfers.unshift({
            recipientTelegramId: telegramId,
            recipientName,
            amount,
            comment: comment || '',
            date: new Date().toISOString()
        });
        currentUser.adminTransfers = currentUser.adminTransfers.slice(0, 100);
        saveUser();

        closeAdminTransfer();
        tg.showAlert(`✅ Перевод выполнен!
${recipientName} получил ${amount} лей.
Новый баланс: ${newBalance} лей`);

    } catch(e) {
        showErr('Ошибка: ' + e.message);
        console.error('Transfer error:', e);
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Перевести'; }
    }
}

// Показать историю переводов (для админа в разделе достижений)
function renderAdminTransferHistory() {
    const container = document.getElementById('adminTransferHistory');
    if (!container) return;
    if (!isAdmin()) { container.style.display = 'none'; return; }

    const transfers = currentUser.adminTransfers || [];
    if (transfers.length === 0) {
        container.innerHTML = '<div class="admin-history-empty">Переводов ещё не было</div>';
        return;
    }
    container.innerHTML = transfers.map(t => {
        const date = new Date(t.date).toLocaleString('ru-RU', {day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit'});
        return `<div class="admin-history-item">
            <div class="admin-history-main">
                <span class="admin-history-name">${t.recipientName}</span>
                <span class="admin-history-amount">+${t.amount} лей</span>
            </div>
            <div class="admin-history-meta">
                ${t.comment ? `<span class="admin-history-comment">${t.comment}</span> · ` : ''}
                <span class="admin-history-date">${date}</span>
            </div>
        </div>`;
    }).join('');
}



function withdrawBalance() {
    if (currentUser.balance <= 0) {
        tg.showAlert('Недостаточно средств');
        return;
    }
    tg.showAlert('Функция в разработке');
}


// ─── Модальное окно выбора типа детали ────────────────────────
function getPartTypeIcon(type) {
    const icons = {
        'Двигатель и навесное': '🔩', 'КПП и сцепление': '⚙️',
        'Кузовные детали': '🚪', 'Оптика': '💡', 'Салон': '🪑',
        'Подвеска и рулевое': '🔧', 'Тормозная система': '⛔',
        'Электрика и датчики': '⚡', 'Шины и диски': '🛞',
        'Аудио и мультимедия': '🎵', 'Другое': '📦'
    };
    return icons[type] || '🔧';
}

function openPartTypeModal() {
    if (typeof PARTS_TYPES === 'undefined') {
        tg.showAlert('Данные не загружены');
        return;
    }
    const grid = document.getElementById('partTypeGrid');
    grid.innerHTML = PARTS_TYPES.map(item => `
        <div class="part-type-option ${formSelectedPartType === item.type ? 'selected' : ''}" 
             onclick="selectPartType('${item.type.replace(/'/g, "\'")}')">
            <div class="part-type-icon">${getPartTypeIcon(item.type)}</div>
            <div class="part-type-name">${item.type}</div>
            <div class="part-type-desc">${item.desc}</div>
        </div>
    `).join('');
    document.getElementById('partTypeModal').classList.add('show');
}

// Нажатие = сразу выбор + закрытие (без кнопки Применить)
function selectPartType(type) {
    formSelectedPartType = type;
    document.getElementById('partTypeInput').value = type;
    document.getElementById('partType').value = type;
    closeModal('partTypeModal');
}

function confirmPartType() {
    if (!formSelectedPartType) return;
    document.getElementById('partTypeInput').value = formSelectedPartType;
    document.getElementById('partType').value = formSelectedPartType;
    closeModal('partTypeModal');
}

function updateFormBrandOptions() {
    const cat = document.getElementById('category').value;
    
    // Показываем/скрываем поля в зависимости от категории
    const isParts = (cat === 'parts');
    const partTypeGr = document.getElementById('partTypeGroup');
    const conditionGr = document.getElementById('conditionGroup');
    
    if (partTypeGr) partTypeGr.style.display = isParts ? 'flex' : 'none';
    if (conditionGr) conditionGr.style.display = isParts ? 'flex' : 'none';
    
    const partTitleGr = document.getElementById('partTitleGroup');
    if (partTitleGr) partTitleGr.style.display = isParts ? 'flex' : 'none';
    
    // Для parts скрываем год, пробег, двигатель, КПП, топливо, привод, регистрацию
    const vehicleFields = ['year', 'mileage', 'engine', 'transmission', 'fuel', 'drive', 'registration'];
    vehicleFields.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.closest('.form-group')) {
            el.closest('.form-group').style.display = isParts ? 'none' : 'flex';
            // Убираем required у скрытых полей чтобы не блокировать отправку
            el.required = !isParts;
        }
    });
    
    // Заполняем опции condition если они пустые
    if (isParts && typeof PARTS_CONDITIONS !== 'undefined') {
        const conditionEl = document.getElementById('condition');
        
        if (conditionEl && conditionEl.options.length <= 1) {
            PARTS_CONDITIONS.forEach(cond => {
                const opt = document.createElement('option');
                opt.value = cond;
                opt.textContent = cond;
                conditionEl.appendChild(opt);
            });
        }
        
        // Для запчастей модель опциональна
        const modelInput = document.getElementById('formModelInput');
        if (modelInput) modelInput.required = false;
    } else {
        const modelInput = document.getElementById('formModelInput');
        if (modelInput) modelInput.required = true;
    }
    
    if (!cat) {
        document.getElementById('formBrandInput').placeholder = 'Сначала выберите категорию';
        document.getElementById('formModelInput').placeholder = 'Сначала выберите марку';
        formSelectedBrand = '';
        formSelectedModel = '';
        formSelectedVariant = '';
        document.getElementById('formBrand').value = '';
        document.getElementById('formModel').value = '';
        document.getElementById('formBrandInput').value = '';
        document.getElementById('formModelInput').value = '';
        return;
    }
    
    document.getElementById('formBrandInput').placeholder = 'Выберите марку';
    document.getElementById('formModelInput').placeholder = 'Сначала выберите марку';
    formSelectedBrand = '';
    formSelectedModel = '';
    formSelectedVariant = '';
    formSelectedPartType = '';
    document.getElementById('formBrand').value = '';
    document.getElementById('partTypeInput').value = '';
    document.getElementById('partType').value = '';
    document.getElementById('formModel').value = '';
    document.getElementById('formBrandInput').value = '';
    document.getElementById('formModelInput').value = '';
}

function openFormBrandModal() {
    const cat = document.getElementById('category').value;
    
    if (!cat) {
        tg.showAlert('Сначала выберите категорию');
        return;
    }
    
    // Для запчастей используем марки легковых авто (самый большой список)
    const brandsSource = (cat === 'parts') ? 'car' : cat;
    const brands = Object.keys(BRANDS_DATA[brandsSource] || {}).sort();
    const grid = document.getElementById('formBrandGrid');
    
    grid.innerHTML = brands.map(brand => 
        `<div class="form-brand-option ${formSelectedBrand === brand ? 'selected' : ''}" onclick="selectFormBrand('${brand}')">${brand}</div>`
    ).join('');
    
    document.getElementById('formBrandModal').classList.add('show');
}

function selectFormBrand(brand) {
    formSelectedBrand = brand;
    
    document.querySelectorAll('#formBrandGrid .form-brand-option').forEach(el => {
        el.classList.toggle('selected', el.textContent === brand);
    });
}

function confirmFormBrand() {
    if (!formSelectedBrand) {
        tg.showAlert('Выберите марку');
        return;
    }
    
    document.getElementById('formBrand').value = formSelectedBrand;
    document.getElementById('formBrandInput').value = formSelectedBrand;
    
    formSelectedModel = '';
    formSelectedVariant = '';
    document.getElementById('formModel').value = '';
    document.getElementById('formModelInput').value = '';
    document.getElementById('formModelInput').placeholder = 'Выберите модель';
    
    closeFormBrandModal();
}

function closeFormBrandModal() {
    document.getElementById('formBrandModal').classList.remove('show');
}

function openFormModelModal() {
    const cat = document.getElementById('category').value;
    const brand = formSelectedBrand;
    
    if (!cat) {
        tg.showAlert('Сначала выберите категорию');
        return;
    }
    
    if (!brand) {
        tg.showAlert('Сначала выберите марку');
        return;
    }
    
    // Для запчастей берём модели из списка легковых (как и для брендов)
    const brandsSource = (cat === 'parts') ? 'car' : cat;
    const brandData = BRANDS_DATA[brandsSource]?.[brand];
    
    if (!brandData) {
        tg.showAlert('Для выбранной марки нет моделей');
        return;
    }
    
    let models = [];
    
    // Проверяем тип данных: объект (новая иерархическая структура) или массив (старая)
    if (Array.isArray(brandData)) {
        // Старая структура - массив моделей с версиями в названии
        models = brandData;
    } else {
        // Новая структура - объект {модель: [варианты]}
        models = Object.keys(brandData);
    }
    
    const grid = document.getElementById('formModelGrid');
    
    if (models.length === 0) {
        tg.showAlert('Для выбранной марки нет моделей');
        return;
    }
    
    grid.innerHTML = models.map(model => 
        `<div class="form-brand-option ${formSelectedModel === model ? 'selected' : ''}" onclick="selectFormModel('${model.replace(/'/g, "\\'")}')">${model}</div>`
    ).join('');
    
    document.getElementById('formModelModal').classList.add('show');
}

function selectFormModel(model) {
    formSelectedModel = model;
    
    document.querySelectorAll('#formModelGrid .form-brand-option').forEach(el => {
        el.classList.toggle('selected', el.textContent === model);
    });
}

function confirmFormModel() {
    if (!formSelectedModel) {
        tg.showAlert('Выберите модель');
        return;
    }
    
    // Проверяем, есть ли варианты для этой модели
    const cat = document.getElementById('category').value;
    const brandsSource = (cat === 'parts') ? 'car' : cat;
    const brandData = BRANDS_DATA[brandsSource]?.[formSelectedBrand];
    
    // Если это иерархическая структура (объект) - показываем варианты
    if (brandData && !Array.isArray(brandData)) {
        closeFormModelModal();
        openFormVariantModal();
        return;
    }
    
    // Если старая структура (массив) - просто закрываем модал
    document.getElementById('formModel').value = formSelectedModel;
    document.getElementById('formModelInput').value = formSelectedModel;
    formSelectedVariant = ''; // Очищаем вариант
    
    closeFormModelModal();
}

function closeFormModelModal() {
    document.getElementById('formModelModal').classList.remove('show');
}

// ═══ МОДАЛ ВЫБОРА ВАРИАНТА/КОМПЛЕКТАЦИИ ═══

function openFormVariantModal() {
    const cat = document.getElementById('category').value;
    const brandsSource = (cat === 'parts') ? 'car' : cat;
    const brandData = BRANDS_DATA[brandsSource]?.[formSelectedBrand];
    
    if (!brandData || Array.isArray(brandData)) {
        // Нет вариантов или старая структура
        return;
    }
    
    const variants = brandData[formSelectedModel] || [];
    
    if (variants.length === 0) {
        tg.showAlert('Для выбранной модели нет вариантов');
        return;
    }
    
    const grid = document.getElementById('formVariantGrid');
    
    // Добавляем опцию "Все {модель}"
    const allOption = `Все ${formSelectedModel}`;
    const optionsHTML = [
        `<div class="form-brand-option ${formSelectedVariant === allOption ? 'selected' : ''}" onclick="selectFormVariant('${allOption.replace(/'/g, "\\'")}')" style="font-weight: 600; background: #f0f0f0;">${allOption}</div>`,
        ...variants.map(variant => 
            `<div class="form-brand-option ${formSelectedVariant === variant ? 'selected' : ''}" onclick="selectFormVariant('${variant.replace(/'/g, "\\'")}')">${variant}</div>`
        )
    ].join('');
    
    grid.innerHTML = optionsHTML;
    
    document.getElementById('formVariantModal').classList.add('show');
}

function selectFormVariant(variant) {
    formSelectedVariant = variant;
    
    document.querySelectorAll('#formVariantGrid .form-brand-option').forEach(el => {
        el.classList.toggle('selected', el.textContent === variant);
    });
}

function confirmFormVariant() {
    if (!formSelectedVariant) {
        tg.showAlert('Выберите вариант');
        return;
    }
    
    // Формируем полное название: "Модель Вариант" или просто "Модель" если выбрано "Все"
    const allOption = `Все ${formSelectedModel}`;
    let fullModel = formSelectedModel;
    
    if (formSelectedVariant !== allOption) {
        fullModel = `${formSelectedModel} ${formSelectedVariant}`;
    }
    
    document.getElementById('formModel').value = fullModel;
    document.getElementById('formModelInput').value = fullModel;
    
    closeFormVariantModal();
}

function closeFormVariantModal() {
    document.getElementById('formVariantModal').classList.remove('show');
}

document.getElementById('searchInput').addEventListener('input', function(e) {
    filters.search = e.target.value.toLowerCase();
    render();
});

// Инициализация приложения — ждём загрузку пользователя перед рендером
(async () => {
    // Показываем экран загрузки пока грузим данные из Firebase
    const loadingEl = document.createElement('div');
    loadingEl.id = 'appLoader';
    loadingEl.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:16px">
        <div style="font-size:40px">🚗</div>
        <div style="color:var(--text2);font-size:14px">Загрузка объявлений...</div>
    </div>`;
    document.body.appendChild(loadingEl);

    // Инициализируем Firebase SDK
    initFirebase();

    await initUser();

    // Подключаемся к Firebase WebSocket — ждём первую загрузку данных
    await syncFromFirebase();
    // После этого syncFromFirebase продолжает слушать изменения в реальном времени
    // setInterval больше не нужен — WebSocket сам пушит обновления

    // Убираем лоадер и показываем контент
    loadingEl.remove();

    // Загружаем favorites из Firebase если есть
    if (currentUser && Array.isArray(currentUser.favorites) && currentUser.favorites.length > 0) {
        favorites = currentUser.favorites;
        DB.saveFavorites(favorites);
        updateFavBadge();
    } else if (currentUser && favorites.length > 0 && !currentUser.favorites) {
        // Миграция: если в localStorage есть, но в Firebase нет — сохраняем
        currentUser.favorites = favorites;
        saveUser();
    }

    render();
    updateFavBadge();
    checkDailyStreak();
    cleanExpiredTempTops();
    setTimeout(() => {
        checkListingViewsMilestones();
        checkListingAgeBonus();
    }, 2000);
})();
