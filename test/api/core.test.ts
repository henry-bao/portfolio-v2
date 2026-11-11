import { describe, expect, test } from 'bun:test';
import { AppwriteException } from 'appwrite';
import { z } from 'zod';
import { parseBackendConfig } from '../../src/api/core/env';
import { ApiError, getErrorMessage, isRetryable, toApiError } from '../../src/api/core/errors';
import { input, parseInput, read } from '../../src/api/core/fields';

const validEnv = {
    VITE_APPWRITE_MAIN_ENDPOINT: 'https://nyc.cloud.appwrite.io/v1/',
    VITE_APPWRITE_MAIN_PROJECT_ID: 'project',
    VITE_APPWRITE_DB_ID: 'db',
    VITE_APPWRITE_DB_PROFILE_COLLECTION_ID: 'profile',
    VITE_APPWRITE_DB_PROJECTS_COLLECTION_ID: 'projects',
    VITE_APPWRITE_DB_BLOG_COLLECTION_ID: 'blogs',
    VITE_APPWRITE_DB_SECTION_VISIBILITY_COLLECTION_ID: 'settings',
    VITE_APPWRITE_DB_RESUME_COLLECTION_ID: 'resumes',
    VITE_APPWRITE_STORAGE_FILE_BUCKET_ID: 'bucket',
};

describe('parseBackendConfig', () => {
    test('accepts a complete env, trims the endpoint slash and defaults the function id', () => {
        const result = parseBackendConfig(validEnv);

        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.config.endpoint).toBe('https://nyc.cloud.appwrite.io/v1');
        expect(result.config.functions.recordBlogView).toBe('record-blog-view');
        expect(result.config.tables.blogPosts).toBe('blogs');
    });

    test('lists every missing or malformed variable instead of throwing', () => {
        const result = parseBackendConfig({ ...validEnv, VITE_APPWRITE_DB_ID: undefined, VITE_APPWRITE_MAIN_ENDPOINT: 'ftp://x' });

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.problems.join('\n')).toContain('VITE_APPWRITE_DB_ID');
        expect(result.problems.join('\n')).toContain('VITE_APPWRITE_MAIN_ENDPOINT');
    });

    test('rejects ids Appwrite would never issue', () => {
        expect(parseBackendConfig({ ...validEnv, VITE_APPWRITE_DB_ID: '../db' }).ok).toBe(false);
    });
});

describe('toApiError', () => {
    test.each([
        [404, 'not_found'],
        [401, 'unauthorized'],
        [403, 'forbidden'],
        [409, 'conflict'],
        [429, 'rate_limited'],
        [400, 'invalid_input'],
        [0, 'network'],
        [503, 'unknown'],
    ] as const)('maps Appwrite %i to %s', (code, kind) => {
        const error = toApiError(new AppwriteException('boom', code, 'some_type'));

        expect(error.kind).toBe(kind);
        expect(error.status).toBe(code);
        expect(error.type).toBe('some_type');
    });

    test('treats a failed fetch as a network error', () => {
        expect(toApiError(new TypeError('Failed to fetch')).kind).toBe('network');
    });

    test('turns Zod errors into invalid_input with field errors', () => {
        const result = z.object({ title: z.string().min(1, 'Title is required') }).safeParse({ title: '' });
        const error = toApiError(result.error);

        expect(error.kind).toBe('invalid_input');
        expect(error.fieldErrors).toEqual({ title: 'Title is required' });
    });

    test('returns ApiErrors unchanged', () => {
        const original = new ApiError('conflict', 'Taken');
        expect(toApiError(original)).toBe(original);
    });
});

describe('getErrorMessage', () => {
    test('shows our own validation and conflict messages', () => {
        expect(getErrorMessage(new ApiError('conflict', 'Another post already uses the slug "x".'))).toBe(
            'Another post already uses the slug "x".'
        );
    });

    test("replaces Appwrite's raw messages with friendly ones", () => {
        const message = getErrorMessage(new AppwriteException('Document with the requested ID already exists', 409));
        expect(message).toBe('That conflicts with data that already exists.');
    });

    test('never leaks unknown error text', () => {
        expect(getErrorMessage(new Error('stack trace soup'))).toBe('Something went wrong. Try again.');
    });
});

test('isRetryable only retries failures that can go away on their own', () => {
    expect(isRetryable(new AppwriteException('down', 503))).toBe(true);
    expect(isRetryable(new AppwriteException('slow down', 429))).toBe(true);
    expect(isRetryable(new TypeError('Failed to fetch'))).toBe(true);
    expect(isRetryable(new AppwriteException('missing', 404))).toBe(false);
    expect(isRetryable(new AppwriteException('nope', 401))).toBe(false);
});

describe('field schemas', () => {
    test('read.httpUrl drops anything that is not http(s)', () => {
        const schema = read.httpUrl();
        expect(schema.parse('javascript:alert(1)')).toBeNull();
        expect(schema.parse(' https://example.com ')).toBe('https://example.com');
        expect(schema.parse(null)).toBeNull();
    });

    test('read.textList tolerates null columns and blank entries', () => {
        expect(read.textList().parse(null)).toEqual([]);
        expect(read.textList().parse(['a', ' ', null, 'b'])).toEqual(['a', 'b']);
    });

    test('input.optionalHttpUrl accepts blank as "clear" and rejects other protocols', () => {
        const schema = input.optionalHttpUrl('Link', 99);
        expect(schema.parse('  ')).toBeNull();
        expect(schema.safeParse('javascript:alert(1)').success).toBe(false);
        expect(schema.safeParse(`https://example.com/${'a'.repeat(99)}`).success).toBe(false);
    });

    test('input.textList trims, drops blanks and case-insensitive duplicates, and caps entries', () => {
        const schema = input.textList('Tag', 5, 2);
        expect(schema.parse([' One ', '', 'one', 'Two'])).toEqual(['One', 'Two']);
        expect(schema.safeParse(['toolong']).success).toBe(false);
        expect(schema.safeParse(['a', 'b', 'c']).success).toBe(false);
    });

    test('input.isoDate normalizes date inputs to UTC midnight timestamps', () => {
        expect(input.isoDate('Date').parse('2025-03-27')).toBe('2025-03-27T00:00:00.000Z');
        expect(input.isoDate('Date').safeParse('not a date').success).toBe(false);
    });

    test('parseInput reports every invalid field', () => {
        const schema = z.object({ title: input.requiredText('Title', 5), body: input.requiredText('Body', 5) });

        try {
            parseInput(schema, { title: '', body: 'way too long' });
            throw new Error('should have thrown');
        } catch (error) {
            expect(error).toBeInstanceOf(ApiError);
            expect((error as ApiError).fieldErrors).toEqual({
                title: 'Title is required',
                body: 'Body must be at most 5 characters',
            });
        }
    });
});
