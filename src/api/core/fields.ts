import { z } from 'zod';
import { ApiError, fieldErrorsFromZod } from './errors';

/**
 * Reusable Zod building blocks for Appwrite columns.
 *
 * Read schemas (`read.*`) are forgiving: they turn Appwrite's `null`s into usable defaults so a
 * half-filled row still renders. Input schemas (`input.*`) are strict: they trim, enforce each
 * column's size limit with a readable message, and are what every write is checked against.
 */

export const isHttpUrl = (value: string) => {
    try {
        const { protocol } = new URL(value);
        return protocol === 'http:' || protocol === 'https:';
    } catch {
        return false;
    }
};

export const read = {
    /** Text the app always expects; a `null` (from a hand-edited or half-migrated row) becomes `''`. */
    string: () =>
        z
            .string()
            .nullish()
            .transform((value) => value ?? ''),

    /** Optional text column: `null`, missing or blank all become `null`. */
    text: () =>
        z
            .string()
            .nullish()
            .transform((value) => (value?.trim() ? value : null)),

    /** String array column: `null` or missing becomes `[]`, blank entries are dropped. */
    textList: () =>
        z
            .array(z.string().nullable())
            .nullish()
            .transform((values) => (values ?? []).filter((value): value is string => Boolean(value?.trim()))),

    /** Only http(s) links survive, so a bad value can never become a `javascript:` href. */
    httpUrl: () =>
        z
            .string()
            .nullish()
            .transform((value) => (value && isHttpUrl(value.trim()) ? value.trim() : null)),

    flag: (fallback: boolean) =>
        z
            .boolean()
            .nullish()
            .transform((value) => value ?? fallback),

    count: () =>
        z
            .number()
            .int()
            .nullish()
            .transform((value) => Math.max(0, value ?? 0)),
};

const tooLong = (label: string, max: number) => `${label} must be at most ${max.toLocaleString()} characters`;

export const input = {
    requiredText: (label: string, max: number) =>
        z.string().trim().min(1, `${label} is required`).max(max, tooLong(label, max)),

    /** Blank becomes `null`, which clears the column on update. */
    optionalText: (label: string, max: number) =>
        z
            .string()
            .trim()
            .max(max, tooLong(label, max))
            .nullish()
            .transform((value) => value || null),

    optionalHttpUrl: (label: string, max: number) =>
        z
            .string()
            .trim()
            .max(max, tooLong(label, max))
            .refine((value) => value === '' || isHttpUrl(value), `${label} must start with http:// or https://`)
            .nullish()
            .transform((value) => value || null),

    /** Trims entries, drops blanks and case-insensitive duplicates, and caps each entry's length. */
    textList: (label: string, maxItemLength: number, maxItems = 100) =>
        z
            .array(z.string())
            .default([])
            .transform((values) => {
                const seen = new Set<string>();
                return values
                    .map((value) => value.trim())
                    .filter((value) => {
                        const key = value.toLowerCase();
                        if (!value || seen.has(key)) return false;
                        seen.add(key);
                        return true;
                    });
            })
            .pipe(
                z
                    .array(z.string().max(maxItemLength, `Each ${label} entry must be at most ${maxItemLength} characters`))
                    .max(maxItems, `${label} can have at most ${maxItems} entries`)
            ),

    /** Any string `Date.parse` understands, stored as a full ISO timestamp. */
    isoDate: (label: string) =>
        z
            .string()
            .trim()
            .min(1, `${label} is required`)
            .refine((value) => !Number.isNaN(Date.parse(value)), `${label} is not a valid date`)
            .transform((value) => new Date(value).toISOString()),
};

/**
 * Validates form values against an input schema. Throws an `invalid_input` `ApiError` whose
 * `fieldErrors` the editors show next to the matching fields.
 */
export function parseInput<Schema extends z.ZodType>(schema: Schema, values: unknown): z.output<Schema> {
    const result = schema.safeParse(values);

    if (!result.success) {
        throw new ApiError('invalid_input', result.error.issues[0]?.message ?? 'Some of the values are invalid', {
            cause: result.error,
            fieldErrors: fieldErrorsFromZod(result.error),
        });
    }

    return result.data;
}
