
import type { Survey } from './types';

// Mock data removed. Use API instead.

// --- GLOBAL CONFIG ---
// BACKEND NOTE: Change this URL to point to your real backend server (e.g., http://localhost:3000 or your cloud URL).
// @ts-ignore
export const API_BASE_URL = window.STATWOX_API_URL || 'http://localhost:5000';

// @ts-ignore
export const GOOGLE_CLIENT_ID = window.STATWOX_GOOGLE_CLIENT_ID || process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
