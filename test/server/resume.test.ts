import { describe, expect, spyOn, test } from 'bun:test';
import { resolveResume } from '../../api/resume';

const env = {
    VITE_APPWRITE_MAIN_ENDPOINT: 'https://nyc.cloud.appwrite.io/v1/',
    VITE_APPWRITE_MAIN_PROJECT_ID: 'project',
    VITE_APPWRITE_DB_ID: 'db',
    VITE_APPWRITE_DB_RESUME_COLLECTION_ID: 'resumes',
    VITE_APPWRITE_STORAGE_FILE_BUCKET_ID: 'bucket',
};

const fakeFetch = (respond: (url: URL, init?: RequestInit) => Response | Promise<Response>) => {
    const calls: Array<{ url: URL; init?: RequestInit }> = [];
    const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
        const url = new URL(input instanceof Request ? input.url : input);
        calls.push({ url, init });
        return respond(url, init);
    }) as typeof fetch;
    return { fetchImpl, calls };
};

const quietly = async <T>(run: () => Promise<T>) => {
    const consoleError = spyOn(console, 'error').mockImplementation(() => {});
    try {
        return await run();
    } finally {
        consoleError.mockRestore();
    }
};

describe('api/resume', () => {
    test('302s to the active version with an edge-cacheable header', async () => {
        const { fetchImpl, calls } = fakeFetch(() => Response.json({ rows: [{ fileId: 'file-123' }] }));

        const response = await resolveResume(env, fetchImpl);

        expect(response.status).toBe(302);
        expect(response.headers.get('Location')).toBe(
            'https://nyc.cloud.appwrite.io/v1/storage/buckets/bucket/files/file-123/view?project=project'
        );
        expect(response.headers.get('Cache-Control')).toBe('public, s-maxage=60, stale-while-revalidate=86400');

        const [{ url, init }] = calls;
        expect(url.pathname).toBe('/v1/tablesdb/db/tables/resumes/rows');
        expect(url.searchParams.getAll('queries[]').map((query) => JSON.parse(query).method)).toEqual([
            'equal',
            'orderDesc',
            'limit',
        ]);
        expect(new Headers(init?.headers).get('X-Appwrite-Project')).toBe('project');
    });

    test('404s when no version is active, never falling back to a stale file', async () => {
        const { fetchImpl } = fakeFetch(() => Response.json({ rows: [] }));

        const response = await resolveResume(env, fetchImpl);

        expect(response.status).toBe(404);
        expect(response.headers.get('Location')).toBeNull();
    });

    test('502s without caching when Appwrite fails or returns junk', async () => {
        const down = await quietly(() => resolveResume(env, fakeFetch(() => new Response('oops', { status: 500 })).fetchImpl));
        const junk = await quietly(() => resolveResume(env, fakeFetch(() => Response.json({ rows: [{}] })).fetchImpl));
        const offline = await quietly(() =>
            resolveResume(
                env,
                fakeFetch(() => {
                    throw new TypeError('fetch failed');
                }).fetchImpl
            )
        );

        for (const response of [down, junk, offline]) {
            expect(response.status).toBe(502);
            expect(response.headers.get('Cache-Control')).toBe('no-store');
        }
    });

    test('500s when env vars are missing', async () => {
        const response = await quietly(() => resolveResume({ ...env, VITE_APPWRITE_DB_ID: undefined }));
        expect(response.status).toBe(500);
    });
});
