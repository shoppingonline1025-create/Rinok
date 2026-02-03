// ===============================
// МОДУЛЬ: Фильтр по цвету
// Версия: 1.0
// Дата: 03.02.2026
// Описание: Добавляет фильтр по цвету автомобиля
// ===============================

(function() {
    console.log('🎨 Загрузка модуля "Фильтр по цвету"...');
    
    // Проверка зависимостей
    if (typeof window.filters === 'undefined') {
        console.error('❌ Требуется основной скрипт с window.filters!');
        return;
    }
    
    // Данные: список цветов
    window.carColors = [
        'Белый', 'Черный', 'Серый', 'Серебристый',
        'Красный', 'Синий', 'Зеленый', 'Желтый',
        'Оранжевый', 'Коричневый', 'Бежевый', 'Золотой'
    ];
    
    // Добавляем поле в фильтры
    window.filters.color = '';
    
    // Функция применения фильтра
    window.applyColorFilter = function() {
        const color = document.getElementById('colorSelect').value;
        window.filters.color = color;
        
        // Обновляем UI
        const btn = document.getElementById('colorFilter');
        if (color) {
            btn.innerHTML = `${color} <span class="filter-clear" onclick="event.stopPropagation();clearColorFilter()">×</span>`;
            btn.classList.add('active');
        } else {
            btn.textContent = 'Цвет';
            btn.classList.remove('active');
        }
        
        // Закрываем модальное окно
        if (typeof window.closeModal === 'function') {
            window.closeModal('colorModal');
        }
        
        // Перерендериваем список
        if (typeof window.render === 'function') {
            window.render();
        }
    };
    
    // Функция сброса
    window.clearColorFilter = function() {
        window.filters.color = '';
        document.getElementById('colorFilter').textContent = 'Цвет';
        document.getElementById('colorFilter').classList.remove('active');
        if (typeof window.render === 'function') {
            window.render();
        }
    };
    
    // Добавление UI элементов после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initColorFilter);
    } else {
        initColorFilter();
    }
    
    function initColorFilter() {
        // 1. Добавляем кнопку фильтра
        const filtersScroll = document.querySelector('.filters-scroll');
        if (filtersScroll) {
            const btn = document.createElement('button');
            btn.className = 'filter-chip';
            btn.id = 'colorFilter';
            btn.textContent = 'Цвет';
            btn.onclick = () => {
                if (typeof window.openModal === 'function') {
                    window.openModal('colorModal');
                }
            };
            filtersScroll.appendChild(btn);
            console.log('✅ Кнопка фильтра добавлена');
        }
        
        // 2. Добавляем модальное окно
        const modal = document.createElement('div');
        modal.id = 'colorModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Цвет автомобиля</h3>
                <select id="colorSelect">
                    <option value="">Все цвета</option>
                    ${window.carColors.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
                <div class="modal-buttons">
                    <button class="btn-secondary" onclick="closeModal('colorModal')">Отмена</button>
                    <button class="btn-primary" onclick="applyColorFilter()">Применить</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        console.log('✅ Модальное окно добавлено');
    }
    
    console.log('✅ Модуль "Фильтр по цвету" загружен успешно!');
})();
