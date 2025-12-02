import type { Survey } from './types';

// Resolve backend URL from config.js (prod) or fallback to localhost (dev)
function resolveApiBase() {
    // @ts-ignore
    const injected = (window as any).STATWOX_API_URL;
    if (injected && typeof injected === 'string' && injected.length > 0) {
        return injected.replace(/\/$/, '');
    }

    if (process.env.NODE_ENV === 'development') {
        console.warn("Using localhost fallback");
        return 'http://localhost:5000';
    }

    console.error("API URL missing in production");
    return '';
}

export const API_BASE_URL = resolveApiBase();

// @ts-ignore
export const GOOGLE_CLIENT_ID = window.STATWOX_GOOGLE_CLIENT_ID || process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
