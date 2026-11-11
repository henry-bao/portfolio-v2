/**
 * Appwrite Function `record-blog-view` (Bun runtime): counts one view of a published blog post.
 *
 * Guests can't write to the blogs table, so the site calls this function instead (execute: any).
 * It uses the per-execution API key Appwrite injects (scopes: rows.read, rows.write), checks that the
 * post exists and is published, then increments `viewCount` atomically.
 *
 * Request: POST, body `{ "postId": "<row id>" }`.
 * Variables: DATABASE_ID, BLOG_TABLE_ID (set on the function; see appwrite/README.md).
 *
 * No dependencies: it talks to the REST API with fetch, so there is no build step.
 */

interface FunctionContext {
    req: { method: string; bodyText?: string; headers: Record<string, string | undefined> };
    res: { json: (body: unknown, status?: number) => unknown };
    log: (message: string) => void;
    error: (message: string) => void;
}

const ROW_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/;

const readPostId = (bodyText: string | undefined): string | null => {
    try {
        const { postId } = JSON.parse(bodyText || '{}') as { postId?: unknown };
        return typeof postId === 'string' && ROW_ID_PATTERN.test(postId) ? postId : null;
    } catch {
        return null;
    }
};

export default async ({ req, res, error }: FunctionContext) => {
    if (req.method !== 'POST') {
        return res.json({ ok: false, error: 'method_not_allowed' }, 405);
    }

    const postId = readPostId(req.bodyText);

    if (!postId) {
        return res.json({ ok: false, error: 'invalid_post_id' }, 400);
    }

    const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT;
    const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
    const databaseId = process.env.DATABASE_ID;
    const tableId = process.env.BLOG_TABLE_ID;
    const apiKey = req.headers['x-appwrite-key'];

    if (!endpoint || !projectId || !databaseId || !tableId || !apiKey) {
        error('Missing configuration: check the DATABASE_ID and BLOG_TABLE_ID variables and the function scopes.');
        return res.json({ ok: false, error: 'misconfigured' }, 500);
    }

    const headers = { 'Content-Type': 'application/json', 'X-Appwrite-Project': projectId, 'X-Appwrite-Key': apiKey };
    const rowUrl = `${endpoint}/tablesdb/${encodeURIComponent(databaseId)}/tables/${encodeURIComponent(tableId)}/rows/${postId}`;

    const rowResponse = await fetch(rowUrl, { headers });

    if (rowResponse.status === 404) {
        return res.json({ ok: false, error: 'not_found' }, 404);
    }

    if (!rowResponse.ok) {
        error(`Reading post ${postId} failed with ${rowResponse.status}: ${await rowResponse.text()}`);
        return res.json({ ok: false, error: 'upstream_error' }, 502);
    }

    const post = (await rowResponse.json()) as { published?: unknown; viewCount?: unknown };

    // Unpublished posts don't exist as far as the public is concerned.
    if (post.published !== true) {
        return res.json({ ok: false, error: 'not_found' }, 404);
    }

    // An increment needs a number to start from; very old rows may have no count yet.
    const write =
        typeof post.viewCount === 'number'
            ? fetch(`${rowUrl}/viewCount/increment`, { method: 'PATCH', headers, body: JSON.stringify({ value: 1 }) })
            : fetch(rowUrl, { method: 'PATCH', headers, body: JSON.stringify({ data: { viewCount: 1 } }) });
    const writeResponse = await write;

    if (!writeResponse.ok) {
        error(`Counting a view of ${postId} failed with ${writeResponse.status}: ${await writeResponse.text()}`);
        return res.json({ ok: false, error: 'upstream_error' }, 502);
    }

    const { viewCount } = (await writeResponse.json()) as { viewCount?: number };
    return res.json({ ok: true, viewCount });
};
