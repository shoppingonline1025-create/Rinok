// ============================================
// AUTOMARKET v6.2 - УПРОЩЕНИЕ + ИСПРАВЛЕНИЯ
// Дата обновления: 2026-02-11 00:00
// ============================================

let tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

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
                     c.category === 'special' ? '🚜' : c.category === 'moto' ? '🏍' : '🚤';
        imageHtml = `<div class="car-image">
            <div class="category-badge">${categoryNames[c.category]}</div>
            <div class="date-badge">${formatDateShort(c.createdAt)}</div>
            ${emoji}
        </div>`;
    }
    
    return `<div class="car-card" onclick="showDetail(${c.id})">
        ${imageHtml}
        <div class="car-info">
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
                     c.category === 'special' ? '🚜' : c.category === 'moto' ? '🏍' : '🚤';
        galleryHtml = `<div class="detail-gallery">${emoji}</div>`;
    }
    
    let seller = getUserById(c.userId);
    let sellerPhone = seller?.phone || '+373 XXX XX XXX';
    let sellerName = seller?.name || (seller?.firstName + ' ' + seller?.lastName).trim() || 'Продавец';
    let sellerUsername = seller?.username || '';
    
    let contactButtons = '';
    
    if (sellerUsername) {
        contactButtons = `<button class="contact-btn telegram-btn" onclick="openTelegramChat('${sellerUsername}')">
            <span class="contact-btn-icon">📱</span>
            <span class="contact-btn-text">Написать в Telegram</span>
        </button>`;
    }
    
    contactButtons += `<button class="contact-btn phone-btn" onclick="showPhone('${sellerPhone}', '${sellerName}')">
        <span class="contact-btn-icon">📞</span>
        <span class="contact-btn-text">Показать телефон</span>
    </button>`;
    
    document.getElementById('detailContent').innerHTML = `
        ${galleryHtml}
        <div class="detail-info">
            <div class="detail-title">${c.brand} ${c.model}</div>
            <div class="detail-price">${fmt(c.price)} ${c.currency}</div>
            <div class="contact-section">${contactButtons}</div>
            <div class="detail-section">
                <div class="detail-section-title">Характеристики</div>
                <div class="detail-specs">
                    <div class="detail-spec-item"><div class="detail-spec-label">Категория</div><div class="detail-spec-value">${categoryNames[c.category]}</div></div>
                    <div class="detail-spec-item"><div class="detail-spec-label">Год</div><div class="detail-spec-value">${c.year}</div></div>
                    <div class="detail-spec-item"><div class="detail-spec-label">Пробег</div><div class="detail-spec-value">${fmt(c.mileage)} км</div></div>
                    <div class="detail-spec-item"><div class="detail-spec-label">Двигатель</div><div class="detail-spec-value">${c.engine}</div></div>
                    <div class="detail-spec-item"><div class="detail-spec-label">Коробка</div><div class="detail-spec-value">${c.transmission}</div></div>
                    <div class="detail-spec-item"><div class="detail-spec-label">Топливо</div><div class="detail-spec-value">${c.fuel}</div></div>
                    ${c.drive ? `<div class="detail-spec-item"><div class="detail-spec-label">Привод</div><div class="detail-spec-value">${c.drive}</div></div>` : ''}
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
                    ${seller?.city ? `<div class="seller-location">📍 ${seller.city}</div>` : ''}
                    ${seller?.rating ? `<div class="seller-rating">⭐ ${Number(seller.rating).toFixed(1)}</div>` : ''}
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
    
    document.getElementById('detailPage').classList.add('show');
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

function openTelegramChat(username) {
    if (username && username !== 'testuser') {
        window.open(`https://t.me/${username}`, '_blank');
    } else {
        tg.showAlert('Username продавца недоступен');
    }
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
    showDetail(id);
    tg.showAlert(idx > -1 ? 'Удалено' : 'Добавлено');
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
    
    // Фото и видео
    uploadedPhotos = car.photos ? [...car.photos] : [];
    uploadedVideo = car.video || null;
    
    // Показываем превью фото
    const photoPreview = document.getElementById('photoPreview');
    photoPreview.innerHTML = uploadedPhotos.map((p, i) => 
        `<div class="file-preview-item"><img src="${p}"><button type="button" class="file-preview-remove" onclick="removePhoto(${i})">×</button></div>`
    ).join('');
    
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
        document.getElementById('addPage').classList.add('show');
    } else if (page === 'favorites') {
        if (favorites.length === 0) {
            tg.showAlert('Нет избранных');
        } else {
            let msg = 'Избранное:\n' + cars.filter(c => favorites.includes(c.id))
                .map(c => `${c.brand} ${c.model} - ${fmt(c.price)} ${c.currency}`).join('\n');
            tg.showPopup({message: msg, buttons: [{type: 'ok'}]});
        }
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

function handlePhotos(e) {
    const files = Array.from(e.target.files).slice(0, 6);
    uploadedPhotos = [];
    const preview = document.getElementById('photoPreview');
    preview.innerHTML = '';
    
    files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            uploadedPhotos.push(event.target.result);
            const div = document.createElement('div');
            div.className = 'file-preview-item';
            div.innerHTML = `<img src="${event.target.result}"><button type="button" class="file-preview-remove" onclick="removePhoto(${index})">×</button>`;
            preview.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
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
    document.getElementById('photoPreview').innerHTML = '';
    
    uploadedPhotos.forEach((photo, i) => {
        const div = document.createElement('div');
        div.className = 'file-preview-item';
        div.innerHTML = `<img src="${photo}"><button type="button" class="file-preview-remove" onclick="removePhoto(${i})">×</button>`;
        document.getElementById('photoPreview').appendChild(div);
    });
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
    
    const carData = {
        category: document.getElementById('category').value,
        brand: brandValue,
        model: modelValue,
        year: parseInt(document.getElementById('year').value),
        price: parseInt(document.getElementById('price').value),
        currency: document.getElementById('currency').value,
        mileage: parseInt(document.getElementById('mileage').value),
        engine: document.getElementById('engine').value,
        transmission: document.getElementById('transmission').value,
        fuel: document.getElementById('fuel').value,
        drive: document.getElementById('drive')?.value || null,
        city: document.getElementById('city').value,
        registration: document.getElementById('registration').value,
        description: document.getElementById('description').value,
        photos: [...uploadedPhotos],
        video: uploadedVideo,
        userId: currentUser.id
    };
    
    if (editingCarId) {
        // РЕДАКТИРОВАНИЕ
        carData.id = editingCarId;
        DB.updateCar(editingCarId, carData);
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
        
        // Сохраняем в DB
        DB.saveCars(cars);
        
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
    document.getElementById('photoPreview').innerHTML = '';
    document.getElementById('videoPreview').innerHTML = '';
    document.getElementById('formBrandInput').value = '';
    document.getElementById('formModelInput').value = '';
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

function initUser() {
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
                listings: [],
                views: 0,
                rating: 0.0,
                registeredAt: new Date().toISOString()
            };
            DB.saveUsers(users);
        }
        
        currentUser = users[userId];
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
                listings: [],
                views: 0,
                rating: 0.0,
                registeredAt: new Date().toISOString()
            };
            DB.saveUsers(users);
        }
        
        currentUser = users[testId];
    }
}

function saveUser() {
    if (!currentUser) return;
    
    let users = DB.getUsers();
    users[currentUser.id] = currentUser;
    DB.saveUsers(users);
}

function openProfile() {
    if (!currentUser) {
        tg.showAlert('Ошибка загрузки профиля');
        return;
    }
    
    document.getElementById('profileAvatar').textContent = currentUser.firstName ? currentUser.firstName[0].toUpperCase() : '👤';
    document.getElementById('profileName').textContent = currentUser.name || (currentUser.firstName + ' ' + currentUser.lastName).trim() || 'Пользователь';
    document.getElementById('profileId').textContent = `ID: ${currentUser.telegramId}`;
    
    const myListings = cars.filter(c => c.userId === currentUser.id);
    document.getElementById('statListings').textContent = myListings.length;
    document.getElementById('statViews').textContent = currentUser.views || 0;
    document.getElementById('statRating').textContent = Number(currentUser.rating || 0).toFixed(1);
    
    document.getElementById('balanceValue').textContent = `${currentUser.balance || 0} $`;
    
    document.getElementById('profileNameField').textContent = currentUser.name || 'Не указано';
    document.getElementById('profilePhoneField').textContent = currentUser.phone || 'Не указан';
    document.getElementById('profileEmailField').textContent = currentUser.email || 'Не указан';
    document.getElementById('profileCityField').textContent = currentUser.city || 'Не указан';
    
    const regDate = new Date(currentUser.registeredAt);
    document.getElementById('profileRegDate').textContent = formatDate(regDate);
    document.getElementById('profileTotalViews').textContent = currentUser.views || 0;
    document.getElementById('profileAvgRating').textContent = Number(currentUser.rating || 0).toFixed(1);
    
    renderMyListings();
    
    document.getElementById('profilePage').classList.add('show');
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
        
        return `<div class="my-listing-item">
            ${thumbHtml}
            <div class="my-listing-info" onclick="showDetail(${car.id})">
                <div class="my-listing-title">${car.brand} ${car.model} ${car.year}</div>
                <div class="my-listing-price">${fmt(car.price)} ${car.currency}</div>
                <div class="my-listing-date">${formatDate(car.createdAt)}</div>
            </div>
            <div class="my-listing-actions">
                <button class="my-listing-btn edit-btn" onclick="editListing(${car.id})">✏️</button>
                <button class="my-listing-btn delete-btn" onclick="deleteListing(${car.id})">🗑️</button>
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

function updateFormBrandOptions() {
    const cat = document.getElementById('category').value;
    
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
    document.getElementById('formBrand').value = '';
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
    
    const brands = Object.keys(BRANDS_DATA[cat] || {}).sort();
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

initUser();
render();
