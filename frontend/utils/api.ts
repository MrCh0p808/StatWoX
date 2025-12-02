/* Unified fetch wrapper for StatWoX frontend */
import { API_BASE_URL } from "../constants";

export async function apiFetch(path: string, opts: RequestInit = {}, expectJson = true) {
    if (!API_BASE_URL) {
        throw new Error("API_BASE_URL is not configured. Check config.js or environment.");
    }

    const token = localStorage.getItem("statwox_token");
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(opts.headers as Record<string, string> || {})
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`, {
        ...opts,
        headers,
    });

    if (!response.ok) {
        // try to parse JSON error body, otherwise fallback to text
        let body;
        try { body = await response.json(); } catch { body = await response.text(); }
        const msg = body?.message || body || `HTTP ${response.status} ${response.statusText}`;
        const err = new Error(msg);
        // attach raw response for debugging
        (err as any).response = response;
        throw err;
    }

    if (!expectJson) return response;
    return response.json();
}
