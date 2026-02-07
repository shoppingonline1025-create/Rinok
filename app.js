// ============================================
// AUTOMARKET - Главное приложение
// ============================================

let tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

let selectedCurrency = '$';
let uploadedPhotos = [];
let uploadedVideo = null;
let currentGalleryIndex = {};
let selectedBrand = '';
let selectedModel = '';

// Инициализация данных
let cars = initCarsData();

let filters = {
    search: '',
    category: 'all',
    brand: '',
    model: '',
    priceFrom: null,
    priceTo: null,
    yearFrom: null,
    yearTo: null,
    mileageFrom: null,
    mileageTo: null,
    city: '',
    registration: '',
    currency: '$'
};

let favorites = JSON.parse(localStorage.getItem('fav') || '[]');
let currentSection = 'all';

// Утилиты
function fmt(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function isNew(date) {
    const now = new Date();
    const diffTime = Math.abs(now - new Date(date));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
}

function formatDate(date) {
    const d = new Date(date);
    const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} ${hours}:${mins}`;
}

function formatDateShort(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}`;
}

// Валюта
function setCurrency(c) {
    selectedCurrency = c;
    filters.currency = c;
    document.querySelectorAll('.currency-btn').forEach(b =>
        b.classList.toggle('active', b.textContent.includes(c))
    );
}

// Категории
function selectCategory(cat) {
    filters.category = cat;
    document.querySelectorAll('.category-chip').forEach(c =>
        c.classList.toggle('active', c.dataset.category === cat)
    );
    render();
}

// Секции
function toggleSection(section) {
    currentSection = section;
    render();
}

// Получить марки для категории
function getBrands() {
    const cat = filters.category === 'all' ? 'car' : filters.category;
    return Object.keys(BRANDS_DATA[cat] || {}).sort();
}

// Получить модели для марки
function getModels(brand) {
    const cat = filters.category === 'all' ? 'car' : filters.category;
    return BRANDS_DATA[cat]?.[brand] || [];
}

// Обновление списка марок в форме
function updateBrandSelect() {
    const cat = document.getElementById('category').value;
    const brandSelect = document.getElementById('formBrand');
    brandSelect.innerHTML = '<option value="">Выберите марку</option>';
    
    if (cat && BRANDS_DATA[cat]) {
        Object.keys(BRANDS_DATA[cat]).sort().forEach(brand => {
            brandSelect.innerHTML += `<option value="${brand}">${brand}</option>`;
        });
    }
    
    document.getElementById('formModel').innerHTML = '<option value="">Сначала выберите марку</option>';
}

// Обновление списка моделей в форме
function updateModelSelect() {
    const cat = document.getElementById('category').value;
    const brand = document.getElementById('formBrand').value;
    const modelSelect = document.getElementById('formModel');
    modelSelect.innerHTML = '<option value="">Выберите модель</option>';
    
    if (cat && brand && BRANDS_DATA[cat] && BRANDS_DATA[cat][brand]) {
        BRANDS_DATA[cat][brand].forEach(model => {
            modelSelect.innerHTML += `<option value="${model}">${model}</option>`;
        });
    }
}

// Модальные окна
function openModal(id) {
    if (id === 'brandModal') {
        const brands = getBrands();
        const list = document.getElementById('brandList');
        list.innerHTML = brands.map(b =>
            `<div class="brand-option ${selectedBrand === b ? 'selected' : ''}" onclick="selectBrandOption('${b}')">${b}</div>`
        ).join('');
    }
    
    if (id === 'modelModal') {
        if (!selectedBrand) {
            tg.showAlert('Сначала выберите марку');
            return;
        }
        const models = getModels(selectedBrand);
        const list = document.getElementById('modelList');
        list.innerHTML = models.map(m =>
            `<div class="brand-option ${selectedModel === m ? 'selected' : ''}" onclick="selectModelOption('${m}')">${m}</div>`
        ).join('');
    }
    
    document.getElementById(id).classList.add('show');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
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

// Применение фильтров с индивидуальной отменой (×)
function applyBrand() {
    filters.brand = selectedBrand;
    const btn = document.getElementById('brandFilter');
    
    if (selectedBrand) {
        btn.innerHTML = `${selectedBrand} <span class="filter-clear" onclick="event.stopPropagation();clearBrand()">×</span>`;
        btn.classList.add('active');
        
        // Сбросить модель при смене марки
        selectedModel = '';
        filters.model = '';
        document.getElementById('modelFilter').textContent = 'Модель';
        document.getElementById('modelFilter').classList.remove('active');
    } else {
        btn.textContent = 'Марка';
        btn.classList.remove('active');
    }
    
    closeModal('brandModal');
    render();
}

function applyModel() {
    filters.model = selectedModel;
    const btn = document.getElementById('modelFilter');
    
    if (selectedModel) {
        btn.innerHTML = `${selectedModel} <span class="filter-clear" onclick="event.stopPropagation();clearModel()">×</span>`;
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

// Функции очистки индивидуальных фильтров
function clearBrand() {
    selectedBrand = '';
    filters.brand = '';
    selectedModel = '';
    filters.model = '';
    
    document.getElementById('brandFilter').textContent = 'Марка';
    document.getElementById('brandFilter').classList.remove('active');
    document.getElementById('modelFilter').textContent = 'Модель';
    document.getElementById('modelFilter').classList.remove('active');
    
    render();
}

function clearModel() {
    selectedModel = '';
    filters.model = '';
    
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

// Сброс всех фильтров
function resetFilters() {
    filters = {
        search: '',
        category: 'all',
        brand: '',
        model: '',
        priceFrom: null,
        priceTo: null,
        yearFrom: null,
        yearTo: null,
        mileageFrom: null,
        mileageTo: null,
        city: '',
        registration: '',
        currency: '$'
    };
    
    selectedBrand = '';
    selectedModel = '';
    currentSection = 'all';
    
    document.getElementById('searchInput').value = '';
    document.getElementById('brandFilter').textContent = 'Марка';
    document.getElementById('modelFilter').textContent = 'Модель';
    document.getElementById('priceFilter').textContent = 'Цена';
    document.getElementById('yearFilter').textContent = 'Год';
    document.getElementById('mileageFilter').textContent = 'Пробег';
    document.getElementById('cityFilter').textContent = 'Город';
    document.getElementById('regFilter').textContent = 'Регистрация';
    
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    
    selectCategory('all');
}

// Галереи
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
function switchDetailPhoto(dir) {
    const photos = document.querySelectorAll('.detail-gallery img');
    if (photos.length <= 1) return;
    
    photos[detailGalleryIndex].classList.remove('active');
    detailGalleryIndex += dir;
    
    if (detailGalleryIndex < 0) detailGalleryIndex = photos.length - 1;
    if (detailGalleryIndex >= photos.length) detailGalleryIndex = 0;
    
    photos[detailGalleryIndex].classList.add('active');
}

// Работа с файлами
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

// Рендеринг
function render() {
    let filtered = cars.filter(c => {
        if (filters.search && !`${c.brand} ${c.model}`.toLowerCase().includes(filters.search)) return false;
        if (filters.category !== 'all' && c.category !== filters.category) return false;
        if (filters.brand && c.brand !== filters.brand) return false;
        if (filters.model && c.model !== filters.model) return false;
        if (filters.priceFrom && c.currency === filters.currency && c.price < filters.priceFrom) return false;
        if (filters.priceTo && c.currency === filters.currency && c.price > filters.priceTo) return false;
        if (filters.yearFrom && c.year < filters.yearFrom) return false;
        if (filters.yearTo && c.year > filters.yearTo) return false;
        if (filters.mileageFrom && c.mileage < filters.mileageFrom) return false;
        if (filters.mileageTo && c.mileage > filters.mileageTo) return false;
        if (filters.city && c.city !== filters.city) return false;
        if (filters.registration && c.registration !== filters.registration) return false;
        return true;
    });
    
    let top = filtered.filter(c => c.isTop);
    let newCars = filtered.filter(c => isNew(c.createdAt)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    let all = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    document.getElementById('topCount').textContent = `(${top.length})`;
    document.getElementById('newCount').textContent = `(${newCars.length})`;
    document.getElementById('allCount').textContent = `(${all.length})`;
    
    if (currentSection === 'top') {
        document.getElementById('topListings').innerHTML = top.map(makeCard).join('') || 
            '<div class="empty-state"><div class="empty-state-icon">🔍</div><div>Нет топ объявлений</div></div>';
        document.getElementById('newListings').style.display = 'none';
        document.getElementById('allListings').style.display = 'none';
        document.getElementById('allTitle').style.display = 'none';
    } else if (currentSection === 'new') {
        document.getElementById('topListings').style.display = 'none';
        document.getElementById('newListings').innerHTML = newCars.map(makeCard).join('') || 
            '<div class="empty-state"><div class="empty-state-icon">🔍</div><div>Нет новых объявлений</div></div>';
        document.getElementById('newListings').style.display = 'grid';
        document.getElementById('allListings').style.display = 'none';
        document.getElementById('allTitle').style.display = 'none';
    } else if (currentSection === 'all') {
        document.getElementById('topListings').style.display = 'none';
        document.getElementById('newListings').style.display = 'none';
        document.getElementById('allListings').innerHTML = all.map(makeCard).join('') || 
            '<div class="empty-state"><div class="empty-state-icon">🔍</div><div>Ничего не найдено</div></div>';
        document.getElementById('allListings').style.display = 'grid';
        document.getElementById('allTitle').style.display = 'block';
    } else {
        document.getElementById('topListings').innerHTML = top.map(makeCard).join('') || 
            '<div class="empty-state"><div class="empty-state-icon">🔍</div><div>Нет топ объявлений</div></div>';
        document.getElementById('topListings').style.display = 'grid';
        document.getElementById('newListings').innerHTML = newCars.map(makeCard).join('') || 
            '<div class="empty-state"><div class="empty-state-icon">🔍</div><div>Нет новых объявлений</div></div>';
        document.getElementById('newListings').style.display = 'grid';
        document.getElementById('allListings').style.display = 'none';
        document.getElementById('allTitle').style.display = 'none';
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
            <div class="car-specs">
                <span>${fmt(c.mileage)} км</span>
                <span>${c.engine}</span>
            </div>
            <div class="car-location">${c.city}</div>
            <div class="car-registration">🚘 ${c.registration}</div>
            <div class="car-date">${formatDate(c.createdAt)}</div>
        </div>
    </div>`;
}

function showDetail(id) {
    let c = cars.find(x => x.id === id);
    let isFav = favorites.includes(id);
    detailGalleryIndex = 0;
    
    let galleryHtml = '';
    if (c.photos && c.photos.length > 0) {
        const images = c.photos.map((p, i) => `<img src="${p}" class="${i === 0 ? 'active' : ''}">`).join('');
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
    
    document.getElementById('detailContent').innerHTML = `
        ${galleryHtml}
        <div class="detail-info">
            <div class="detail-title">${c.brand} ${c.model}</div>
            <div class="detail-price">${fmt(c.price)} ${c.currency}</div>
            <div class="detail-section">
                <div class="detail-section-title">Характеристики</div>
                <div class="detail-specs">
                    <div class="detail-spec-item">
                        <div class="detail-spec-label">Категория</div>
                        <div class="detail-spec-value">${categoryNames[c.category]}</div>
                    </div>
                    <div class="detail-spec-item">
                        <div class="detail-spec-label">Год</div>
                        <div class="detail-spec-value">${c.year}</div>
                    </div>
                    <div class="detail-spec-item">
                        <div class="detail-spec-label">Пробег</div>
                        <div class="detail-spec-value">${fmt(c.mileage)} км</div>
                    </div>
                    <div class="detail-spec-item">
                        <div class="detail-spec-label">Двигатель</div>
                        <div class="detail-spec-value">${c.engine}</div>
                    </div>
                    <div class="detail-spec-item">
                        <div class="detail-spec-label">Коробка</div>
                        <div class="detail-spec-value">${c.transmission}</div>
                    </div>
                    <div class="detail-spec-item">
                        <div class="detail-spec-label">Топливо</div>
                        <div class="detail-spec-value">${c.fuel}</div>
                    </div>
                    <div class="detail-spec-item">
                        <div class="detail-spec-label">Город</div>
                        <div class="detail-spec-value">${c.city}</div>
                    </div>
                    <div class="detail-spec-item">
                        <div class="detail-spec-label">Регистрация</div>
                        <div class="detail-spec-value">${c.registration}</div>
                    </div>
                </div>
            </div>
            <div class="detail-section">
                <div class="detail-section-title">Описание</div>
                <div>${c.description}</div>
            </div>
            <div class="detail-section">
                <div class="detail-section-title">Дата размещения</div>
                <div>${formatDate(c.createdAt)}</div>
            </div>
            <button class="detail-contact-btn" onclick="toggleFav(${id})">
                ${isFav ? '❤️ В избранном' : '🤍 В избранное'}
            </button>
        </div>
    `;
    
    document.getElementById('detailPage').classList.add('show');
}

function toggleFav(id) {
    let idx = favorites.indexOf(id);
    if (idx > -1) favorites.splice(idx, 1);
    else favorites.push(id);
    
    localStorage.setItem('fav', JSON.stringify(favorites));
    showDetail(id);
    tg.showAlert(idx > -1 ? 'Удалено' : 'Добавлено');
}

// Навигация
function navigate(page) {
    document.querySelectorAll('.nav-button').forEach(b => b.classList.remove('active'));
    event.target.closest('.nav-button').classList.add('active');
    
    if (page === 'main') {
        closePage('addPage');
        closePage('detailPage');
    } else if (page === 'add') {
        document.getElementById('addPage').classList.add('show');
    } else if (page === 'favorites') {
        if (favorites.length === 0) {
            tg.showAlert('Нет избранных');
        } else {
            let msg = 'Избранное:\n' + cars.filter(c => favorites.includes(c.id))
                .map(c => `${c.brand} ${c.model} - ${fmt(c.price)} ${c.currency}`).join('\n');
            tg.showPopup({message: msg, buttons: [{type: 'ok'}]});
        }
    } else {
        tg.showAlert('В разработке');
    }
}

function closePage(id) {
    document.getElementById(id).classList.remove('show');
}

// Форма
function handleSubmit(e) {
    e.preventDefault();
    
    let newCar = {
        id: cars.length + 1,
        category: document.getElementById('category').value,
        brand: document.getElementById('formBrand').value,
        model: document.getElementById('formModel').value,
        year: parseInt(document.getElementById('year').value),
        price: parseInt(document.getElementById('price').value),
        currency: document.getElementById('currency').value,
        mileage: parseInt(document.getElementById('mileage').value),
        engine: document.getElementById('engine').value,
        transmission: document.getElementById('transmission').value,
        fuel: document.getElementById('fuel').value,
        city: document.getElementById('city').value,
        registration: document.getElementById('registration').value,
        description: document.getElementById('description').value,
        photos: [...uploadedPhotos],
        video: uploadedVideo,
        isTop: false,
        createdAt: new Date()
    };
    
    cars.push(newCar);
    tg.showAlert('Добавлено!');
    
    document.getElementById('addForm').reset();
    uploadedPhotos = [];
    uploadedVideo = null;
    document.getElementById('photoPreview').innerHTML = '';
    document.getElementById('videoPreview').innerHTML = '';
    
    closePage('addPage');
    navigate('main');
    render();
}

// Поиск
document.getElementById('searchInput').addEventListener('input', function(e) {
    filters.search = e.target.value.toLowerCase();
    render();
});

// Инициализация
render();
