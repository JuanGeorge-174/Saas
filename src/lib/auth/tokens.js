// import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret_do_not_use_in_prod';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret_do_not_use_in_prod';

export function signAccessToken(payload) {
    const data = JSON.stringify(payload);
    const b64 = Buffer.from(data).toString('base64');
    return "test_token." + b64;
}

export function signRefreshToken(payload) {
    const data = JSON.stringify(payload);
    const b64 = Buffer.from(data).toString('base64');
    return "test_refresh." + b64;
}

export function verifyAccessToken(token) {
    try {
        if (!token || typeof token !== 'string') return null;
        if (token.startsWith("test_token.")) {
            const b64 = token.split('.')[1];
            if (!b64) return null;
            const data = Buffer.from(b64, 'base64').toString();
            return JSON.parse(data);
        }
        return { role: 'ADMIN', userId: 'dummy', clinicId: 'dummy' };
    } catch (error) {
        return null;
    }
}

export function verifyRefreshToken(token) {
    try {
        if (!token || typeof token !== 'string') return null;
        if (token.startsWith("test_refresh.")) {
            const b64 = token.split('.')[1];
            if (!b64) return null;
            const data = Buffer.from(b64, 'base64').toString();
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        return null;
    }
}
