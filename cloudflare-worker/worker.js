/**
 * AutoMarket — Cloudflare Worker
 *
 * Проверяет подпись Telegram WebApp initData (HMAC-SHA256),
 * выдаёт Firebase Custom Token с uid = String(telegramUserId).
 *
 * Переменные окружения (Secrets):
 *   BOT_TOKEN               — токен Telegram-бота (от @BotFather)
 *   FIREBASE_SERVICE_ACCOUNT — содержимое service-account JSON из Firebase Console
 */

export default {
    async fetch(request, env) {
        // CORS preflight
        if (request.method === 'OPTIONS') {
            return corsResponse(null, 204);
        }
        if (request.method !== 'POST') {
            return corsResponse({ error: 'Method not allowed' }, 405);
        }

        try {
            const { initData } = await request.json();

            if (!initData) {
                return corsResponse({ error: 'No initData' }, 400);
            }

            const { userId, reason, debug } = await verifyTelegramInitData(initData, env.BOT_TOKEN);
            if (!userId) {
                // debug-поля помогут понять причину hash_mismatch
                return corsResponse({ error: 'Invalid or expired initData', reason, debug }, 401);
            }

            const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
            const token = await createFirebaseCustomToken(String(userId), serviceAccount);

            return corsResponse({ token });
        } catch (e) {
            return corsResponse({ error: 'Internal error', detail: e.message }, 500);
        }
    }
};

// ─── Telegram initData verification ───────────────────────────────────────────

async function verifyTelegramInitData(initData, botToken) {
    if (!initData) return { userId: null, reason: 'no_initData' };
    if (!botToken) return { userId: null, reason: 'no_botToken' };

    const cleanToken = botToken.trim();

    // Разбираем initData вручную (без URLSearchParams — чтобы контролировать декодирование)
    const parts = initData.split('&');
    let receivedHash = null;
    const entries = [];

    for (const part of parts) {
        const eqIdx = part.indexOf('=');
        if (eqIdx === -1) continue;
        const key = decodeURIComponent(part.slice(0, eqIdx));
        const value = decodeURIComponent(part.slice(eqIdx + 1));
        if (key === 'hash') {
            receivedHash = value;
        } else {
            entries.push([key, value]);
        }
    }

    if (!receivedHash) return { userId: null, reason: 'no_hash' };

    // data_check_string: отсортированные пары key=value через \n
    const checkString = entries
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('\n');

    const encoder = new TextEncoder();

    // secret_key = HMAC-SHA256(bot_token, "WebAppData")
    const secretKeyBase = await crypto.subtle.importKey(
        'raw', encoder.encode('WebAppData'),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const secretKey = await crypto.subtle.sign('HMAC', secretKeyBase, encoder.encode(cleanToken));

    // computed_hash = HMAC-SHA256(secret_key, data_check_string)
    const hmacKey = await crypto.subtle.importKey(
        'raw', secretKey,
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', hmacKey, encoder.encode(checkString));

    const computedHash = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    if (computedHash !== receivedHash) {
        return {
            userId: null,
            reason: 'hash_mismatch',
            debug: {
                tokenLength: cleanToken.length,
                tokenFirst5: cleanToken.slice(0, 5),   // первые символы токена для проверки
                tokenLast5:  cleanToken.slice(-5),      // последние символы токена
                checkStringPreview: checkString.slice(0, 120),
                computedHash,
                receivedHash,
            }
        };
    }

    // Проверяем свежесть (не старше 24 часов)
    const authDate = parseInt(entries.find(([k]) => k === 'auth_date')?.[1] || '0');
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
        return { userId: null, reason: `expired`, debug: { ageSeconds: now - authDate } };
    }

    const userEntry = entries.find(([k]) => k === 'user');
    const user = JSON.parse(userEntry?.[1] || '{}');
    if (!user.id) return { userId: null, reason: 'no_user_id' };

    return { userId: user.id, reason: null, debug: null };
}

// ─── Firebase Custom Token (JWT RS256) ────────────────────────────────────────

async function createFirebaseCustomToken(uid, serviceAccount) {
    const now = Math.floor(Date.now() / 1000);

    const payload = {
        iss: serviceAccount.client_email,
        sub: serviceAccount.client_email,
        aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
        iat: now,
        exp: now + 3600,
        uid,
    };

    const privateKey = await importPrivateKey(serviceAccount.private_key);

    const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const body   = base64url(JSON.stringify(payload));
    const signingInput = `${header}.${body}`;

    const encoder = new TextEncoder();
    const signature = await crypto.subtle.sign(
        { name: 'RSASSA-PKCS1-v1_5' },
        privateKey,
        encoder.encode(signingInput)
    );

    return `${signingInput}.${base64urlBytes(new Uint8Array(signature))}`;
}

async function importPrivateKey(pem) {
    const pemContents = pem
        .replace(/-----BEGIN PRIVATE KEY-----/, '')
        .replace(/-----END PRIVATE KEY-----/, '')
        .replace(/\s/g, '');
    const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
    return crypto.subtle.importKey(
        'pkcs8', binaryDer,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false, ['sign']
    );
}

function base64url(str) {
    return btoa(unescape(encodeURIComponent(str)))
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlBytes(bytes) {
    return btoa(String.fromCharCode(...bytes))
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// ─── CORS helpers ──────────────────────────────────────────────────────────────

function corsResponse(data, status = 200) {
    return new Response(data ? JSON.stringify(data) : null, {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
