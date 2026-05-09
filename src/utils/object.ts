export function compactUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
    return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as Partial<T>;
}

export function compactCreatePayload<T extends Record<string, unknown>>(data: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined && value !== null && value !== '')
    ) as Partial<T>;
}
