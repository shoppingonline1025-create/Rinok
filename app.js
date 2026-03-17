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
const BOT_USERNAME = 'Auto_Market_PMRbot'; // Telegram бот для deep links

// ─── Администратор ────────────────────────────────────────────
const ADMIN_TELEGRAM_ID  = 814278637;  // Telegram ID администратора (@LOVE_TIRAS)
const ADMIN2_TELEGRAM_ID = 1016811865; // Второй администратор (@Evgenii_Ar)

// ─── Авто-модерация: стоп-слова ───────────────────────────────
const BANNED_WORDS = [
    // Мат (базовый набор, корни слов — ловит все формы)
    'хуй','хуе','хуя','хуё','пизд','ёбан','ебан','еблан','бляд','сука','пидор','пидар',
    'залуп','мудак','мудил','ублюдок','уёбок','уебок','ёбнут','хуесос','долбоёб','долбоеб',
    // Мошенничество / скам
    'кидалово','кидала','лохотрон','развод на деньги','предоплата обязательна',
    'перевод на карту','western union','сбербанк перевод','qiwi перевод',
    'нигерия','принц','выигрыш','вы выиграли','ваш приз',
    // Спам / нерелевантное
    'казино','ставки','заработок','пассивный доход','mlm','сетевой маркетинг',
    'кредит без','займ без','микрозайм',
    // Оружие / незаконное
    'оружие продам','пистолет продам','автомат продам','наркот','героин','кокаин','амфетамин',
];

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
const esc = escapeHtml;

function validatePhone(value) {
    if (!value) return 'Укажите номер телефона — покупатели смогут написать вам в Telegram';
    if (!/^[+\d\s\-()]+$/.test(value)) return 'Номер телефона содержит недопустимые символы';
    const digits = value.replace(/\D/g, '');
    if (digits.length < 7) return 'Номер телефона слишком короткий (минимум 7 цифр)';
    if (digits.length > 15) return 'Номер телефона слишком длинный (максимум 15 цифр)';
    return null;
}

function containsBannedWords(text) {
    if (!text) return null;
    const lower = text.toLowerCase().replace(/ё/g, 'е');
    for (const word of BANNED_WORDS) {
        const w = word.toLowerCase().replace(/ё/g, 'е');
        if (lower.includes(w)) return word;
    }
    return null;
}
// ──────────────────────────────────────────────────────────────

function isAdmin() {
    if (!currentUser) return false;
    const tid = String(currentUser.telegramId);
    return tid === String(ADMIN_TELEGRAM_ID) || tid === String(ADMIN2_TELEGRAM_ID);
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
    let failedCount = 0;
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
            failedCount++;
        }
    }

    return { urls, failedCount };
}

/**
 * Загрузка видео в Cloudinary
 * @param {File} file - видеофайл
 * @returns {Promise<string>} - URL загруженного видео
 */
async function uploadVideoToCloudinary(file) {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'cars_video');
    try {
        const response = await fetch(url, { method: 'POST', body: formData });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.secure_url) {
            console.log('✅ Cloudinary video upload:', data.secure_url);
            return data.secure_url;
        } else {
            throw new Error(data.error?.message || 'Upload failed');
        }
    } catch (error) {
        console.error('❌ Cloudinary video upload error:', error);
        throw error;
    }
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
 * Оптимизация URL Cloudinary для видео — отдаёт версию 720p
 * @param {string} url - оригинальный Cloudinary URL
 * @returns {string} - URL видео 720p
 */
function getOptimizedVideoUrl(url) {
    if (!url || !url.includes('cloudinary.com')) {
        return url;
    }
    // h_720,c_limit — ограничить высоту 720p без растяжения
    // q_auto — авто качество, vc_auto — авто кодек (H.264/VP9)
    return url.replace('/upload/', '/upload/h_720,c_limit,q_auto,vc_auto/');
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

// URL Cloudflare Worker — замените после деплоя (см. cloudflare-worker/wrangler.toml)
const WORKER_URL = 'https://automarket-auth.avtomarketmd.workers.dev';

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

// Авторизация в Firebase через Cloudflare Worker + Telegram initData
async function signInToFirebase() {
    const initData = tg.initData;
    if (!initData) {
        // Тестовый режим (десктоп/разработка) — Firebase Auth пропускаем
        return;
    }
    try {
        const resp = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData })
        });
        if (!resp.ok) throw new Error(`Worker HTTP ${resp.status}`);
        const { token } = await resp.json();
        await firebase.auth().signInWithCustomToken(token);
    } catch(e) {
        console.warn('Firebase signIn failed:', e.message);
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
    if (!_fbDb) return Promise.resolve();
    return firebase.database().ref(`cars/${car.id}`).set(car)
        .catch(e => {
            console.error('pushCar error:', e);
            setSyncStatus('error', `Ошибка записи: ${e.message}`);
            throw e;
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
    if (!_fbDb) return Promise.resolve();
    return firebase.database().ref(`cars/${carId}`).remove()
        .catch(e => {
            console.error('deleteCarFromFirebase error:', e);
            setSyncStatus('error', `Ошибка удаления: ${e.message}`);
            throw e;
        });
}

// --- Пользователи ---
async function pushUserToFirebase(user) {
    if (!_fbDb || !user?.id) return;
    const userToSave = {...user};
    delete userToSave.photo;
    try {
        await firebase.database().ref(`users/${user.id}`).set(userToSave);
    } catch(e) {
        console.warn('pushUser error:', e.message);
        setSyncStatus('error', `Данные не сохранены: ${e.message}`);
        throw e;
    }
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
let topRotationIds = []; // IDs объявлений в автоматической ротации Топа

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
    const paidTop     = filtered.filter(c => c.isTop);
    const rotationTop = filtered.filter(c => !c.isTop && topRotationIds.includes(c.id));
    let top = [...paidTop, ...rotationTop];
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
    let topIds = filtered.filter(c => c.isTop || topRotationIds.includes(c.id)).map(c => c.id);
    let newIds = filtered.filter(c => isNew(c.createdAt)).map(c => c.id);
    const _nowE = new Date();
    let allCars = filtered.filter(c => !topIds.includes(c.id) && !newIds.includes(c.id))
        .sort((a, b) => {
            const aPin = a.searchPinExpiresAt && new Date(a.searchPinExpiresAt) > _nowE;
            const bPin = b.searchPinExpiresAt && new Date(b.searchPinExpiresAt) > _nowE;
            if (aPin && !bPin) return -1;
            if (!aPin && bPin) return 1;
            return new Date(getSortDate(b)) - new Date(getSortDate(a));
        });
    
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
                if (c.model && c.model.startsWith(filterModel + ' ')) return true;
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
    
    const paidTop      = filtered.filter(c => c.isTop);
    const rotationTop  = filtered.filter(c => !c.isTop && topRotationIds.includes(c.id));
    let top = [...paidTop, ...rotationTop];
    let newCars = filtered.filter(c => isNew(c.createdAt)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Все остальные объявления (не топ и не новые)
    let topIds = top.map(c => c.id);
    let newIds = newCars.map(c => c.id);
    const _now = new Date();
    let allCars = filtered.filter(c => !topIds.includes(c.id) && !newIds.includes(c.id))
        .sort((a, b) => {
            const aPin = a.searchPinExpiresAt && new Date(a.searchPinExpiresAt) > _now;
            const bPin = b.searchPinExpiresAt && new Date(b.searchPinExpiresAt) > _now;
            if (aPin && !bPin) return -1;
            if (!aPin && bPin) return 1;
            return new Date(getSortDate(b)) - new Date(getSortDate(a));
        });

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
        allContainer.innerHTML = allCars.slice(0, 10).map(makeCard).join('');
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
    if (currentGalleryIndex[c.id] === undefined) currentGalleryIndex[c.id] = 0;
    const idx = currentGalleryIndex[c.id];
    const isVip      = c.isTop;
    const isRotation = !c.isTop && topRotationIds.includes(c.id);
    let imageHtml = '';

    if (c.photos && c.photos.length > 0) {
        const dots = c.photos.map((p, i) => `<span class="gallery-dot ${i === idx ? 'active' : ''}"></span>`).join('');
        imageHtml = `<div class="car-gallery" data-car-id="${c.id}">
            <img src="${getThumbUrl(c.photos[idx])}">
            <div class="category-badge">${categoryNames[c.category]}</div>
            <div class="date-badge">${formatDateShort(c.createdAt)}</div>
            ${isVip      ? `<div class="top-badge top-badge--vip">🔥 VIP</div>` : ''}
            ${isRotation ? `<div class="top-badge top-badge--rotation">⭐ Топ</div>` : ''}
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
    
    const isHighlighted = c.highlightExpiresAt && new Date(c.highlightExpiresAt) > new Date();
    return `<div class="car-card${isHighlighted ? ' car-card--highlighted' : ''}" onclick="showDetail(${c.id})">
        ${isHighlighted ? '<div style="font-size:11px;color:#f5a623;text-align:right;padding:4px 8px 0;font-weight:600;">🏷️ Выделено</div>' : ''}
        ${imageHtml}
        <div class="car-info">
            ${c.category === 'parts' ? `
                <div class="car-title">${esc(c.partTitle) || (esc(c.partType || '') + (c.brand ? ' • ' + esc(c.brand) : ''))}</div>
                <div class="car-price">${fmt(c.price)} ${esc(c.currency)}</div>
                <div class="car-details">
                    <div><span class="detail-icon">🔧</span> ${esc(c.partType)}</div>
                    <div><span class="detail-icon">✅</span> Состояние: <strong>${esc(c.condition)}</strong></div>
                    <div><span class="detail-icon">📍</span> Город: <strong>${esc(c.city)}</strong></div>
                </div>
            ` : `
                <div class="car-title">${esc(c.brand)} ${esc(c.model)} ${esc(c.year)}</div>
                <div class="car-price">${fmt(c.price)} ${esc(c.currency)}</div>
                <div class="car-details">
                    <div><span class="detail-icon">📏</span> Пробег: <strong>${fmt(c.mileage)} км</strong></div>
                    <div><span class="detail-icon">🔧</span> Объем: <strong>${esc(c.engine)}</strong></div>
                    <div><span class="detail-icon">⛽</span> Топливо: <strong>${esc(c.fuel)}</strong></div>
                    ${c.drive ? `<div><span class="detail-icon">🚙</span> Привод: <strong>${esc(c.drive)}</strong></div>` : ''}
                    <div><span class="detail-icon">📍</span> Город: <strong>${esc(c.city)}</strong></div>
                    <div><span class="detail-icon">🚘</span> Регистрация: <strong>${esc(c.registration)}</strong></div>
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
        if (img) img.src = getThumbUrl(car.photos[currentGalleryIndex[carId]]);
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

    window._currentDetailId = id;

    // Увеличиваем счётчик просмотров
    incrementView(id);
    
    let isFav = favorites.includes(id);
    detailGalleryIndex = 0;
    
    // Сохраняем фото для модального окна
    currentDetailPhotos = c.photos && c.photos.length > 0 ? [...c.photos] : [];
    
    let galleryHtml = '';
    if (c.photos && c.photos.length > 0) {
        const images = c.photos.map((p, i) =>
            `<img src="${getFullUrl(p)}" onclick="openPhotoModal(${i})" style="display: ${i === 0 ? 'block' : 'none'}; width: 100%; object-fit: cover; cursor: pointer;">`
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
            <div class="detail-title">${c.category === 'parts' ? (esc(c.partTitle) || esc(c.partType) + ' • ' + esc(c.brand)) : esc(c.brand) + ' ' + esc(c.model)}</div>
            <div class="detail-price">${fmt(c.price)} ${esc(c.currency)}</div>
            <div class="contact-section">${contactButtons}</div>
            <div class="detail-section">
                <div class="detail-section-title">Характеристики</div>
                <div class="detail-specs">
                    <div class="detail-spec-item"><div class="detail-spec-label">Категория</div><div class="detail-spec-value">${esc(categoryNames[c.category])}</div></div>
                    ${c.category === 'parts' ? `
                        ${c.partTitle ? `<div class="detail-spec-item"><div class="detail-spec-label">Заголовок</div><div class="detail-spec-value">${esc(c.partTitle)}</div></div>` : ''}
                        <div class="detail-spec-item"><div class="detail-spec-label">Тип детали</div><div class="detail-spec-value">${esc(c.partType)}</div></div>
                        <div class="detail-spec-item"><div class="detail-spec-label">Для марки</div><div class="detail-spec-value">${esc(c.brand)}</div></div>
                        ${c.model ? `<div class="detail-spec-item"><div class="detail-spec-label">Модель</div><div class="detail-spec-value">${esc(c.model)}</div></div>` : ''}
                        <div class="detail-spec-item"><div class="detail-spec-label">Состояние</div><div class="detail-spec-value">${esc(c.condition)}</div></div>
                    ` : `
                        <div class="detail-spec-item"><div class="detail-spec-label">Год</div><div class="detail-spec-value">${esc(c.year)}</div></div>
                        <div class="detail-spec-item"><div class="detail-spec-label">Пробег</div><div class="detail-spec-value">${fmt(c.mileage)} км</div></div>
                        <div class="detail-spec-item"><div class="detail-spec-label">Двигатель</div><div class="detail-spec-value">${esc(c.engine)}</div></div>
                        <div class="detail-spec-item"><div class="detail-spec-label">Коробка</div><div class="detail-spec-value">${esc(c.transmission)}</div></div>
                        <div class="detail-spec-item"><div class="detail-spec-label">Топливо</div><div class="detail-spec-value">${esc(c.fuel)}</div></div>
                        ${c.drive ? `<div class="detail-spec-item"><div class="detail-spec-label">Привод</div><div class="detail-spec-value">${esc(c.drive)}</div></div>` : ''}
                    `}
                    <div class="detail-spec-item"><div class="detail-spec-label">Город</div><div class="detail-spec-value">${esc(c.city)}</div></div>
                    ${c.category !== 'parts' ? `<div class="detail-spec-item"><div class="detail-spec-label">Регистрация</div><div class="detail-spec-value">${esc(c.registration) || '—'}</div></div>` : ''}
                </div>
            </div>
            <div class="detail-section">
                <div class="detail-section-title">Описание</div>
                <div>${esc(c.description)}</div>
            </div>
            ${c.video ? `
            <div class="detail-section">
                <div class="detail-section-title">Видео</div>
                <video src="${getOptimizedVideoUrl(c.video)}" controls playsinline style="width:100%;border-radius:12px;max-height:340px;background:#000;"></video>
            </div>
            ` : ''}
            <div class="detail-section">
                <div class="detail-section-title">Продавец</div>
                <div class="seller-info">
                    <div class="seller-name">${esc(sellerName)}</div>
                    ${sellerUsername ? `<div class="seller-location">@${esc(sellerUsername)}</div>` : ''}
                    ${sellerCity ? `<div class="seller-location">📍 ${esc(sellerCity)}</div>` : ''}
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
                                    <div class="seller-car-title">${esc(car.brand)} ${esc(car.model)}</div>
                                    <div class="seller-car-price">${fmt(car.price)} ${esc(car.currency)}</div>
                                    <div class="seller-car-year">${esc(car.year)} г.</div>
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
    
    img.src = getFullUrl(currentDetailPhotos[photoModalIndex]);
    
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
    
    img.src = getFullUrl(currentDetailPhotos[photoModalIndex]);
    counter.textContent = `${photoModalIndex + 1} / ${currentDetailPhotos.length}`;
}

// ─── ПОДЕЛИТЬСЯ ОБЪЯВЛЕНИЕМ ───────────────────────────────────────────────────

function getListingDeepLink(carId) {
    return `https://t.me/${BOT_USERNAME}?startapp=listing_${carId}`;
}

function getListingShareText(car) {
    if (!car) return 'АвтоМаркет ПМР';
    const title = car.category === 'parts'
        ? (car.partTitle || car.partType || 'Запчасть')
        : `${car.brand || ''} ${car.model || ''} ${car.year || ''}`.trim();
    const price = car.price ? `${fmt(car.price)} ${car.currency || ''}`.trim() : '';
    const city  = car.city ? `📍 ${car.city}` : '';
    return [`🚗 ${title}`, price, city, 'АвтоМаркет ПМР'].filter(Boolean).join('\n');
}

function shareListing(carId) {
    const sheet = document.getElementById('shareSheet');
    sheet.dataset.carId = carId;
    sheet.classList.add('show');
    document.getElementById('shareSheetOverlay').classList.add('show');
}

function closeShareSheet() {
    document.getElementById('shareSheet').classList.remove('show');
    document.getElementById('shareSheetOverlay').classList.remove('show');
}

function shareToTelegram() {
    const carId = document.getElementById('shareSheet').dataset.carId;
    const car = cars.find(c => c.id === Number(carId));
    const link = getListingDeepLink(carId);
    const text = getListingShareText(car);
    const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    tg.openTelegramLink(url);
    closeShareSheet();
}

async function copyListingLink() {
    const carId = document.getElementById('shareSheet').dataset.carId;
    const link = getListingDeepLink(carId);
    try {
        await navigator.clipboard.writeText(link);
    } catch {
        // fallback для старых браузеров
        const el = document.createElement('textarea');
        el.value = link;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }
    const btn = document.getElementById('copyLinkBtn');
    btn.textContent = '✓ Скопировано!';
    setTimeout(() => { btn.textContent = '🔗 Скопировать ссылку'; closeShareSheet(); }, 1500);
}

// ──────────────────────────────────────────────────────────────────────────────

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
                        <div class="fav-card-title">${c.category === 'parts' ? (esc(c.partTitle) || esc(c.partType) || esc(c.brand)) : `${esc(c.brand)} ${esc(c.model)} <span class="fav-card-year">${esc(c.year)}</span>`}</div>
                        ${isTop}
                    </div>
                    <div class="fav-card-price">${fmt(c.price)} ${esc(c.currency)}</div>
                    <div class="fav-card-meta">
                        ${c.category === 'parts' ? `
                            <span>🔧 ${esc(c.partType) || '—'}</span>
                            <span>✅ ${esc(c.condition) || '—'}</span>
                        ` : `
                            <span>📏 ${fmt(c.mileage)} км</span>
                            <span>📍 ${esc(c.city)}</span>
                        `}
                    </div>
                    ${c.category !== 'parts' ? `
                    <div class="fav-card-meta">
                        <span>⛽ ${esc(c.fuel)}</span>
                        <span>⚙️ ${esc(c.transmission)}</span>
                    </div>` : `
                    <div class="fav-card-meta">
                        <span>📍 ${esc(c.city)}</span>
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
    }, async function(buttonId) {
        if (buttonId === 'delete') {
            try {
                await deleteCarFromFirebase(carId);
            } catch(e) {
                tg.showAlert('Ошибка удаления. Проверьте соединение и попробуйте снова.');
                return;
            }

            // Удаляем из памяти (сохраняем все чужие объявления)
            cars = cars.filter(c => c.id !== carId);
            // Удаляем из localStorage (только метаданные)
            DB.saveCars(cars);

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

async function handleVideo(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Проверка размера файла (≤ 30 МБ)
    const MAX_SIZE_MB = 30;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        tg.showAlert(`Видео слишком большое (${(file.size / 1024 / 1024).toFixed(0)} МБ). Максимум ${MAX_SIZE_MB} МБ.\n\nСовет: запишите видео в настройках камеры в качестве 720p — оно будет легче.`);
        e.target.value = '';
        return;
    }

    // Проверка длительности (≤ 30 сек)
    document.getElementById('videoPreview').innerHTML =
        `<div class="file-preview-item" style="padding:16px;text-align:center;color:var(--text-secondary);">⏳ Проверка видео...</div>`;

    let duration;
    try {
        duration = await new Promise((resolve, reject) => {
            const vid = document.createElement('video');
            vid.preload = 'metadata';
            const objUrl = URL.createObjectURL(file);
            vid.onloadedmetadata = () => { URL.revokeObjectURL(objUrl); resolve(vid.duration); };
            vid.onerror = () => { URL.revokeObjectURL(objUrl); reject(); };
            vid.src = objUrl;
        });
    } catch {
        // Если не удалось прочитать метаданные — пропускаем проверку и грузим
        duration = 0;
    }

    if (duration > 30) {
        tg.showAlert(`Видео слишком длинное (${Math.round(duration)} сек). Максимум 30 секунд.`);
        e.target.value = '';
        document.getElementById('videoPreview').innerHTML = '';
        return;
    }

    document.getElementById('videoPreview').innerHTML =
        `<div class="file-preview-item" style="padding:16px;text-align:center;color:var(--text-secondary);">⏳ Загрузка видео...</div>`;

    try {
        const url = await uploadVideoToCloudinary(file);
        uploadedVideo = url;
        document.getElementById('videoPreview').innerHTML =
            `<div class="file-preview-item"><video src="${url}" controls style="width:100%;border-radius:8px;"></video><button type="button" class="file-preview-remove" onclick="removeVideo()">×</button></div>`;
    } catch (err) {
        uploadedVideo = null;
        document.getElementById('video').value = '';
        document.getElementById('videoPreview').innerHTML = '';
        tg.showAlert('Ошибка загрузки видео. Проверьте интернет и попробуйте ещё раз.');
    }
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
    const phoneError = validatePhone(phoneValue);
    if (phoneError) {
        tg.showAlert(phoneError);
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
    
    // ─── Проверка стоп-слов ───────────────────────────────────
    const _descVal = document.getElementById('description')?.value || '';
    const _titleVal = document.getElementById('partTitle')?.value || '';
    const _checkText = `${brandValue} ${modelValue} ${_descVal} ${_titleVal}`;
    const _banned = containsBannedWords(_checkText);
    if (_banned) {
        tg.showAlert('Объявление содержит запрещённые слова. Проверьте описание и исправьте текст.');
        unblockSubmit();
        return;
    }
    // ──────────────────────────────────────────────────────────

    // ═══════════════════════════════════════════════════════════
    // ЗАГРУЗКА ФОТО В CLOUDINARY
    // ═══════════════════════════════════════════════════════════
    let cloudinaryPhotos = [];
    
    if (uploadedPhotos.length > 0) {
        try {
            submitBtn.textContent = '📤 Загрузка фото...';

            const result = await uploadPhotosToCloudinary(uploadedPhotos, (current, total) => {
                submitBtn.textContent = `📤 Фото ${current}/${total}...`;
            });
            cloudinaryPhotos = result.urls;

            if (cloudinaryPhotos.length === 0) {
                throw new Error('Не удалось загрузить фото');
            }

            if (result.failedCount > 0) {
                tg.showAlert(`⚠️ ${result.failedCount} из ${uploadedPhotos.length} фото не загрузились. Объявление будет опубликовано с ${cloudinaryPhotos.length} фото.`);
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

            try {
                await pushCarToFirebase(carData);
            } catch(e) {
                cars = cars.filter(c => c.id !== carData.id);
                DB.saveCars(cars);
                unblockSubmit();
                tg.showAlert('Ошибка сохранения объявления. Проверьте соединение и попробуйте снова.');
                return;
            }

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
    ALL_PHOTOS:         40,  // добавил 6 фото при публикации
    VIDEO_ADDED:        40,  // добавил видео при публикации
    STREAK_7_DAYS:      25,  // открыл приложение 7 дней подряд
    BALANCE_TOPUP:      50,  // пополнил баланс
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

// ─── Уведомления по фильтру (платная функция) ─────────────────

const MAX_FILTERS = 5;
let currentEditingFilterKey = null;
let filterFormBrand = '';
let filterFormModel = '';
let filterFormCurrency = '$';

function openFiltersPage() {
    openPageWithLock('filtersPage');
    loadAndRenderFilterPage();
}

async function loadAndRenderFilterPage() {
    const content = document.getElementById('filtersPageContent');
    if (!content) return;
    content.innerHTML = '<div style="color:var(--text-secondary);text-align:center;padding:40px">Загрузка...</div>';
    try {
        const snapshot = await firebase.database().ref(`savedFilters/${currentUser.id}`).once('value');
        renderFiltersListPage(snapshot.val());
    } catch(e) {
        content.innerHTML = '<div style="color:var(--text-secondary);text-align:center;padding:40px">Ошибка загрузки</div>';
    }
}

function renderFiltersListPage(filtersObj) {
    const content = document.getElementById('filtersPageContent');
    if (!content) return;
    const now = new Date();
    const entries = filtersObj ? Object.entries(filtersObj).filter(([,f]) => f) : [];
    const activeCount = entries.filter(([,f]) => f.expiresAt && new Date(f.expiresAt) > now).length;

    // Обновляем статус в профиле
    const filtersStatus = document.getElementById('filtersStatus');
    if (filtersStatus) {
        if (activeCount > 0) {
            filtersStatus.textContent = `${activeCount} активн.`;
            filtersStatus.classList.add('active');
        } else {
            filtersStatus.textContent = entries.length > 0 ? 'Истекли' : 'Настроить';
            filtersStatus.classList.remove('active');
        }
    }

    let html = '';

    if (entries.length === 0) {
        html += `<div class="filters-empty">
            🔔 Нет настроенных фильтров.<br>
            Добавьте фильтр и получайте Telegram-уведомления когда появится нужное авто.
        </div>`;
    } else {
        entries.forEach(([key, f]) => {
            const isActive = f.expiresAt && new Date(f.expiresAt) > now;
            const statusText = isActive
                ? `🟢 До ${formatDate(f.expiresAt)}`
                : '🔴 Подписка истекла';
            const summary = buildFilterSummary(f);
            const name = buildFilterName(f);
            html += `<div class="filter-card" onclick="openEditFilter('${key}')">
                <div class="filter-card-info">
                    <div class="filter-card-name">${name}</div>
                    ${summary !== name ? `<div class="filter-card-params">${summary}</div>` : ''}
                    <div class="filter-card-meta">${statusText}</div>
                </div>
                <button class="filter-card-delete" onclick="event.stopPropagation();deleteFilter('${key}')">🗑</button>
            </div>`;
        });
    }

    if (entries.length < MAX_FILTERS) {
        html += `<button class="filter-add-btn" onclick="addNewFilter()">+ Добавить фильтр</button>`;
    } else {
        html += `<div style="text-align:center;font-size:13px;color:var(--text-secondary);margin-top:12px">Достигнут лимит ${MAX_FILTERS} фильтров</div>`;
    }

    content.innerHTML = html;
}

function openEditFilter(key) {
    currentEditingFilterKey = key;
    const content = document.getElementById('filtersPageContent');
    if (!content) return;
    content.innerHTML = '<div style="color:var(--text-secondary);text-align:center;padding:40px">Загрузка...</div>';
    firebase.database().ref(`savedFilters/${currentUser.id}/${key}`).once('value')
        .then(snap => renderFilterPage(snap.val(), key))
        .catch(() => {
            content.innerHTML = '<div style="color:var(--text-secondary);text-align:center;padding:40px">Ошибка загрузки</div>';
        });
}

function addNewFilter() {
    firebase.database().ref(`savedFilters/${currentUser.id}`).once('value').then(snap => {
        const existing = snap.val();
        const count = existing ? Object.keys(existing).filter(k => existing[k]).length : 0;
        if (count >= MAX_FILTERS) {
            tg.showAlert(`Максимум ${MAX_FILTERS} фильтров на аккаунт`);
            return;
        }
        const key = `f_${Date.now()}`;
        currentEditingFilterKey = key;
        renderFilterPage(null, key);
    });
}

async function deleteFilter(key) {
    try {
        tg.showPopup({
            title: 'Удалить фильтр?',
            message: 'Уведомления по этому фильтру прекратятся.',
            buttons: [
                {id: 'yes', type: 'destructive', text: 'Удалить'},
                {id: 'no',  type: 'cancel',      text: 'Отмена'}
            ]
        }, async (btn) => {
            if (btn !== 'yes') return;
            await firebase.database().ref(`savedFilters/${currentUser.id}/${key}`).remove();
            loadAndRenderFilterPage();
        });
    } catch(e) {
        if (confirm('Удалить фильтр?')) {
            await firebase.database().ref(`savedFilters/${currentUser.id}/${key}`).remove();
            loadAndRenderFilterPage();
        }
    }
}

function renderFilterPage(f, key) {
    if (key) currentEditingFilterKey = key;
    const content = document.getElementById('filtersPageContent');
    const now = new Date();
    const isActive = f && f.expiresAt && new Date(f.expiresAt) > now;

    // Инициализируем состояние формы из существующего фильтра
    filterFormBrand    = f?.brand || '';
    filterFormModel    = f?.model || '';
    filterFormCurrency = f?.priceCurrency || '$';

    const backBtn = `<button onclick="loadAndRenderFilterPage()" style="background:none;border:none;color:var(--primary);font-size:14px;padding:0;margin-bottom:12px;cursor:pointer;">← К списку фильтров</button>`;

    const statusHtml = isActive
        ? `<div class="filter-status-card">
               <div class="filter-status-active">🟢 Активна до ${formatDate(f.expiresAt)}</div>
               ${f.lastNotifiedAt && f.lastNotifiedAt !== f.createdAt
                   ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:4px">Уведомление: ${formatDate(f.lastNotifiedAt)}</div>`
                   : ''}
           </div>`
        : `<div class="filters-empty" style="margin-bottom:8px">
               🔔 Настройте фильтр и запустите уведомления.<br>
               Telegram-сообщение придёт когда появится подходящее объявление.
           </div>`;

    const brandBtnText  = filterFormBrand  ? `${filterFormBrand} <span class="filter-clear-x" onclick="event.stopPropagation();clearFilterBrand()">×</span>`  : 'Любая ›';
    const modelBtnText  = filterFormModel  ? `${filterFormModel} <span class="filter-clear-x" onclick="event.stopPropagation();clearFilterModel()">×</span>`  : (filterFormBrand ? 'Любая ›' : 'Сначала выберите марку');
    const modelDisabled = filterFormBrand  ? '' : 'disabled';

    const formHtml = `
        <div class="filter-form-inline">
            <div class="filter-form-row">
                <label class="filter-form-label">Категория</label>
                <select id="filterCategory" class="filter-form-select">
                    <option value="" ${!f?.category?'selected':''}>Любая</option>
                    <option value="car"     ${ f?.category==='car'    ?'selected':''}>Легковые</option>
                    <option value="truck"   ${ f?.category==='truck'  ?'selected':''}>Грузовые</option>
                    <option value="moto"    ${ f?.category==='moto'   ?'selected':''}>Мото</option>
                    <option value="special" ${ f?.category==='special'?'selected':''}>Спецтехника</option>
                    <option value="parts"   ${ f?.category==='parts'  ?'selected':''}>Запчасти</option>
                    <option value="boat"    ${ f?.category==='boat'   ?'selected':''}>Водный транспорт</option>
                </select>
            </div>
            <div class="filter-form-row">
                <label class="filter-form-label">Марка</label>
                <button id="filterBrandBtn" class="filter-picker-btn" onclick="openFilterBrandPicker()">${brandBtnText}</button>
            </div>
            <div class="filter-form-row">
                <label class="filter-form-label">Модель</label>
                <button id="filterModelBtn" class="filter-picker-btn" ${modelDisabled} onclick="openFilterModelPicker()">${modelBtnText}</button>
            </div>
            <div class="filter-form-row filter-form-row-2">
                <div>
                    <label class="filter-form-label">Год от</label>
                    <input id="filterYearFrom" type="number" class="filter-form-input" placeholder="2010" value="${f?.yearFrom || ''}">
                </div>
                <div>
                    <label class="filter-form-label">Год до</label>
                    <input id="filterYearTo" type="number" class="filter-form-input" placeholder="2024" value="${f?.yearTo || ''}">
                </div>
            </div>
            <div class="filter-form-row">
                <label class="filter-form-label">Валюта цены</label>
                <div class="filter-currency-row">
                    <button class="filter-currency-btn ${filterFormCurrency==='$'?'active':''}" data-currency="$" onclick="setFilterCurrency('$')">$ USD</button>
                    <button class="filter-currency-btn ${filterFormCurrency==='€'?'active':''}" data-currency="€" onclick="setFilterCurrency('€')">€ EUR</button>
                    <button class="filter-currency-btn ${filterFormCurrency==='руб'?'active':''}" data-currency="руб" onclick="setFilterCurrency('руб')">₽ RUB</button>
                </div>
            </div>
            <div class="filter-form-row filter-form-row-2">
                <div>
                    <label class="filter-form-label">Цена от</label>
                    <input id="filterPriceFrom" type="number" class="filter-form-input" placeholder="0" value="${f?.priceFrom || ''}">
                </div>
                <div>
                    <label class="filter-form-label">Цена до</label>
                    <input id="filterPriceTo" type="number" class="filter-form-input" placeholder="10000" value="${f?.priceTo || ''}">
                </div>
            </div>
            <div class="filter-form-row">
                <label class="filter-form-label">Город</label>
                <input id="filterCity" type="text" class="filter-form-input" placeholder="Тирасполь" value="${f?.city || ''}">
            </div>
        </div>`;

    const actionsHtml = isActive
        ? `<button class="filter-save-btn" onclick="saveFilterOnly()">Сохранить изменения</button>
           <button class="filter-renew-btn" onclick="renewFilterSub()">🔄 Продлить подписку</button>`
        : `<div style="text-align:center;font-size:12px;color:var(--text-secondary);margin:12px 0 8px">Баланс: ${currentUser.balance || 0} руб</div>
           <div class="filter-plan-card" onclick="buyAndSaveFilter(3, 50)">
               <div class="filter-plan-price">50 руб</div>
               <div class="filter-plan-period">Запустить на 3 дня</div>
           </div>
           <div class="filter-plan-card filter-plan-card--best" onclick="buyAndSaveFilter(30, 200)">
               <div class="filter-plan-badge">Выгоднее</div>
               <div class="filter-plan-price">200 руб</div>
               <div class="filter-plan-period">Запустить на 30 дней</div>
           </div>`;

    content.innerHTML = backBtn + statusHtml + formHtml + actionsHtml;
}

function buildFilterName(f) {
    const parts = [];
    if (f.brand) parts.push(f.brand);
    if (f.model) parts.push(f.model);
    if (!parts.length && f.category) parts.push(categoryNames[f.category] || f.category);
    return parts.join(' ') || 'Все объявления';
}

function buildFilterSummary(f) {
    const parts = [];
    if (f.category) parts.push(categoryNames[f.category] || f.category);
    if (f.brand) parts.push(f.brand);
    if (f.model) parts.push(f.model);
    if (f.yearFrom || f.yearTo) parts.push(`${f.yearFrom || '?'}–${f.yearTo || '?'} г.`);
    if (f.priceFrom || f.priceTo) parts.push(`${fmt(f.priceFrom || 0)}–${f.priceTo ? fmt(f.priceTo) : '∞'} ${f.priceCurrency || ''}`);
    if (f.city) parts.push(`📍 ${f.city}`);
    return parts.join(' · ') || 'Все объявления';
}

function getFilterFormData() {
    return {
        category:      document.getElementById('filterCategory')?.value || '',
        brand:         filterFormBrand,
        model:         filterFormModel,
        yearFrom:      Number(document.getElementById('filterYearFrom')?.value) || 0,
        yearTo:        Number(document.getElementById('filterYearTo')?.value) || 0,
        priceFrom:     Number(document.getElementById('filterPriceFrom')?.value) || 0,
        priceTo:       Number(document.getElementById('filterPriceTo')?.value) || 0,
        priceCurrency: filterFormCurrency,
        city:          document.getElementById('filterCity')?.value.trim() || '',
    };
}

// ─── Пикеры марки и модели для фильтра ───────────────────────

function openFilterBrandPicker() {
    const cat = document.getElementById('filterCategory')?.value || '';
    const actualCat = (!cat || cat === 'parts') ? 'car' : cat;
    const brands = Object.keys(BRANDS_DATA[actualCat] || {}).sort();
    const list = document.getElementById('filterBrandList');
    if (!list) return;
    list.innerHTML = brands.map(b =>
        `<div class="brand-option ${filterFormBrand === b ? 'selected' : ''}" onclick="selectFilterBrand('${b.replace(/'/g,"\\'")}')"> ${b}</div>`
    ).join('');
    document.getElementById('filterBrandPickerModal').style.display = 'flex';
}

function closeFilterBrandPicker() {
    document.getElementById('filterBrandPickerModal').style.display = 'none';
}

function selectFilterBrand(brand) {
    filterFormBrand = brand;
    filterFormModel = '';
    closeFilterBrandPicker();
    const btn = document.getElementById('filterBrandBtn');
    if (btn) btn.innerHTML = `${brand} <span class="filter-clear-x" onclick="event.stopPropagation();clearFilterBrand()">×</span>`;
    const modelBtn = document.getElementById('filterModelBtn');
    if (modelBtn) { modelBtn.textContent = 'Любая ›'; modelBtn.disabled = false; }
}

function clearFilterBrand() {
    filterFormBrand = ''; filterFormModel = '';
    const btn = document.getElementById('filterBrandBtn');
    if (btn) btn.textContent = 'Любая ›';
    const modelBtn = document.getElementById('filterModelBtn');
    if (modelBtn) { modelBtn.textContent = 'Сначала выберите марку'; modelBtn.disabled = true; }
}

function openFilterModelPicker() {
    if (!filterFormBrand) { tg.showAlert('Сначала выберите марку'); return; }
    const cat = document.getElementById('filterCategory')?.value || '';
    const actualCat = (!cat || cat === 'parts') ? 'car' : cat;
    const brandData = BRANDS_DATA[actualCat]?.[filterFormBrand];
    const models = brandData ? (Array.isArray(brandData) ? brandData : Object.keys(brandData)) : [];
    const list = document.getElementById('filterModelList');
    if (!list) return;
    list.innerHTML = models.sort().map(m =>
        `<div class="brand-option ${filterFormModel === m ? 'selected' : ''}" onclick="selectFilterModel('${m.replace(/'/g,"\\'")}')"> ${m}</div>`
    ).join('');
    document.getElementById('filterModelPickerModal').style.display = 'flex';
}

function closeFilterModelPicker() {
    document.getElementById('filterModelPickerModal').style.display = 'none';
}

function selectFilterModel(model) {
    filterFormModel = model;
    closeFilterModelPicker();
    const btn = document.getElementById('filterModelBtn');
    if (btn) btn.innerHTML = `${model} <span class="filter-clear-x" onclick="event.stopPropagation();clearFilterModel()">×</span>`;
}

function clearFilterModel() {
    filterFormModel = '';
    const btn = document.getElementById('filterModelBtn');
    if (btn) btn.textContent = 'Любая ›';
}

function setFilterCurrency(c) {
    filterFormCurrency = c;
    document.querySelectorAll('.filter-currency-btn').forEach(btn =>
        btn.classList.toggle('active', btn.dataset.currency === c)
    );
}

// ─── Сохранение и покупка ─────────────────────────────────────

async function buyAndSaveFilter(days, price) {
    const params = getFilterFormData();
    if (!params.category && !params.brand && !params.city && !params.priceFrom && !params.priceTo && !params.yearFrom && !params.yearTo) {
        tg.showAlert('Укажите хотя бы одно условие фильтра перед запуском');
        return;
    }
    if (!deductBalance(price, 'filter_sub', {days, price})) return;

    const filterKey = currentEditingFilterKey;
    if (!filterKey) { tg.showAlert('Ошибка: фильтр не выбран'); return; }

    const now = new Date();
    let snapshot;
    try { snapshot = await firebase.database().ref(`savedFilters/${currentUser.id}/${filterKey}`).once('value'); } catch(e) {}
    const existing = snapshot?.val();

    // Проверяем лимит только для новых фильтров
    if (!existing) {
        let allSnap;
        try { allSnap = await firebase.database().ref(`savedFilters/${currentUser.id}`).once('value'); } catch(e) {}
        const allFilters = allSnap?.val();
        const count = allFilters ? Object.keys(allFilters).filter(k => allFilters[k]).length : 0;
        if (count >= MAX_FILTERS) {
            currentUser.balance = (currentUser.balance || 0) + price;
            saveUser();
            tg.showAlert(`Максимум ${MAX_FILTERS} фильтров на аккаунт`);
            return;
        }
    }
    const currentExpiry = existing?.expiresAt && new Date(existing.expiresAt) > now
        ? new Date(existing.expiresAt) : now;
    const expiresAt = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

    const filterData = {
        ...params,
        active: true,
        expiresAt,
        createdAt: existing?.createdAt || now.toISOString(),
        lastNotifiedAt: now.toISOString(),
    };
    try {
        await firebase.database().ref(`savedFilters/${currentUser.id}/${filterKey}`).set(filterData);
        saveUser();
        loadAndRenderFilterPage();
        tg.showAlert(`✅ Запущено на ${days} дней!\nФильтр: ${buildFilterName(params)}\nДо: ${formatDate(expiresAt)}`);
    } catch(e) {
        currentUser.balance = (currentUser.balance || 0) + price;
        saveUser();
        tg.showAlert('Ошибка. Попробуйте ещё раз.');
    }
}

async function saveFilterOnly() {
    const filterKey = currentEditingFilterKey;
    if (!filterKey) { tg.showAlert('Ошибка: фильтр не выбран'); return; }
    const params = getFilterFormData();
    try {
        await firebase.database().ref(`savedFilters/${currentUser.id}/${filterKey}`).update(params);
        loadAndRenderFilterPage();
        tg.showAlert(`✅ Фильтр сохранён: ${buildFilterName(params)}`);
    } catch(e) {
        tg.showAlert('Ошибка сохранения. Попробуйте ещё раз.');
    }
}

function renewFilterSub() {
    try {
        tg.showPopup({
            title: '🔄 Продлить подписку',
            message: `Баланс: ${currentUser.balance || 0} руб`,
            buttons: [
                {id: '3',  type: 'default', text: '50 руб — 3 дня'},
                {id: '30', type: 'default', text: '200 руб — 30 дней'},
                {id: 'cancel', type: 'cancel', text: 'Отмена'}
            ]
        }, async (btn) => {
            if (btn === '3')  await buyAndSaveFilter(3, 50);
            if (btn === '30') await buyAndSaveFilter(30, 200);
        });
    } catch(e) {
        buyAndSaveFilter(3, 50);
    }
}

function openTopUp() {
    try {
        tg.showPopup({
            title: '💳 Пополнение баланса',
            message: `Текущий баланс: ${currentUser.balance || 0} руб\n\nДля пополнения напишите администратору — он зачислит рубли на ваш счёт.\n\nВаш Telegram ID: ${currentUser.id}`,
            buttons: [
                {id: 'write', type: 'default', text: '✍️ Написать администратору'},
                {id: 'cancel', type: 'cancel', text: 'Отмена'}
            ]
        }, (buttonId) => {
            if (buttonId === 'write') {
                tg.openTelegramLink(`https://t.me/Evgenii_Ar?text=${encodeURIComponent(`Хочу пополнить баланс AutoMarket\nМой ID: ${currentUser.id}`)}`);
            }
        });
    } catch(e) {
        tg.openTelegramLink(`https://t.me/Evgenii_Ar?text=${encodeURIComponent(`Хочу пополнить баланс AutoMarket\nМой ID: ${currentUser.id}`)}`);
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
        tg.showAlert('Это объявление уже поднимается автоматически каждые 6 часов');
        return;
    }
    
    const isFree = canFreeBoost();
    
    if (paid || !isFree) {
        // Платное поднятие
        const cost = 15;
        if (!hasBalance(cost)) {
            tg.showPopup({
                title: 'Недостаточно средств',
                message: `Стоимость поднятия: ${cost} руб\nВаш баланс: ${currentUser.balance} руб\n\nПополнить баланс?`,
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
        tg.showAlert('Объявление поднято! (-15 руб)\n+15 очков рейтинга');
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
    return pts >= 300; // достаточно очков для покупки
}

// Активировать временный Топ для объявления (24ч)
function activateTempTop(carId, skipConfirm = false) {
    carId = Number(carId);
    
    // Проверка уровня — защита от прямого вызова в обход canUseTempTop()
    // skipConfirm=true означает вызов из buyTempTop (очки уже проверены и списаны)
    if (!skipConfirm && !canUseTempTop()) {
        tg.showAlert('Недостаточно очков.\nНужно: 300 · У вас: ' + (currentUser.ratingPoints || 0));
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
    // Чистим истёкшие подсветки на объявлениях
    cars = cars.map(car => {
        if (car.highlightExpiresAt && new Date(car.highlightExpiresAt) <= now) {
            delete car.highlightExpiresAt;
            pushCarToFirebase(car);
            changed = true;
        }
        // Чистим истёкшие закрепы в поиске
        if (car.searchPinExpiresAt && new Date(car.searchPinExpiresAt) <= now) {
            delete car.searchPinExpiresAt;
            pushCarToFirebase(car);
            changed = true;
        }
        return car;
    });
}

// ─── РОТАЦИЯ ТОПА ─────────────────────────────────────────────────────────────
const TOP_ROTATION_INTERVAL = 6 * 60 * 60 * 1000; // 6 часов в мс
const TOP_ROTATION_COUNT    = 10;

// Условия попадания в ротацию: 3+ фото + описание ≥ 30 символов + не платный ТОП
function isEligibleForRotation(car) {
    return Array.isArray(car.photos) && car.photos.length >= 3
        && typeof car.description === 'string' && car.description.length >= 30
        && !car.isTop;
}

// Выбрать 10 случайных подходящих объявлений и сохранить в Firebase
function runTopRotation() {
    if (!_fbDb) return;
    const eligible = cars.filter(isEligibleForRotation);
    // Перемешиваем (Fisher-Yates)
    for (let i = eligible.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
    }
    const selected = eligible.slice(0, TOP_ROTATION_COUNT).map(c => c.id);
    const nextRotationAt = new Date(Date.now() + TOP_ROTATION_INTERVAL).toISOString();
    topRotationIds = selected;
    firebase.database().ref('topRotation').set({ ids: selected, nextRotationAt })
        .catch(e => console.warn('topRotation save error:', e));
    render();
}

// Подписаться на ротацию из Firebase; обновить при истечении
function loadTopRotation() {
    if (!_fbDb) return;
    firebase.database().ref('topRotation').on('value', (snap) => {
        const data = snap.val();
        const now = new Date();
        if (!data || !data.nextRotationAt || new Date(data.nextRotationAt) <= now) {
            runTopRotation();
        } else {
            // Восстанавливаем актуальные IDs (Firebase может хранить как объект)
            topRotationIds = Array.isArray(data.ids) ? data.ids : Object.values(data.ids || {});
            render();
        }
    });
    // Раз в час проверяем — вдруг никто не открывал приложение дольше 6 часов
    setInterval(() => {
        if (!_fbDb) return;
        firebase.database().ref('topRotation').once('value').then(snap => {
            const data = snap.val();
            if (!data || !data.nextRotationAt || new Date(data.nextRotationAt) <= new Date()) {
                runTopRotation();
            }
        });
    }, 60 * 60 * 1000);
}
// ──────────────────────────────────────────────────────────────────────────────

// Вспомогательная: время до истечения
function getTimeLeft(isoDate) {
    const diff = new Date(isoDate) - new Date();
    if (diff <= 0) return '0ч';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}ч ${m}м` : `${m}м`;
}

function openAutoBoostModal() {
    // Открыть выбор объявления для автоподнятия из панели Premium
    const myListings = cars.filter(c => String(c.userId) === String(currentUser.id));
    if (!myListings.length) {
        tg.showAlert('У вас нет активных объявлений');
        return;
    }
    if (myListings.length === 1) {
        activateAutoBoost(myListings[0].id);
        return;
    }
    const buttons = myListings.slice(0, 5).map(c => ({
        id: String(c.id),
        type: 'default',
        text: `${(c.partTitle || c.brand + ' ' + (c.model||'')).trim()} · ${fmt(c.price)} ${c.currency}`.substring(0, 40)
    }));
    buttons.push({id: 'cancel', type: 'cancel', text: 'Отмена'});
    try {
        tg.showPopup({
            title: '🤖 Выберите объявление',
            message: 'Для какого объявления активировать автоподнятие?',
            buttons
        }, (btn) => {
            if (btn === 'cancel' || !btn) return;
            activateAutoBoost(Number(btn));
        });
    } catch(e) {
        const titles = myListings.slice(0, 5).map((c, i) =>
            `${i+1}. ${(c.partTitle || c.brand + ' ' + (c.model||'')).trim()}`).join('\n');
        const idx = parseInt(prompt(`Выберите номер:\n${titles}`)) - 1;
        if (idx >= 0 && idx < myListings.length) activateAutoBoost(myListings[idx].id);
    }
}

function activateAutoBoost(carId) {
    carId = Number(carId);
    const car = cars.find(c => c.id === carId);
    if (!car) return;

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
    if (currentUser.subscriptions.autoBoost.active && carIds.includes(carId)) {
        manageAutoBoost(carId);
        return;
    }

    const carTitle = (car.partTitle || `${car.brand} ${car.model} ${car.year || ''}`).trim();

    // Выбор тарифа
    tg.showPopup({
        title: '🤖 Автоподнятие',
        message: `Объявление: ${carTitle}\n\n✓ Поднятие каждые 6 часов с момента публикации\n✓ Бесплатное ручное поднятие сохраняется\n\nВыберите срок:\nВаш баланс: ${currentUser.balance || 0} руб`,
        buttons: [
            {id: '3d',     type: 'default', text: '3 дня — 50 руб'},
            {id: '10d',    type: 'default', text: '10 дней — 120 руб'},
            {id: 'cancel', type: 'cancel',  text: 'Отмена'}
        ]
    }, (btnId) => {
        if (btnId === 'cancel' || !btnId) return;
        const cost     = btnId === '3d' ? 50 : 120;
        const days     = btnId === '3d' ? 3  : 10;

        if (!hasBalance(cost)) {
            tg.showPopup({
                title: 'Недостаточно средств',
                message: `Стоимость: ${cost} руб\nВаш баланс: ${currentUser.balance || 0} руб\n\nПополнить баланс?`,
                buttons: [
                    {id: 'topup',  type: 'default', text: 'Пополнить'},
                    {id: 'cancel', type: 'cancel',  text: 'Отмена'}
                ]
            }, (b) => { if (b === 'topup') openTopUp(); });
            return;
        }

        if (!deductBalance(cost, 'autoboost', {carId, title: carTitle})) return;

        const expiresAt = new Date(Date.now() + days * 24 * 3600000).toISOString();

        currentUser.subscriptions.autoBoost.active = true;
        if (!currentUser.subscriptions.autoBoost.carIds.map(Number).includes(carId)) {
            currentUser.subscriptions.autoBoost.carIds.push(carId);
        }
        currentUser.subscriptions.autoBoost.cars[carId] = {
            activatedAt: new Date().toISOString(),
            expiresAt
        };

        saveUser();
        renderMyListings();
        renderProfile();
        updatePremiumStatus();

        const expStr = new Date(expiresAt).toLocaleDateString('ru-RU');
        tg.showAlert(`✅ Автоподнятие активировано!\n${carTitle}\nАктивно до: ${expStr}\nОстаток: ${currentUser.balance} руб`);
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
        message: `${carTitle}\n\n✅ Статус: активно\n📅 Активно до: ${expiresStr}\n\nПоднимается каждые 6 часов автоматически`,
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

// ─── ЗАКРЕП В РЕЗУЛЬТАТАХ ПОИСКА ─────────────────────────────────────────────
function buySearchPin() {
    if (!currentUser) { alert('Ошибка: пользователь не загружен'); return; }
    const COST = 50;
    const myListings = cars.filter(c => String(c.userId) === String(currentUser.id));

    if (!myListings.length) {
        tg.showAlert('У вас нет активных объявлений');
        return;
    }
    if ((currentUser.balance || 0) < COST) {
        try {
            tg.showPopup({
                title: 'Недостаточно средств',
                message: `Стоимость: ${COST} руб\nВаш баланс: ${currentUser.balance || 0} руб\n\nПополнить баланс?`,
                buttons: [
                    {id: 'topup',  type: 'default', text: 'Пополнить'},
                    {id: 'cancel', type: 'cancel',  text: 'Отмена'}
                ]
            }, (b) => { if (b === 'topup') openTopUp(); });
        } catch(e) {
            if (confirm(`Недостаточно средств (${COST} руб).\nПополнить баланс?`)) openTopUp();
        }
        return;
    }
    if (myListings.length === 1) {
        _doSearchPin(myListings[0].id, COST);
        return;
    }
    // Несколько объявлений — выбор через popup
    try {
        const buttons = myListings.slice(0, 5).map(c => ({
            id: String(c.id),
            type: 'default',
            text: `${(c.partTitle || c.brand + ' ' + (c.model||'')).trim()} · ${fmt(c.price)} ${c.currency}`.substring(0, 40)
        }));
        buttons.push({id: 'cancel', type: 'cancel', text: 'Отмена'});
        tg.showPopup({
            title: '📌 Закреп в поиске',
            message: `${COST} руб / 48 часов\nВыберите объявление:`,
            buttons
        }, (btn) => {
            if (btn === 'cancel' || !btn) return;
            _doSearchPin(Number(btn), COST);
        });
    } catch(e) {
        // Fallback для браузера
        const titles = myListings.slice(0, 5).map((c, i) =>
            `${i+1}. ${(c.partTitle || c.brand + ' ' + (c.model||'')).trim()}`).join('\n');
        const idx = parseInt(prompt(`Выберите номер объявления:\n${titles}`)) - 1;
        if (idx >= 0 && idx < myListings.length) _doSearchPin(myListings[idx].id, COST);
    }
}

function _doSearchPin(carId, cost) {
    if (!currentUser) return;
    const car = cars.find(c => c.id === carId);
    if (!car) return;
    const carTitle = (car.partTitle || `${car.brand} ${car.model}`).trim();

    const doPin = () => {
        if (!deductBalance(cost, 'searchpin', {carId, title: carTitle})) return;
        const expiresAt = new Date(Date.now() + 48 * 3600000).toISOString();
        const carIdx = cars.findIndex(c => c.id === carId);
        if (carIdx !== -1) {
            cars[carIdx].searchPinExpiresAt = expiresAt;
            pushCarToFirebase(cars[carIdx]);
            DB.saveCars(cars);
        }
        render();
        updatePremiumStatus();
        const expStr = new Date(expiresAt).toLocaleString('ru-RU', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
        tg.showAlert(`✅ Закреплено до ${expStr}!\nОстаток: ${currentUser.balance} руб`);
    };

    try {
        tg.showPopup({
            title: '📌 Закреп в поиске',
            message: `«${carTitle}»\n\n✓ Первым в ленте на 48 часов\n✓ Стоимость: ${cost} руб\nБаланс после: ${(currentUser.balance||0) - cost} руб`,
            buttons: [
                {id: 'yes',    type: 'default', text: `Купить за ${cost} руб`},
                {id: 'cancel', type: 'cancel',  text: 'Отмена'}
            ]
        }, (btn) => { if (btn === 'yes') doPin(); });
    } catch(e) {
        if (confirm(`«${carTitle}»\n\nЗакрепить в поиске на 48 часов за ${cost} руб?`)) doPin();
    }
}
// ──────────────────────────────────────────────────────────────────────────────

// ─── АВТОВЫПОЛНЕНИЕ АВТОПОДНЯТИЯ ─────────────────────────────────────────────
function checkAndRunAutoBoosts() {
    if (!currentUser?.subscriptions?.autoBoost?.active) return;
    const now = new Date();
    const SIX_HOURS = 6 * 3600000;
    const carIds = normalizeFirebaseArray(currentUser.subscriptions.autoBoost.carIds).map(Number);
    let changed = false;
    carIds.forEach(carId => {
        const carBoost = currentUser.subscriptions.autoBoost.cars?.[carId];
        // Подписка истекла — отключаем
        if (!carBoost?.expiresAt || new Date(carBoost.expiresAt) <= now) {
            disableAutoBoost(carId);
            return;
        }
        const car = cars.find(c => c.id === carId);
        if (!car) return;
        const lastAction = car.lastBoosted || car.createdAt;
        if (now - new Date(lastAction) >= SIX_HOURS) {
            performBoost(car);
            const idx = cars.findIndex(c => c.id === carId);
            if (idx !== -1) cars[idx] = car;
            pushCarToFirebase(car);
            changed = true;
        }
    });
    if (changed) { DB.saveCars(cars); render(); }
}
// ──────────────────────────────────────────────────────────────────────────────

// Обновить статусы в панели Premium
function updatePremiumStatus() {
    // Автоподнятие
    const abEl = document.getElementById('autoBoostStatus');
    if (abEl) {
        const carIds = normalizeFirebaseArray(currentUser.subscriptions?.autoBoost?.carIds).map(Number);
        const isActive = currentUser.subscriptions?.autoBoost?.active && carIds.length > 0;
        abEl.textContent = isActive ? `Активна (${carIds.length} объявл.)` : 'Неактивна';
        abEl.classList.toggle('active', isActive);
    }
    // Закреп в поиске
    const spEl = document.getElementById('searchPinStatus');
    if (spEl) {
        const pinned = cars.find(c => String(c.userId) === String(currentUser.id)
            && c.searchPinExpiresAt && new Date(c.searchPinExpiresAt) > new Date());
        if (pinned) {
            spEl.textContent = `Активен · ${getTimeLeft(pinned.searchPinExpiresAt)}`;
            spEl.classList.add('active');
        } else {
            spEl.textContent = 'Неактивна';
            spEl.classList.remove('active');
        }
    }
}
// ──────────────────────────────────────────────────────────────────────────────

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

    // Статус выделения: ищем объявление пользователя с активной подсветкой
    const highlightedCar = cars.find(c => String(c.userId) === String(currentUser.id)
        && c.highlightExpiresAt && new Date(c.highlightExpiresAt) > new Date());
    const highlightActive = !!highlightedCar;
    const highlightLeft   = highlightActive ? getTimeLeft(highlightedCar.highlightExpiresAt) : null;

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
            cost: 300,
            active: tempTopActive,
            activeLabel: tempTopLeft ? `Активно · осталось ${tempTopLeft}` : 'Активно',
            action: "buyTempTop()"
        },
        {
            id: 'highlight',
            icon: '🏷️',
            title: 'Выделение объявления на 24 часа',
            desc: 'Цветная рамка и подсветка карточки в ленте. Выделяется среди обычных объявлений.',
            cost: 250,
            active: highlightActive,
            activeLabel: highlightLeft ? `Активно · осталось ${highlightLeft}` : 'Активно',
            action: "buyHighlight()"
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
    const COST = 300;
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

// ─── ВЫДЕЛЕНИЕ ОБЪЯВЛЕНИЯ ─────────────────────────────────────────────────────
function activateHighlight(carId, skipConfirm = false) {
    const COST = 250;
    if (!skipConfirm && (currentUser.ratingPoints || 0) < COST) {
        tg.showAlert(`Недостаточно очков.\nНужно: ${COST} · У вас: ${currentUser.ratingPoints || 0}`);
        return;
    }
    const carIdx = cars.findIndex(c => c.id === carId);
    if (carIdx === -1) return;
    const expiresAt = new Date(Date.now() + 24 * 3600000).toISOString();
    cars[carIdx].highlightExpiresAt = expiresAt;
    pushCarToFirebase(cars[carIdx]);
    DB.saveCars(cars);
    render();
    const expStr = new Date(expiresAt).toLocaleString('ru-RU', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
    tg.showAlert(`✅ Объявление выделено до ${expStr}!\nОстаток очков: ${currentUser.ratingPoints}`);
    renderAchievements();
    renderRatingLevel();
}

function buyHighlight() {
    const pts = currentUser.ratingPoints || 0;
    const COST = 250;
    const myListings = cars.filter(c => String(c.userId) === String(currentUser.id));

    if (!myListings.length) {
        tg.showAlert('У вас нет активных объявлений');
        return;
    }
    if (pts < COST) {
        tg.showAlert(`Недостаточно очков.\nНужно: ${COST} · У вас: ${pts}`);
        return;
    }

    const doActivate = (carId) => {
        currentUser.ratingPoints -= COST;
        saveUser();
        activateHighlight(carId, true);
    };

    if (myListings.length === 1) {
        const car = myListings[0];
        const title = (car.partTitle || `${car.brand} ${car.model}`).trim();
        tg.showPopup({
            title: '🏷️ Выделение объявления',
            message: `Списать ${COST} очков?\n\n«${title}»\n✓ Цветная рамка на 24 часа\n✓ Ваш баланс после: ${pts - COST} очков`,
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
        title: '🏷️ Выберите объявление',
        message: `Стоимость: ${COST} очков · Срок: 24 часа\nВаш баланс после: ${pts - COST} очков`,
        buttons
    }, (btn) => {
        if (btn === 'cancel' || !btn) return;
        doActivate(Number(btn));
    });
}
// ──────────────────────────────────────────────────────────────────────────────

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

    // Статус фильтров уведомлений
    const filtersStatusEl = document.getElementById('filtersStatus');
    if (filtersStatusEl) {
        firebase.database().ref(`savedFilters/${currentUser.id}`).once('value').then(snap => {
            const filtersObj = snap.val();
            const now = new Date();
            const entries = filtersObj ? Object.values(filtersObj).filter(Boolean) : [];
            const activeCount = entries.filter(f => f.expiresAt && new Date(f.expiresAt) > now).length;
            if (activeCount > 0) {
                filtersStatusEl.textContent = `${activeCount} активн.`;
                filtersStatusEl.classList.add('active');
            } else {
                filtersStatusEl.textContent = entries.length > 0 ? 'Истекли' : 'Настроить';
                filtersStatusEl.classList.remove('active');
            }
        }).catch(() => {});
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
            autoBoostButton = `<button class="my-listing-autoboost-add" onclick="event.stopPropagation(); activateAutoBoost(${car.id})">➕ Автоподнятие — от 50 руб</button>`;
        }
        
        // Кнопка ручного поднятия
        if (isFree) {
            boostButton = `<button class="my-listing-boost free" onclick="event.stopPropagation(); boostListing(${car.id})">⬆️ Поднять бесплатно</button>`;
        } else if (nextFree) {
            boostButton = `<button class="my-listing-boost paid" onclick="event.stopPropagation(); boostListing(${car.id}, true)">⬆️ Поднять — 15 руб</button>
                          <div class="boost-timer">Бесплатно через ${nextFree}</div>`;
        } else {
            boostButton = `<button class="my-listing-boost paid" onclick="event.stopPropagation(); boostListing(${car.id}, true)">⬆️ Поднять — 15 руб</button>`;
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
                    <div class="my-listing-title">${car.category === 'parts' ? (esc(car.partTitle) || esc(car.partType) || esc(car.brand)) : esc(car.brand) + ' ' + esc(car.model) + ' ' + esc(car.year || '')}</div>
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

    if (currentEditField === 'phone') {
        const phoneError = validatePhone(value);
        if (phoneError) {
            tg.showAlert(phoneError);
            return;
        }
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
        infoEl.innerHTML = `✅ <b>${name}</b> · Баланс: ${user.balance || 0} руб`;
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
    if (String(telegramId) === String(currentUser.telegramId)) { showErr('Нельзя переводить самому себе'); return; }
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
${recipientName} получил ${amount} руб.
Новый баланс: ${newBalance} руб`);

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
                <span class="admin-history-amount">+${t.amount} руб</span>
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
    document.getElementById('formModel').value = formSelectedModel;
    document.getElementById('formModelInput').value = formSelectedModel;
    closeFormModelModal();
}

function closeFormModelModal() {
    document.getElementById('formModelModal').classList.remove('show');
}


document.getElementById('searchInput').addEventListener('input', function(e) {
    filters.search = e.target.value.toLowerCase();
    render();
});

// Инициализация приложения — ждём загрузку пользователя перед рендером
(async () => {
    // Динамически устанавливаем максимальный год (текущий год)
    const currentYear = new Date().getFullYear();
    ['year', 'yearFrom', 'yearTo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.max = currentYear;
    });

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

    // Авторизуемся через Telegram initData → Cloudflare Worker → Firebase Custom Token
    // Должно быть ДО initUser, который пишет в /users
    await signInToFirebase();

    await initUser();

    // Подключаемся к Firebase WebSocket — ждём первую загрузку данных
    await syncFromFirebase();
    // После этого syncFromFirebase продолжает слушать изменения в реальном времени
    // setInterval больше не нужен — WebSocket сам пушит обновления

    // Запускаем ротацию Топа (каждые 6ч — 10 случайных объявлений с 6 фото + видео + описание ≥50)
    loadTopRotation();

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

    // Если приложение открыто по deep link на конкретное объявление
    const startParam = tg.initDataUnsafe?.start_param;
    if (startParam && startParam.startsWith('listing_')) {
        const targetId = Number(startParam.replace('listing_', ''));
        if (targetId && cars.find(c => c.id === targetId)) {
            showDetail(targetId);
        }
    }
    checkAndRunAutoBoosts();
    updatePremiumStatus();
    setTimeout(() => {
        checkListingViewsMilestones();
        checkListingAgeBonus();
    }, 2000);
})();
