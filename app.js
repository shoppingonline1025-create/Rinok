// ============================================
// AUTOMARKET v6.3 - FIREBASE + АВАТАР
// Дата обновления: 2026-02-12
// ============================================

// ╔══════════════════════════════════════════╗
// ║  FIREBASE REALTIME DATABASE              ║
// ║  Вставьте URL вашей базы данных          ║
// ║  firebase.google.com → Realtime DB       ║
// ╚══════════════════════════════════════════╝
const FIREBASE_URL = 'https://auto-market26-default-rtdb.europe-west1.firebasedatabase.app';

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

// --- Firebase: загрузить всё из сети и обновить UI ---
async function syncFromFirebase() {
    if (!FIREBASE_URL) return;
    try {
        const res = await fetch(`${FIREBASE_URL}/cars.json`);
        if (!res.ok) throw new Error('Ошибка Firebase ' + res.status);
        const data = await res.json();

        if (!data) {
            // Firebase пуст — заливаем туда наши тестовые данные с sellerInfo
            const localCars = DB.getCars();
            const enriched = enrichCarsWithSellerInfo(localCars);
            await pushAllCarsToFirebase(enriched);
            DB.saveCars(enriched);
            cars = enriched;
            render();
        } else {
            // Получаем массив машин из объекта Firebase {id: car}
            let fbCars = Object.values(data).filter(Boolean);
            // Если у машин нет sellerInfo — обогащаем и перезаливаем в Firebase
            // Обогащаем если нет sellerInfo ИЛИ нет telegramId внутри него
            const needsEnrich = fbCars.some(c => !c.sellerInfo || !c.sellerInfo.telegramId);
            if (needsEnrich) {
                fbCars = enrichCarsWithSellerInfo(fbCars);
                await pushAllCarsToFirebase(fbCars);
            }
            DB.saveCars(fbCars);
            localStorage.setItem('automarket_initialized', 'true');
            cars = fbCars;
            render();
        }
    } catch (e) {
        console.warn('Firebase недоступен, работаем offline:', e.message);
    }
}

// --- Firebase: залить все машины (bulk) ---
async function pushAllCarsToFirebase(carsArr) {
    if (!FIREBASE_URL) return;
    try {
        const obj = {};
        carsArr.forEach(c => { obj[c.id] = c; });
        await fetch(`${FIREBASE_URL}/cars.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(obj)
        });
        console.log('Тестовые данные загружены в Firebase:', carsArr.length, 'шт.');
    } catch (e) {
        console.warn('Ошибка записи в Firebase:', e.message);
    }
}

// --- Firebase: сохранить/обновить одну машину ---
async function pushCarToFirebase(car) {
    if (!FIREBASE_URL) return;
    try {
        await fetch(`${FIREBASE_URL}/cars/${car.id}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(car)
        });
    } catch (e) { console.warn('Firebase pushCar error:', e.message); }
}

// --- Firebase: удалить машину ---
async function deleteCarFromFirebase(carId) {
    if (!FIREBASE_URL) return;
    try {
        await fetch(`${FIREBASE_URL}/cars/${carId}.json`, { method: 'DELETE' });
    } catch (e) { console.warn('Firebase deleteCar error:', e.message); }
}

// ─── Firebase: работа с пользователями ───────────────────────

// Сохранить пользователя в Firebase
async function pushUserToFirebase(user) {
    if (!FIREBASE_URL || !user?.id) return;
    // Не пишем фото в Firebase (слишком большое), храним только данные
    const userToSave = {...user};
    delete userToSave.photo; // фото только в localStorage
    try {
        await fetch(`${FIREBASE_URL}/users/${user.id}.json`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(userToSave)
        });
    } catch (e) { console.warn('Firebase pushUser error:', e.message); }
}

// Загрузить пользователя из Firebase (баланс, подписки, транзакции)
async function loadUserFromFirebase(userId) {
    if (!FIREBASE_URL || !userId) return null;
    try {
        const res = await fetch(`${FIREBASE_URL}/users/${userId}.json`);
        if (!res.ok) return null;
        const data = await res.json();
        return data;
    } catch (e) {
        console.warn('Firebase loadUser error:', e.message);
        return null;
    }
}

// Firebase хранит массивы как объекты {"0":x,"1":y} — нормализуем обратно в массив
function normalizeFirebaseArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    // Firebase object → array
    return Object.values(val);
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
        freeBoostAvailableAt: fbUser.freeBoostAvailableAt ?? user.freeBoostAvailableAt ?? null
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
    getCars: function() {
        const stored = localStorage.getItem('automarket_cars');
        const initialized = localStorage.getItem('automarket_initialized');
        
        // Если данные уже были инициализированы - возвращаем их
        if (initialized && stored) {
            return JSON.parse(stored);
        }
        
        // Первая инициализация - загружаем тестовые данные
        if (!initialized) {
            const initial = initCarsData();
            this.saveCars(initial);
            localStorage.setItem('automarket_initialized', 'true');
            console.log('Первая инициализация БД - загружено', initial.length, 'объявлений');
            return initial;
        }
        
        // Если нет stored но есть initialized - что-то пошло не так
        return [];
    },
    
    saveCars: function(cars) {
        localStorage.setItem('automarket_cars', JSON.stringify(cars));
        console.log('Сохранено в БД:', cars.length, 'объявлений');
    },
    
    deleteCar: function(carId) {
        let cars = this.getCars();
        cars = cars.filter(c => c.id !== carId);
        this.saveCars(cars);
        return cars;
    },
    
    updateCar: function(carId, updates) {
        let cars = this.getCars();
        const index = cars.findIndex(c => c.id === carId);
        if (index !== -1) {
            cars[index] = {...cars[index], ...updates};
            this.saveCars(cars);
        }
        return cars;
    },
    
    getUsers: function() {
        return JSON.parse(localStorage.getItem('users') || '{}');
    },
    
    saveUsers: function(users) {
        localStorage.setItem('users', JSON.stringify(users));
    },
    
    // Сохранить одного пользователя (по id)
    saveUser: function(user) {
        if (!user || !user.id) return;
        let users = this.getUsers();
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
let favorites = DB.getFavorites();
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

// Пагинация
const ITEMS_PER_PAGE = 20;
let topCurrentPage = 1;
let newCurrentPage = 1;
let allCurrentPage = 1;

function fmt(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function isNew(date) {
    const now = new Date();
    const carDate = typeof date === 'string' ? new Date(date) : date;
    const diffTime = Math.abs(now - carDate);
    const diffHours = diffTime / (1000 * 60 * 60);
    return diffHours <= 24; // Новинки - только 24 часа
}

function formatDate(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
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
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
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
    const cat = filters.category === 'all' ? 'car' : filters.category;
    return Object.keys(BRANDS_DATA[cat] || {}).sort();
}

function getModels(brand) {
    const cat = filters.category === 'all' ? 'car' : filters.category;
    return BRANDS_DATA[cat]?.[brand] || [];
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
    
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    
    selectCategory('all');
}

// Получить отфильтрованные машины
function getFilteredCars() {
    return cars.filter(c => {
        if (filters.search && !`${c.brand} ${c.model}`.toLowerCase().includes(filters.search)) return false;
        if (filters.category !== 'all' && c.category !== filters.category) return false;
        if (filters.brands.length > 0 && !filters.brands.includes(c.brand)) return false;
        if (filters.models.length > 0 && !filters.models.includes(c.model)) return false;
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
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
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
                <div class="car-title">${c.partType} • ${c.brand}${c.model ? ' ' + c.model : ''}</div>
                <div class="car-price">${fmt(c.price)} ${c.currency}</div>
                <div class="car-details">
                    <div><span class="detail-icon">✅</span> Состояние: <strong>${c.condition}</strong></div>
                    <div><span class="detail-icon">📍</span> Город: <strong>${c.city}</strong></div>
                    <div><span class="detail-icon">🚘</span> Регистрация: <strong>${c.registration}</strong></div>
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
            <div class="detail-title">${c.category === 'parts' ? c.partType + ' • ' + c.brand : c.brand + ' ' + c.model}</div>
            <div class="detail-price">${fmt(c.price)} ${c.currency}</div>
            <div class="contact-section">${contactButtons}</div>
            <div class="detail-section">
                <div class="detail-section-title">Характеристики</div>
                <div class="detail-specs">
                    <div class="detail-spec-item"><div class="detail-spec-label">Категория</div><div class="detail-spec-value">${categoryNames[c.category]}</div></div>
                    ${c.category === 'parts' ? `
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
                    <div class="detail-spec-item"><div class="detail-spec-label">Регистрация</div><div class="detail-spec-value">${c.registration}</div></div>
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
    const sellerOtherCars = cars.filter(car => car.userId === c.userId && car.id !== c.id);
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
                      c.category === 'special' ? '🚜' : c.category === 'moto' ? '🏍' : '🚤';
        const thumbHtml = c.photos && c.photos.length > 0
            ? `<div class="fav-card-thumb" style="background-image:url('${c.photos[0]}');background-size:cover;background-position:center;"></div>`
            : `<div class="fav-card-thumb fav-card-thumb-emoji">${emoji}</div>`;
        const isTop = c.isTop ? `<span class="fav-top-badge">🔥 ТОП</span>` : '';

        return `
            <div class="fav-card" onclick="openDetailFromFav(${c.id})">
                ${thumbHtml}
                <div class="fav-card-body">
                    <div class="fav-card-header">
                        <div class="fav-card-title">${c.brand} ${c.model} <span class="fav-card-year">${c.year}</span></div>
                        ${isTop}
                    </div>
                    <div class="fav-card-price">${fmt(c.price)} ${c.currency}</div>
                    <div class="fav-card-meta">
                        <span>📏 ${fmt(c.mileage)} км</span>
                        <span>📍 ${c.city}</span>
                    </div>
                    <div class="fav-card-meta">
                        <span>⛽ ${c.fuel}</span>
                        <span>⚙️ ${c.transmission}</span>
                    </div>
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
            cars = DB.deleteCar(carId);
            deleteCarFromFirebase(carId);
            
            // Удаляем из списка пользователя
            const index = currentUser.listings.indexOf(carId);
            if (index > -1) {
                currentUser.listings.splice(index, 1);
                saveUser();
            }
            
            tg.showAlert('Объявление удалено');
            openProfile();
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
    event?.target?.closest('.nav-button')?.classList.add('active');
    
    if (page === 'main') {
        closePage('addPage');
        closePage('detailPage');
        closePage('profilePage');
        currentSection = 'all';
        render();
    } else if (page === 'add') {
        closePage('profilePage');
        editingCarId = null; // Сброс режима редактирования
        document.querySelector('#addForm button[type="submit"]').textContent = 'Опубликовать';
        // Автозаполняем телефон из профиля пользователя
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

function handleSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) {
        tg.showAlert('Ошибка: пользователь не авторизован');
        return;
    }
    
    // Валидация марки и модели
    const brandValue = document.getElementById('formBrand').value;
    const modelValue = document.getElementById('formModel').value;
    
    if (!brandValue || !brandValue.trim()) {
        tg.showAlert('Пожалуйста, выберите марку');
        return;
    }
    
    if (!modelValue || !modelValue.trim()) {
        tg.showAlert('Пожалуйста, выберите модель');
        return;
    }
    
    // Валидация телефона
    const phoneInput = document.getElementById('listingPhone');
    const phoneValue = phoneInput ? phoneInput.value.trim() : '';
    if (!phoneValue) {
        tg.showAlert('Укажите номер телефона — покупатели смогут написать вам в Telegram');
        phoneInput && phoneInput.focus();
        return;
    }
    
    // Валидация объема двигателя (только цифры и точка)
    const engineEl = document.getElementById('engine');
    if (category !== 'parts' && engineEl && engineEl.value.trim()) {
        const engineValue = engineEl.value.trim();
        // Проверяем что формат X.X л (цифры и точка)
        if (!/^\d+(\.\d+)?\s*(л)?$/i.test(engineValue)) {
            tg.showAlert('Объем двигателя: укажите только цифры (например: 2.5 или 2.5 л)');
            engineEl.focus();
            return;
        }
    }
    
    // Валидация для запчастей
    const category = document.getElementById('category').value;
    if (category === 'parts') {
        const partType = document.getElementById('partType')?.value;
        const condition = document.getElementById('condition')?.value;
        if (!partType) {
            tg.showAlert('Укажите тип детали');
            return;
        }
        if (!condition) {
            tg.showAlert('Укажите состояние');
            return;
        }
    }
    
    const carData = {
        category,
        brand: brandValue,
        model: modelValue || '',
        price: parseInt(document.getElementById('price').value),
        currency: document.getElementById('currency').value,
        city: document.getElementById('city').value,
        registration: document.getElementById('registration').value,
        description: document.getElementById('description').value,
        photos: [...uploadedPhotos],
        video: uploadedVideo,
        userId: currentUser.id,
        // Для запчастей добавляем partType и condition
        ...(category === 'parts' ? {
            partType: document.getElementById('partType').value,
            condition: document.getElementById('condition').value
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
    
    if (editingCarId) {
        // РЕДАКТИРОВАНИЕ
        carData.id = editingCarId;
        DB.updateCar(editingCarId, carData);
        cars = DB.getCars();
        // Сохраняем в Firebase
        pushCarToFirebase(carData);
        tg.showAlert('Изменения сохранены!');
        editingCarId = null;
    } else {
        // НОВОЕ ОБЪЯВЛЕНИЕ
        const maxId = cars.length > 0 ? Math.max(...cars.map(c => c.id)) : 0;
        carData.id = maxId + 1;
        carData.isTop = false;
        carData.createdAt = new Date().toISOString();
        
        // Получаем свежие данные из DB
        cars = DB.getCars();
        
        // Добавляем новое объявление
        cars.push(carData);
        
        // Сохраняем в localStorage
        DB.saveCars(cars);
        
        // Сохраняем в Firebase (для других пользователей)
        pushCarToFirebase(carData);
        
        // Добавляем в список пользователя
        if (!currentUser.listings) {
            currentUser.listings = [];
        }
        currentUser.listings.push(carData.id);
        saveUser();
        
        tg.showAlert('Объявление опубликовано!');
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
    // Сбрасываем телефон (reset не трогает его если он был заполнен вручную)
    const phoneElClear = document.getElementById('listingPhone');
    if (phoneElClear) phoneElClear.value = '';
    document.querySelector('#addForm button[type="submit"]').textContent = 'Опубликовать';
    
    // Закрываем форму
    closePage('addPage');
    
    // Обновляем глобальную переменную cars
    cars = DB.getCars();
    
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

function saveUser() {
    if (!currentUser) return;
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
        // Сжимаем до 300x300 (аватарка маленькая)
        const compressed = await compressImage(ev.target.result, 300, 0.80);
        currentUser.photo = compressed;
        saveUser();
        renderProfileAvatar();
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // сбрасываем input
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
function canFreeBoost() {
    if (!currentUser.freeBoostAvailableAt) return true; // первое поднятие
    const now = new Date();
    const available = new Date(currentUser.freeBoostAvailableAt);
    return now >= available;
}

function getNextFreeBoostTime() {
    if (!currentUser.freeBoostAvailableAt) return null;
    const now = new Date();
    const available = new Date(currentUser.freeBoostAvailableAt);
    if (now >= available) return null;
    
    const diff = available - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}ч ${minutes}м`;
}

function boostListing(carId, paid = false) {
    const car = cars.find(c => c.id === carId);
    if (!car) return;
    
    // Проверяем подписку автоподнятия
    const hasAutoBoost = currentUser.subscriptions?.autoBoost?.active && 
                        currentUser.subscriptions.autoBoost.carIds.includes(carId);
    
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
        tg.showAlert('Объявление поднято! (-15 лей)');
    } else {
        // Бесплатное поднятие
        performBoost(car);
        // Следующее бесплатное поднятие завтра в 00:00 (глобально на аккаунт)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        currentUser.freeBoostAvailableAt = tomorrow.toISOString();
        saveUser();
        
        tg.showAlert('Объявление поднято бесплатно!\nСледующее бесплатное поднятие: завтра');
    }
    
    DB.updateCar(car.id, car);
    cars = DB.getCars();
    pushCarToFirebase(car);
    renderMyListings();
}

function performBoost(car) {
    car.createdAt = new Date().toISOString();
    car.lastBoosted = new Date().toISOString();
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
    const myListings = cars.filter(c => c.userId === currentUser.id);
    const statListings = document.getElementById('statListings');
    if (statListings) statListings.textContent = myListings.length;
    
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
    
    // Обновляем мои объявления
    renderMyListings();
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

function openProfile() {
    if (!currentUser) {
        tg.showAlert('Ошибка загрузки профиля');
        return;
    }
    
    // Аватарка с поддержкой фото
    renderProfileAvatar();
    
    document.getElementById('profileName').textContent = currentUser.name || (currentUser.firstName + ' ' + currentUser.lastName).trim() || 'Пользователь';
    document.getElementById('profileId').textContent = `ID: ${currentUser.telegramId}`;
    
    const myListings = cars.filter(c => c.userId === currentUser.id);
    document.getElementById('statListings').textContent = myListings.length;
    document.getElementById('statViews').textContent = currentUser.views || 0;
    document.getElementById('statRating').textContent = Number(currentUser.rating || 0).toFixed(1);
    
    // Обновляем баланс
    updateBalanceDisplay();
    
    // Обновляем статус подписки автоподнятия
    const autoBoostStatus = document.getElementById('autoBoostStatus');
    if (autoBoostStatus) {
        const isActive = currentUser.subscriptions?.autoBoost?.active;
        const carCount = currentUser.subscriptions?.autoBoost?.carIds?.length || 0;
        if (isActive && carCount > 0) {
            autoBoostStatus.textContent = `Активна (${carCount} объявл.)`;
            autoBoostStatus.classList.add('active');
        } else {
            autoBoostStatus.textContent = 'Неактивна';
            autoBoostStatus.classList.remove('active');
        }
    }
    
    document.getElementById('profileNameField').textContent = currentUser.name || 'Не указано';
    document.getElementById('profilePhoneField').textContent = currentUser.phone || 'Не указан';
    document.getElementById('profileEmailField').textContent = currentUser.email || 'Не указан';
    document.getElementById('profileCityField').textContent = currentUser.city || 'Не указан';
    
    const regDate = new Date(currentUser.registeredAt);
    document.getElementById('profileRegDate').textContent = formatDate(regDate);
    document.getElementById('profileTotalViews').textContent = currentUser.views || 0;
    document.getElementById('profileAvgRating').textContent = Number(currentUser.rating || 0).toFixed(1);
    
    renderMyListings();
    
    openPageWithLock('profilePage');
}


// ─── Счётчики просмотров объявлений ───────────────────────────
function getViewKey(carId) { return `views_${carId}`; }

function getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Увеличить счётчик при открытии объявления
function incrementView(carId) {
    const key = getViewKey(carId);
    const today = getTodayStr();
    let data = JSON.parse(localStorage.getItem(key) || '{"today":0,"total":0,"date":""}');
    // Сбрасываем "за сегодня" если новый день
    if (data.date !== today) { data.today = 0; data.date = today; }
    data.today++;
    data.total++;
    localStorage.setItem(key, JSON.stringify(data));
}

// Получить счётчик для отображения
function getViews(carId) {
    const key = getViewKey(carId);
    const today = getTodayStr();
    let data = JSON.parse(localStorage.getItem(key) || '{"today":0,"total":0,"date":""}');
    // Сбрасываем "за сегодня" если новый день (только при чтении)
    if (data.date !== today) { data.today = 0; }
    return data;
}

function renderMyListings() {
    const myListings = cars.filter(c => c.userId === currentUser.id);
    const container = document.getElementById('myListingsContainer');
    
    if (myListings.length === 0) {
        container.innerHTML = `<div class="my-listings-empty"><div class="my-listings-empty-icon">📋</div><div>У вас пока нет объявлений</div></div>`;
        return;
    }
    
    container.innerHTML = myListings.map(car => {
        const emoji = car.category === 'car' ? '🚗' : car.category === 'truck' ? '🚚' : 
                     car.category === 'special' ? '🚜' : car.category === 'moto' ? '🏍' : '🚤';
        
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
        
        return `<div class="my-listing-item">
            ${thumbHtml}
            <div class="my-listing-row">
                <div class="my-listing-info" onclick="showDetail(${car.id})">
                    <div class="my-listing-title">${car.brand} ${car.model} ${car.year || ''}</div>
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
}

function closeEditModal() {
    document.getElementById('editProfileModal').classList.remove('show');
}

function topUpBalance() {
    tg.showAlert('Функция в разработке');
}

function withdrawBalance() {
    if (currentUser.balance <= 0) {
        tg.showAlert('Недостаточно средств');
        return;
    }
    tg.showAlert('Функция в разработке');
}


// ─── Модальное окно выбора типа детали ────────────────────────
function openPartTypeModal() {
    if (typeof PARTS_TYPES === 'undefined') {
        tg.showAlert('Данные не загружены');
        return;
    }
    
    const grid = document.getElementById('partTypeGrid');
    grid.innerHTML = PARTS_TYPES.map((item, idx) => `
        <div class="part-type-option ${formSelectedPartType === item.type ? 'selected' : ''}" 
             onclick="selectPartType('${item.type.replace(/'/g, "\'")}')">
            <div class="part-type-name">${item.type}</div>
            <div class="part-type-desc">${item.desc}</div>
        </div>
    `).join('');
    
    document.getElementById('partTypeModal').classList.add('show');
}

function selectPartType(type) {
    formSelectedPartType = type;
    document.querySelectorAll('.part-type-option').forEach(el => {
        const name = el.querySelector('.part-type-name').textContent;
        el.classList.toggle('selected', name === type);
    });
}

function confirmPartType() {
    if (!formSelectedPartType) {
        tg.showAlert('Выберите тип детали');
        return;
    }
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
    
    // Для parts скрываем год, пробег, двигатель, КПП, топливо, привод
    const vehicleFields = ['year', 'mileage', 'engine', 'transmission', 'fuel', 'drive'];
    vehicleFields.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.closest('.form-group')) {
            el.closest('.form-group').style.display = isParts ? 'none' : 'flex';
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
    
    const models = BRANDS_DATA[cat]?.[brand] || [];
    const grid = document.getElementById('formModelGrid');
    
    grid.innerHTML = models.map(model => 
        `<div class="form-brand-option ${formSelectedModel === model ? 'selected' : ''}" onclick="selectFormModel('${model}')">${model}</div>`
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
    await initUser();   // загружаем пользователя (включая Firebase sync)
    render();           // рендерим объявления
    updateFavBadge();
    syncFromFirebase(); // фоновая синхронизация машин
})();
