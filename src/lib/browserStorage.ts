import type { z } from 'zod';

/**
 * `localStorage` helpers that never throw. Storage can be unavailable (privacy modes, disabled
 * cookies), full, or hold data written by an older version of the app; callers get the fallback
 * instead of a crash.
 */

export function readStoredJson<Schema extends z.ZodType>(
    key: string,
    schema: Schema,
    fallback: z.output<Schema>
): z.output<Schema> {
    try {
        const raw = window.localStorage.getItem(key);

        if (raw === null) {
            return fallback;
        }

        const result = schema.safeParse(JSON.parse(raw));
        return result.success ? result.data : fallback;
    } catch {
        return fallback;
    }
}

/** Returns whether the value was saved (it isn't when storage is full or unavailable). */
export function writeStoredJson(key: string, value: unknown): boolean {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Couldn't save "${key}" to local storage:`, error);
        return false;
    }
}

export function readStoredRaw(key: string): string | null {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}
