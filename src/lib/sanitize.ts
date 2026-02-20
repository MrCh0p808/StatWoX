/**
 * Input Sanitization Utilities (SEC-004)
 * Strips HTML tags to prevent stored XSS attacks.
 */

/**
 * Strip all HTML tags from a string.
 * Preserves text content but removes any tags like <script>, <img>, etc.
 */
export function stripHtml(input: string): string {
    return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Sanitize a single string field.
 * Returns the stripped string, or undefined if input is falsy.
 */
export function sanitizeField(input: string | null | undefined): string | undefined {
    if (!input) return undefined;
    return stripHtml(input);
}

/**
 * Sanitize an object's string fields in-place.
 * Only processes keys listed in `fields`.
 */
export function sanitizeFields<T extends Record<string, unknown>>(
    obj: T,
    fields: (keyof T)[]
): T {
    for (const field of fields) {
        const value = obj[field];
        if (typeof value === 'string') {
            (obj as Record<string, unknown>)[field as string] = stripHtml(value);
        }
    }
    return obj;
}
