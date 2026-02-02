/* Инициализация Telegram WebApp */
let tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
tg.MainButton.setText('Связаться с продавцом');
tg.MainButton.hide();

/* Mock данные - автомобили */
const carsData = [
    {
        id: 1,
        brand: 'Toyota',
        model: 'Camry',
        year: 2020,
        price: 2500000,
        mileage: 45000,
        engine: '2.5 л',
        transmission: 'Автомат',
        fuel: 'Бензин',
        city: 'Москва',
        emoji: '🚙',
        description: 'Отличное состояние, один владелец, полная сервисная история.',
        isTop: true,
        isNew: false
    },
    {
        id: 2,
        brand: 'BMW',
        model: 'X5',
        year: 2019,
        price: 4200000,
        mileage: 62000,
        engine: '3.0 л',
        transmission: 'Автомат',
        fuel: 'Дизель',
        city: 'Санкт-Петербург',
        emoji: '🚙',
        description: 'Полный привод, панорама, кожаный салон.',
        isTop: true,
        isNew: false
    },
    {
        id: 3,
        brand: 'Mercedes-Benz',
        model: 'E-Class',
        year: 2021,
        price: 5800000,
        mileage: 28000,
        engine: '2.0 л',
        transmission: 'Автомат',
        fuel: 'Бензин',
        city: 'Москва',
        emoji: '🚗',
        description: 'Рестайлинговая версия, AMG пакет, пневмоподвеска.',
        isTop: true,
        isNew: true
    },
    {
        id: 4,
        brand: 'Hyundai',
        model: 'Solaris',
        year: 2022,
        price: 1350000,
        mileage: 15000,
        engine: '1.6 л',
        transmission: 'Автомат',
        fuel: 'Бензин',
        city: 'Казань',
        emoji: '🚗',
        description: 'Практически новый автомобиль, гарантия до 2027 года.',
        isTop: false,
        isNew: true
    },
    {
        id: 5,
        brand: 'Kia',
        model: 'Sportage',
        year: 2020,
        price: 2100000,
        mileage: 55000,
        engine: '2.0 л',
        transmission: 'Автомат',
        fuel: 'Бензин',
        city: 'Новосибирск',
        emoji: '🚙',
        description: 'Кроссовер в отличном состоянии, полный привод.',
        isTop: false,
        isNew: true
    },
    {
        id: 6,
        brand: 'Volkswagen',
        model: 'Polo',
        year: 2018,
        price: 950000,
        mileage: 78000,
        engine: '1.6 л',
        transmission: 'Механика',
        fuel: 'Бензин',
        city: 'Екатеринбург',
        emoji: '🚗',
        description: 'Надежный автомобиль для города.',
        isTop: false,
        isNew: true
    },
    {
        id: 7,
        brand: 'Audi',
        model: 'A6',
        year: 2021,
        price: 4850000,
        mileage: 32000,
        engine: '2.0 л',
        transmission: 'Автомат',
        fuel: 'Бензин',
        city: 'Москва',
        emoji: '🚗',
        description: 'Престижный седан бизнес-класса.',
        isTop: true,
        isNew: false
    },
    {
        id: 8,
        brand: 'Nissan',
        model: 'Qashqai',
        year: 2019,
        price: 1650000,
        mileage: 68000,
        engine: '1.6 л',
        transmission: 'Вариатор',
        fuel: 'Бензин',
        city: 'Краснодар',
        emoji: '🚙',
        description: 'Популярный кроссовер, идеален для семьи.',
        isTop: false,
        isNew: true
    }
];

/* Глобальные переменные */
let currentFilters = {
    search: '',
    maxPrice: null,
    minYear: null,
    city: '',
    usedOnly: false
};

let favoriteCars = [];
let currentDetailCar = null;

/* Инициализация */
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    loadFavorites();
    renderCars();
    initializeEventListeners();
    console.log('App initialized with', carsData.length, 'cars');
}

/* Обработчики событий */
function initializeEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', handleFilterClick);
    });
    
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Форма добавления объявления
    const addForm = document.getElementById('addCarForm');
    if (addForm) {
        addForm.addEventListener('submit', handleAddCar);
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/* Поиск */
function handleSearch(e) {
    currentFilters.search = e.target.value.toLowerCase();
    renderCars();
}

/* Фильтры */
function handleFilterClick(e) {
    const filterType = e.target.dataset.filter;
    
    if (filterType === 'all') {
        resetFilters();
        return;
    }
    
    if (filterType === 'price') {
        openModal('priceModal');
    } else if (filterType === 'year') {
        openModal('yearModal');
    } else if (filterType === 'city') {
        openModal('cityModal');
    } else if (filterType === 'used') {
        currentFilters.usedOnly = !currentFilters.usedOnly;
        e.target.classList.toggle('active');
        renderCars();
    }
}

function resetFilters() {
    currentFilters = {
        search: '',
        maxPrice: null,
        minYear: null,
        city: '',
        usedOnly: false
    };
    
    document.getElementById('searchInput').value = '';
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
        if (chip.dataset.filter === 'all') {
            chip.classList.add('active');
        }
    });
    
    document.getElementById('priceFilter').textContent = 'Цена до...';
    document.getElementById('yearFilter').textContent = 'Год от...';
    document.getElementById('cityFilter').textContent = 'Город';
    
    renderCars();
}

/* Модальные окна */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

function applyPriceFilter() {
    const priceInput = document.getElementById('priceInput');
    const price = parseInt(priceInput.value);
    
    if (price && price > 0) {
        currentFilters.maxPrice = price;
        document.getElementById('priceFilter').textContent = `До ${formatPrice(price)}`;
        document.getElementById('priceFilter').classList.add('active');
    }
    
    closeModal('priceModal');
    renderCars();
}

function applyYearFilter() {
    const yearInput = document.getElementById('yearInput');
    const year = parseInt(yearInput.value);
    
    if (year && year >= 1990 && year <= 2025) {
        currentFilters.minYear = year;
        document.getElementById('yearFilter').textContent = `От ${year} г.`;
        document.getElementById('yearFilter').classList.add('active');
    }
    
    closeModal('yearModal');
    renderCars();
}

function applyCityFilter() {
    const citySelect = document.getElementById('citySelect');
    const city = citySelect.value;
    
    currentFilters.city = city;
    
    if (city) {
        document.getElementById('cityFilter').textContent = city;
        document.getElementById('cityFilter').classList.add('active');
    } else {
        document.getElementById('cityFilter').textContent = 'Город';
        document.getElementById('cityFilter').classList.remove('active');
    }
    
    closeModal('cityModal');
    renderCars();
}

/* Фильтрация */
function filterCars(cars) {
    return cars.filter(car => {
        if (currentFilters.search) {
            const searchStr = `${car.brand} ${car.model}`.toLowerCase();
            if (!searchStr.includes(currentFilters.search)) {
                return false;
            }
        }
        
        if (currentFilters.maxPrice && car.price > currentFilters.maxPrice) {
            return false;
        }
        
        if (currentFilters.minYear && car.year < currentFilters.minYear) {
            return false;
        }
        
        if (currentFilters.city && car.city !== currentFilters.city) {
            return false;
        }
        
        if (currentFilters.usedOnly && car.mileage < 1000) {
            return false;
        }
        
        return true;
    });
}

/* Отрисовка */
function renderCars() {
    const filteredCars = filterCars(carsData);
    const topCars = filteredCars.filter(car => car.isTop);
    const newCars = filteredCars.filter(car => car.isNew);
    
    renderCarSection('topListings', topCars);
    renderCarSection('newListings', newCars);
}

function renderCarSection(containerId, cars) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (cars.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <div class="empty-state-text">Ничего не найдено</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = cars.map(car => createCarCard(car)).join('');
}

function createCarCard(car) {
    return `
        <div class="car-card" onclick="openDetailPage(${car.id})">
            <div class="car-image">${car.emoji}</div>
            <div class="car-info">
                <div class="car-title">${car.brand} ${car.model} ${car.year}</div>
                <div class="car-price">${formatPrice(car.price)} ₽</div>
                <div class="car-specs">
                    <span class="car-spec">⚙️ ${car.engine}</span>
                    <span class="car-spec">📊 ${formatMileage(car.mileage)} км</span>
                    <span class="car-spec">⛽ ${car.fuel}</span>
                </div>
                <div class="car-location">📍 ${car.city}</div>
            </div>
        </div>
    `;
}

/* Детальная страница */
function openDetailPage(carId) {
    const car = carsData.find(c => c.id === carId);
    if (!car) return;
    
    currentDetailCar = car;
    const detailPage = document.getElementById('detailPage');
    const detailContent = document.getElementById('detailContent');
    
    const isFavorite = favoriteCars.includes(car.id);
    
    detailContent.innerHTML = `
        <div class="detail-image">${car.emoji}</div>
        <div class="detail-info">
            <div class="detail-title">${car.brand} ${car.model}</div>
            <div class="detail-price">${formatPrice(car.price)} ₽</div>
            
            <div class="detail-section">
                <div class="detail-section-title">Характеристики</div>
                <div class="detail-specs">
                    <div class="detail-spec-item">
                        <div class="detail-spec-label">Год выпуска</div>
                        <div class="detail-spec-value">${car.year}</div>
                    </div>
                    <div class="detail-spec-item">
                        <div class="detail-spec-label">Пробег</div>
                        <div class="detail-spec-value">${formatMileage(car.mileage)} км</div>
                    </div>
                    <div class="detail-spec-item">
                        <div class="detail-spec-label">Двигатель</div>
                        <div class="detail-spec-value">${car.engine}</div>
                    </div>
                    <div class="detail-spec-item">
                        <div class="detail-spec-label">Коробка</div>
                        <div class="detail-spec-value">${car.transmission}</div>
                    </div>
                    <div class="detail-spec-item">
                        <div class="detail-spec-label">Топливо</div>
                        <div class="detail-spec-value">${car.fuel}</div>
                    </div>
                    <div class="detail-spec-item">
                        <div class="detail-spec-label">Город</div>
                        <div class="detail-spec-value">${car.city}</div>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <div class="detail-section-title">Описание</div>
                <div class="detail-description">${car.description}</div>
            </div>
            
            <button class="detail-contact-btn" onclick="toggleFavorite(${car.id})">
                ${isFavorite ? '❤️ В избранном' : '🤍 Добавить в избранное'}
            </button>
        </div>
    `;
    
    detailPage.classList.remove('hidden');
    tg.MainButton.show();
    tg.MainButton.onClick(contactSeller);
}

function closeDetailPage() {
    const detailPage = document.getElementById('detailPage');
    detailPage.classList.add('hidden');
    currentDetailCar = null;
    tg.MainButton.hide();
    tg.MainButton.offClick(contactSeller);
}

function contactSeller() {
    if (currentDetailCar) {
        tg.showAlert(`Связь с продавцом ${currentDetailCar.brand} ${currentDetailCar.model}`);
    }
}

/* Избранное */
function toggleFavorite(carId) {
    const index = favoriteCars.indexOf(carId);
    
    if (index > -1) {
        favoriteCars.splice(index, 1);
    } else {
        favoriteCars.push(carId);
    }
    
    saveFavorites();
    
    if (currentDetailCar && currentDetailCar.id === carId) {
        openDetailPage(carId);
    }
    
    const isFavorite = favoriteCars.includes(carId);
    tg.showPopup({
        message: isFavorite ? 'Добавлено в избранное' : 'Удалено из избранного',
        buttons: [{type: 'ok'}]
    });
}

function loadFavorites() {
    try {
        const stored = localStorage.getItem('favoriteCars');
        if (stored) {
            favoriteCars = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error loading favorites:', e);
    }
}

function saveFavorites() {
    try {
        localStorage.setItem('favoriteCars', JSON.stringify(favoriteCars));
    } catch (e) {
        console.error('Error saving favorites:', e);
    }
}

/* Навигация */
function navigateTo(page) {
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === page) {
            btn.classList.add('active');
        }
    });
    
    if (page === 'main') {
        closePage('addPage');
        closeDetailPage();
    } else if (page === 'add') {
        openPage('addPage');
    } else if (page === 'messages') {
        tg.showAlert('Раздел "Сообщения" в разработке');
    } else if (page === 'favorites') {
        showFavorites();
    }
}

function openPage(pageId) {
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.remove('hidden');
    }
}

function closePage(pageId) {
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.add('hidden');
    }
}

function showFavorites() {
    if (favoriteCars.length === 0) {
        tg.showPopup({
            message: 'У вас пока нет избранных объявлений',
            buttons: [{type: 'ok'}]
        });
        return;
    }
    
    const favCars = carsData.filter(car => favoriteCars.includes(car.id));
    const message = `Избранное (${favCars.length}):\n\n` + 
        favCars.map(car => `${car.brand} ${car.model} - ${formatPrice(car.price)} ₽`).join('\n');
    
    tg.showPopup({
        message: message,
        buttons: [{type: 'ok'}]
    });
}

/* Добавление объявления */
function handleAddCar(e) {
    e.preventDefault();
    
    const newCar = {
        id: carsData.length + 1,
        brand: document.getElementById('carBrand').value,
        model: document.getElementById('carModel').value,
        year: parseInt(document.getElementById('carYear').value),
        price: parseInt(document.getElementById('carPrice').value),
        mileage: parseInt(document.getElementById('carMileage').value),
        engine: document.getElementById('carEngine').value,
        transmission: document.getElementById('carTransmission').value,
        fuel: document.getElementById('carFuel').value,
        city: document.getElementById('carCity').value,
        description: document.getElementById('carDescription').value,
        emoji: '🚗',
        isTop: false,
        isNew: true
    };
    
    carsData.push(newCar);
    
    tg.showAlert('Объявление успешно добавлено!');
    
    document.getElementById('addCarForm').reset();
    closePage('addPage');
    navigateTo('main');
    renderCars();
}

/* Вспомогательные функции */
function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatMileage(mileage) {
    return mileage.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/* Обработка кнопок Telegram */
tg.onEvent('backButtonClicked', function() {
    if (!document.getElementById('detailPage').classList.contains('hidden')) {
        closeDetailPage();
    }
});
