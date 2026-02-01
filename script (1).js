/* =========================
   Инициализация Telegram WebApp
   ========================= */
let tg = window.Telegram.WebApp;

// Инициализация приложения при загрузке
tg.ready();
tg.expand();

// Настройка главной кнопки Telegram
tg.MainButton.setText('Связаться с продавцом');
tg.MainButton.hide();

/* =========================
   Mock данные - Список автомобилей
   ========================= */
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
        image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80',
        description: 'Отличное состояние, один владелец, полная сервисная история. Все ТО у дилера.',
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
        image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
        description: 'Полный привод, панорама, кожаный салон. Максимальная комплектация.',
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
        image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80',
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
        image: 'https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=800&q=80',
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
        image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80',
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
        image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
        description: 'Надежный автомобиль для города, экономичный расход.',
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
        image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80',
        description: 'Престижный седан бизнес-класса, виртуальная приборная панель.',
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
        image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80',
        description: 'Популярный кроссовер, идеален для семьи.',
        isTop: false,
        isNew: true
    }
];

/* =========================
   Глобальные переменные
   ========================= */
let currentFilters = {
    search: '',
    maxPrice: null,
    minYear: null,
    city: '',
    usedOnly: false
};

let favoriteCars = []; // Массив избранных авто (ID)
let currentDetailCar = null; // Текущий открытый автомобиль

/* =========================
   Инициализация приложения
   ========================= */
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Загрузка избранного из локального хранилища
    loadFavorites();
    
    // Отображение автомобилей
    renderCars();
    
    // Инициализация обработчиков событий
    initializeEventListeners();
    
    console.log('App initialized');
}

/* =========================
   Обработчики событий
   ========================= */
function initializeEventListeners() {
    // Поиск
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    // Фильтры
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', handleFilterClick);
    });
    
    // Закрытие модальных окон при клике вне их
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// Debounce функция для оптимизации поиска
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

/* =========================
   Обработка поиска
   ========================= */
function handleSearch(e) {
    currentFilters.search = e.target.value.toLowerCase();
    renderCars();
}

/* =========================
   Обработка фильтров
   ========================= */
function handleFilterClick(e) {
    const filterType = e.target.dataset.filter;
    
    // Для фильтра "Все авто" сбрасываем все фильтры
    if (filterType === 'all') {
        resetFilters();
        return;
    }
    
    // Открытие соответствующих модальных окон
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
    
    // Сброс UI
    document.getElementById('searchInput').value = '';
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
        if (chip.dataset.filter === 'all') {
            chip.classList.add('active');
        }
    });
    
    // Сброс текста фильтров
    document.getElementById('priceFilter').textContent = 'Цена до...';
    document.getElementById('yearFilter').textContent = 'Год от...';
    document.getElementById('cityFilter').textContent = 'Город';
    
    renderCars();
}

/* =========================
   Модальные окна
   ========================= */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
}

// Применение фильтра цены
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

// Применение фильтра года
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

// Применение фильтра города
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

/* =========================
   Фильтрация автомобилей
   ========================= */
function filterCars(cars) {
    return cars.filter(car => {
        // Поиск по марке и модели
        if (currentFilters.search) {
            const searchStr = `${car.brand} ${car.model}`.toLowerCase();
            if (!searchStr.includes(currentFilters.search)) {
                return false;
            }
        }
        
        // Фильтр по цене
        if (currentFilters.maxPrice && car.price > currentFilters.maxPrice) {
            return false;
        }
        
        // Фильтр по году
        if (currentFilters.minYear && car.year < currentFilters.minYear) {
            return false;
        }
        
        // Фильтр по городу
        if (currentFilters.city && car.city !== currentFilters.city) {
            return false;
        }
        
        // Фильтр "С пробегом"
        if (currentFilters.usedOnly && car.mileage < 1000) {
            return false;
        }
        
        return true;
    });
}

/* =========================
   Отрисовка автомобилей
   ========================= */
function renderCars() {
    const filteredCars = filterCars(carsData);
    
    // Разделение на топ и новые
    const topCars = filteredCars.filter(car => car.isTop);
    const newCars = filteredCars.filter(car => car.isNew);
    
    renderCarSection('topListings', topCars);
    renderCarSection('newListings', newCars);
}

function renderCarSection(containerId, cars) {
    const container = document.getElementById(containerId);
    
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
            <img src="${car.image}" alt="${car.brand} ${car.model}" class="car-image">
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

/* =========================
   Детальная страница авто
   ========================= */
function openDetailPage(carId) {
    const car = carsData.find(c => c.id === carId);
    if (!car) return;
    
    currentDetailCar = car;
    const detailPage = document.getElementById('detailPage');
    const detailContent = document.getElementById('detailContent');
    
    const isFavorite = favoriteCars.includes(car.id);
    
    detailContent.innerHTML = `
        <img src="${car.image}" alt="${car.brand} ${car.model}" class="detail-image">
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
    
    // Показываем главную кнопку Telegram
    tg.MainButton.show();
    tg.MainButton.onClick(contactSeller);
}

function closeDetailPage() {
    const detailPage = document.getElementById('detailPage');
    detailPage.classList.add('hidden');
    currentDetailCar = null;
    
    // Скрываем главную кнопку Telegram
    tg.MainButton.hide();
    tg.MainButton.offClick(contactSeller);
}

function contactSeller() {
    if (currentDetailCar) {
        tg.showAlert(`Связь с продавцом ${currentDetailCar.brand} ${currentDetailCar.model}. В реальном приложении здесь откроется чат.`);
    }
}

/* =========================
   Избранное
   ========================= */
function toggleFavorite(carId) {
    const index = favoriteCars.indexOf(carId);
    
    if (index > -1) {
        favoriteCars.splice(index, 1);
    } else {
        favoriteCars.push(carId);
    }
    
    saveFavorites();
    
    // Обновляем кнопку
    if (currentDetailCar && currentDetailCar.id === carId) {
        openDetailPage(carId);
    }
    
    // Показываем уведомление
    const isFavorite = favoriteCars.includes(carId);
    tg.showPopup({
        message: isFavorite ? 'Добавлено в избранное' : 'Удалено из избранного',
        buttons: [{type: 'ok'}]
    });
}

function loadFavorites() {
    const stored = localStorage.getItem('favoriteCars');
    if (stored) {
        favoriteCars = JSON.parse(stored);
    }
}

function saveFavorites() {
    localStorage.setItem('favoriteCars', JSON.stringify(favoriteCars));
}

/* =========================
   Навигация
   ========================= */
function navigateTo(page) {
    // Обновление активной кнопки
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === page) {
            btn.classList.add('active');
        }
    });
    
    // Обработка навигации
    if (page === 'main') {
        // Главная страница уже отображается
        closeDetailPage();
    } else if (page === 'add') {
        tg.showAlert('Функция "Подать объявление" будет доступна в следующей версии!');
    } else if (page === 'messages') {
        tg.showAlert('Раздел "Сообщения" в разработке');
    } else if (page === 'favorites') {
        showFavorites();
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

/* =========================
   Вспомогательные функции
   ========================= */
function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatMileage(mileage) {
    return mileage.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/* =========================
   Обработка закрытия приложения
   ========================= */
tg.onEvent('backButtonClicked', function() {
    if (!document.getElementById('detailPage').classList.contains('hidden')) {
        closeDetailPage();
    }
});

// Показываем кнопку "Назад" когда открыта детальная страница
window.addEventListener('hashchange', function() {
    if (location.hash === '#detail') {
        tg.BackButton.show();
    } else {
        tg.BackButton.hide();
    }
});
