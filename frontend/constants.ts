import type { Survey } from './types';

// getting the backend url from the config object I injected, or falling back to localhost for dev work
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
export const GOOGLE_CLIENT_ID =
    (window as any).STATWOX_GOOGLE_CLIENT_ID || '';
