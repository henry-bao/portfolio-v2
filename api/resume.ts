import { z } from 'zod';

/**
 * Vercel Function behind the public resume link.
 *
 * vercel.json rewrites `/resume` (canonical) and `/resume-redirect` (legacy alias, shared externally)
 * here. It looks up the active row of the resumes table and answers with a 302 to that version's file.
 * Being a real HTTP redirect, the link works for crawlers, link previews, ATS bots and curl, without
 * booting the SPA.
 *
 * Every version keeps its own file id: Appwrite tells browsers to cache a file's view URL for 45 days,
 * so redirecting to a per-version URL is what keeps a new upload from being shadowed by an old cache.
 *
 * Self-contained on purpose (only `zod` from node_modules): Vercel bundles each function on its own,
 * so it reads the same `VITE_APPWRITE_*` env vars as the app instead of importing app code.
 */

const appwriteId = z.string().trim().min(1);

const envSchema = z.object({
    VITE_APPWRITE_MAIN_ENDPOINT: z.url({ protocol: /^https?$/ }),
    VITE_APPWRITE_MAIN_PROJECT_ID: appwriteId,
    VITE_APPWRITE_DB_ID: appwriteId,
    VITE_APPWRITE_DB_RESUME_COLLECTION_ID: appwriteId,
    VITE_APPWRITE_STORAGE_FILE_BUCKET_ID: appwriteId,
});

const activeRowsSchema = z.object({
    rows: z.array(z.object({ fileId: z.string().trim().min(1) })),
});

/** Edge-cache the redirect briefly, and keep serving it while revalidating. Browsers don't cache it. */
const CACHE_REDIRECT = 'public, s-maxage=60, stale-while-revalidate=86400';
const CACHE_NOT_FOUND = 'public, s-maxage=60';
const CACHE_NONE = 'no-store';
const APPWRITE_TIMEOUT_MS = 5000;

const textResponse = (status: number, message: string, cacheControl: string) =>
    new Response(`${message}\n`, {
        status,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': cacheControl },
    });

const unavailable = () => textResponse(502, 'The resume is temporarily unavailable. Try again shortly.', CACHE_NONE);

export async function resolveResume(
    env: Record<string, string | undefined>,
    fetchImpl: typeof fetch = fetch
): Promise<Response> {
    const config = envSchema.safeParse(env);

    if (!config.success) {
        console.error(`Resume redirect is misconfigured: ${z.prettifyError(config.error)}`);
        return textResponse(500, 'The resume link is not configured.', CACHE_NONE);
    }

    const {
        VITE_APPWRITE_MAIN_ENDPOINT: rawEndpoint,
        VITE_APPWRITE_MAIN_PROJECT_ID: projectId,
        VITE_APPWRITE_DB_ID: databaseId,
        VITE_APPWRITE_DB_RESUME_COLLECTION_ID: tableId,
        VITE_APPWRITE_STORAGE_FILE_BUCKET_ID: bucketId,
    } = config.data;
    const endpoint = rawEndpoint.replace(/\/+$/, '');

    // Same queries the app uses: the active row, newest first if there were ever two.
    const rowsUrl = new URL(
        `${endpoint}/tablesdb/${encodeURIComponent(databaseId)}/tables/${encodeURIComponent(tableId)}/rows`
    );
    for (const query of [
        { method: 'equal', attribute: 'isActive', values: [true] },
        { method: 'orderDesc', attribute: 'uploadDate' },
        { method: 'limit', values: [1] },
    ]) {
        rowsUrl.searchParams.append('queries[]', JSON.stringify(query));
    }
    rowsUrl.searchParams.set('total', 'false');

    let rowsResponse: Response;

    try {
        rowsResponse = await fetchImpl(rowsUrl, {
            headers: { 'X-Appwrite-Project': projectId },
            signal: AbortSignal.timeout(APPWRITE_TIMEOUT_MS),
        });
    } catch (error) {
        console.error('Resume lookup failed to reach Appwrite:', error);
        return unavailable();
    }

    if (!rowsResponse.ok) {
        console.error(`Resume lookup failed: Appwrite responded ${rowsResponse.status}`, await rowsResponse.text());
        return unavailable();
    }

    const rows = activeRowsSchema.safeParse(await rowsResponse.json().catch(() => null));

    if (!rows.success) {
        console.error(`Resume lookup returned unexpected data: ${z.prettifyError(rows.error)}`);
        return unavailable();
    }

    const [active] = rows.data.rows;

    if (!active) {
        return textResponse(404, 'No resume is published right now.', CACHE_NOT_FOUND);
    }

    const fileUrl = new URL(
        `${endpoint}/storage/buckets/${encodeURIComponent(bucketId)}/files/${encodeURIComponent(active.fileId)}/view`
    );
    fileUrl.searchParams.set('project', projectId);

    return new Response(null, {
        status: 302,
        headers: { Location: fileUrl.toString(), 'Cache-Control': CACHE_REDIRECT },
    });
}

export function GET() {
    return resolveResume(process.env);
}

export function HEAD() {
    return resolveResume(process.env);
}
