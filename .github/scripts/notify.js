/**
 * AutoMarket — уведомления по сохранённым фильтрам
 * Запускается каждые 5 минут через GitHub Actions
 */

const FIREBASE_URL = 'https://auto-market26-default-rtdb.europe-west1.firebasedatabase.app';
const FIREBASE_SECRET = process.env.FIREBASE_SECRET;
const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_USERNAME = 'Auto_Market_PMRbot';

const CATEGORY_NAMES = {
    car: 'Легковые', truck: 'Грузовые', moto: 'Мото',
    special: 'Спецтехника', parts: 'Запчасти', water: 'Водный транспорт'
};

// ─── Firebase REST API ────────────────────────────────────────────────────────

async function fbGet(path) {
    const res = await fetch(`${FIREBASE_URL}/${path}.json?auth=${FIREBASE_SECRET}`);
    if (!res.ok) throw new Error(`Firebase GET /${path} — ${res.status}`);
    return res.json();
}

async function fbSet(path, value) {
    const res = await fetch(`${FIREBASE_URL}/${path}.json?auth=${FIREBASE_SECRET}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value)
    });
    if (!res.ok) throw new Error(`Firebase SET /${path} — ${res.status}`);
}

// ─── Telegram ─────────────────────────────────────────────────────────────────

async function sendMessage(chatId, text, replyMarkup = null) {
    const body = { chat_id: chatId, text, parse_mode: 'HTML' };
    if (replyMarkup) body.reply_markup = replyMarkup;
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!data.ok) {
        console.warn(`⚠️ Telegram [${chatId}]: ${data.description}`);
    }
    return data.ok;
}

// ─── Логика совпадения ────────────────────────────────────────────────────────

function matchesFilter(car, filter) {
    if (filter.category && car.category !== filter.category) return false;
    if (filter.brand && car.brand?.toLowerCase() !== filter.brand.toLowerCase()) return false;
    if (filter.model && !car.model?.toLowerCase().includes(filter.model.toLowerCase())) return false;
    if (filter.yearFrom && Number(car.year) < Number(filter.yearFrom)) return false;
    if (filter.yearTo && Number(car.year) > Number(filter.yearTo)) return false;
    // Цена проверяется только если валюта совпадает
    if ((filter.priceFrom || filter.priceTo) && filter.priceCurrency && car.currency !== filter.priceCurrency) return false;
    if (filter.priceFrom && Number(car.price) < Number(filter.priceFrom)) return false;
    if (filter.priceTo && Number(car.price) > Number(filter.priceTo)) return false;
    if (filter.city && !car.city?.toLowerCase().includes(filter.city.toLowerCase())) return false;
    return true;
}

function buildFilterName(filter) {
    const parts = [];
    if (filter.brand) parts.push(filter.brand);
    if (filter.model) parts.push(filter.model);
    if (!parts.length && filter.category) parts.push(CATEGORY_NAMES[filter.category] || filter.category);
    if (!parts.length) parts.push('Все объявления');
    return parts.join(' ');
}

function formatMessage(car, filterName) {
    const emoji = { car: '🚗', truck: '🚚', moto: '🏍', special: '🚜', parts: '🔧', water: '🚤' }[car.category] || '🚗';
    const title = car.category === 'parts'
        ? (car.partTitle || `${car.partType} • ${car.brand}`)
        : `${car.brand}${car.model ? ' ' + car.model : ''}${car.year ? ', ' + car.year + ' г.' : ''}`;
    const price = Number(car.price).toLocaleString('ru') + ' ' + (car.currency || 'руб');

    const lines = [
        `🔔 <b>Новое по фильтру «${filterName}»</b>`,
        '',
        `${emoji} <b>${title}</b>`,
        `💰 ${price}`,
    ];
    if (car.city) lines.push(`📍 ${car.city}`);
    if (car.mileage) lines.push(`🔢 ${Number(car.mileage).toLocaleString('ru')} км`);
    if (car.engine) lines.push(`🔧 ${car.engine}`);
    if (car.description) {
        const desc = car.description.length > 120 ? car.description.slice(0, 120) + '…' : car.description;
        lines.push(`\n📝 ${desc}`);
    }
    return lines.join('\n');
}

function makeOpenButton(carId) {
    return {
        inline_keyboard: [[{
            text: '👀 Открыть объявление',
            url: `https://t.me/${BOT_USERNAME}?startapp=listing_${carId}`
        }]]
    };
}

// ─── Главная функция ──────────────────────────────────────────────────────────

async function main() {
    console.log('🔍 Старт проверки фильтров:', new Date().toISOString());

    const [allFilters, allCarsRaw] = await Promise.all([
        fbGet('savedFilters'),
        fbGet('cars')
    ]);

    if (!allFilters) { console.log('Нет сохранённых фильтров'); return; }
    if (!allCarsRaw) { console.log('Нет объявлений'); return; }

    const cars = Object.values(allCarsRaw).filter(Boolean);
    let sent = 0;

    for (const [userId, filtersObj] of Object.entries(allFilters)) {
        if (!filtersObj) continue;

        for (const [filterId, filter] of Object.entries(filtersObj)) {
            if (!filter || filter.active === false) continue;
            // Проверяем срок действия подписки
            if (filter.expiresAt && new Date(filter.expiresAt) < new Date()) {
                console.log(`⏰ Подписка истекла у пользователя ${userId}`);
                continue;
            }

            // Смотрим только объявления новее этой метки
            const since = filter.lastNotifiedAt
                ? new Date(filter.lastNotifiedAt).getTime()
                : filter.createdAt
                    ? new Date(filter.createdAt).getTime()
                    : Date.now();

            const matches = cars.filter(car => {
                if (!car.createdAt) return false;
                return new Date(car.createdAt).getTime() > since && matchesFilter(car, filter);
            });

            if (matches.length === 0) continue;

            const filterName = filter.name || buildFilterName(filter);
            console.log(`✅ Пользователь ${userId}, фильтр «${filterName}»: ${matches.length} совпадений`);

            // Отправляем не более 3 сообщений за раз
            for (const car of matches.slice(0, 3)) {
                await sendMessage(userId, formatMessage(car, filterName), makeOpenButton(car.id));
                sent++;
                await new Promise(r => setTimeout(r, 300)); // пауза между сообщениями
            }

            if (matches.length > 3) {
                await sendMessage(userId, `...и ещё ${matches.length - 3} объявлений по этому фильтру. Откройте приложение чтобы посмотреть все.`);
            }

            // Обновляем метку последнего уведомления
            await fbSet(`savedFilters/${userId}/${filterId}/lastNotifiedAt`, new Date().toISOString());
        }
    }

    console.log(`✅ Готово. Отправлено уведомлений: ${sent}`);
}

main().catch(err => {
    console.error('❌ Ошибка:', err.message);
    process.exit(1);
});
