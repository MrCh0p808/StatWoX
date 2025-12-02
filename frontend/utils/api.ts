/* Unified fetch wrapper */
import { API_BASE_URL } from "../constants";

export async function apiFetch(path: string, opts: RequestInit = {}, expectJson = true) {
    if (!API_BASE_URL) {
        throw new Error("API_BASE_URL missing");
    }

    const token = localStorage.getItem("statwox_token");
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(opts.headers as Record<string, string> || {})
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const url = `${API_BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
    const response = await fetch(url, { ...opts, headers });

    if (!response.ok) {
        let body;
        try { body = await response.json(); } catch { body = await response.text(); }
        const msg = body?.message || body || `HTTP ${response.status}`;
        const err = new Error(msg);
        (err as any).response = response;
        throw err;
    }

    if (!expectJson) return response;
    return response.json();
}
