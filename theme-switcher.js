// ===============================
// МОДУЛЬ: Переключатель темы
// Версия: 1.0
// Дата: 03.02.2026
// Описание: Добавляет кнопку переключения светлой/темной темы
// ===============================

(function() {
    console.log('🌓 Загрузка модуля "Переключатель темы"...');
    
    // Темы
    const themes = {
        dark: {
            '--bg': '#1a1a1a',
            '--bg2': '#2a2a2a',
            '--card': '#242424',
            '--text': '#ffffff',
            '--text2': '#b0b0b0',
            '--hint': '#707070',
            '--border': '#3a3a3a'
        },
        light: {
            '--bg': '#ffffff',
            '--bg2': '#f5f5f5',
            '--card': '#ffffff',
            '--text': '#000000',
            '--text2': '#666666',
            '--hint': '#999999',
            '--border': '#e5e5ea'
        }
    };
    
    // Функция переключения темы
    window.switchTheme = function() {
        const root = document.documentElement;
        const currentBg = getComputedStyle(root).getPropertyValue('--bg').trim();
        
        // Определяем текущую тему
        const isDark = currentBg === 'rgb(26, 26, 26)' || currentBg === '#1a1a1a';
        const newTheme = isDark ? 'light' : 'dark';
        
        // Применяем новую тему
        const theme = themes[newTheme];
        Object.entries(theme).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
        
        // Обновляем иконку кнопки
        const btn = document.getElementById('themeToggle');
        if (btn) {
            btn.textContent = isDark ? '🌞' : '🌙';
        }
        
        // Сохраняем выбор в localStorage
        localStorage.setItem('theme', newTheme);
        
        console.log(`✅ Тема изменена на: ${newTheme}`);
    };
    
    // Инициализация
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemeSwitcher);
    } else {
        initThemeSwitcher();
    }
    
    function initThemeSwitcher() {
        // Добавляем кнопку в header
        const header = document.querySelector('.header');
        if (header) {
            const btn = document.createElement('button');
            btn.id = 'themeToggle';
            btn.style.cssText = `
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                margin-left: auto;
                padding: 8px;
            `;
            btn.textContent = '🌙';
            btn.onclick = switchTheme;
            btn.title = 'Переключить тему';
            header.appendChild(btn);
            console.log('✅ Кнопка переключения темы добавлена');
        }
        
        // Восстанавливаем сохраненную тему
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            const root = document.documentElement;
            Object.entries(themes.light).forEach(([key, value]) => {
                root.style.setProperty(key, value);
            });
            const btn = document.getElementById('themeToggle');
            if (btn) btn.textContent = '🌞';
            console.log('✅ Восстановлена светлая тема');
        }
    }
    
    console.log('✅ Модуль "Переключатель темы" загружен успешно!');
})();
