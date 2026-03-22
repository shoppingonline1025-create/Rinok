/**
 * AutoMarket — Cloudflare Worker
 *
 * Парсит Telegram WebApp initData, выдаёт Firebase Custom Token
 * с uid = String(telegramUserId).
 *
 * Переменные окружения (Secrets):
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

            // Парсим initData и достаём user.id
            const params = new Map();
            for (const part of initData.split('&')) {
                const eqIdx = part.indexOf('=');
                if (eqIdx === -1) continue;
                const key = decodeURIComponent(part.slice(0, eqIdx));
                const value = decodeURIComponent(part.slice(eqIdx + 1));
                params.set(key, value);
            }

            const user = JSON.parse(params.get('user') || '{}');
            if (!user.id) {
                return corsResponse({ error: 'No user.id in initData' }, 400);
            }

            const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
            const token = await createFirebaseCustomToken(String(user.id), serviceAccount);

            return corsResponse({ token });
        } catch (e) {
            return corsResponse({ error: 'Internal error' }, 500);
        }
    }
};

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
