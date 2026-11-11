import { z } from 'zod';

/**
 * Every Appwrite id the app needs, read from `VITE_*` env vars and validated once at startup.
 *
 * The same variables are configured on both deploy hosts (Vercel and Appwrite Sites), so add new
 * required ones sparingly: a missing value takes the data layer offline on whichever host lacks it.
 */
const appwriteId = z
    .string({ error: 'is missing' })
    .trim()
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/, 'is not a valid Appwrite id');

const envSchema = z.object({
    VITE_APPWRITE_MAIN_ENDPOINT: z.url({ protocol: /^https?$/, error: 'is not a valid URL' }),
    VITE_APPWRITE_MAIN_PROJECT_ID: appwriteId,
    VITE_APPWRITE_DB_ID: appwriteId,
    VITE_APPWRITE_DB_PROFILE_COLLECTION_ID: appwriteId,
    VITE_APPWRITE_DB_PROJECTS_COLLECTION_ID: appwriteId,
    VITE_APPWRITE_DB_BLOG_COLLECTION_ID: appwriteId,
    VITE_APPWRITE_DB_SECTION_VISIBILITY_COLLECTION_ID: appwriteId,
    VITE_APPWRITE_DB_RESUME_COLLECTION_ID: appwriteId,
    /** The project's only storage bucket (the plan allows one); files are grouped into folders inside it. */
    VITE_APPWRITE_STORAGE_FILE_BUCKET_ID: appwriteId,
    /** Optional so neither host needs a new variable; the function is created with this fixed id. */
    VITE_APPWRITE_FUNCTION_BLOG_VIEW_ID: appwriteId.default('record-blog-view'),
});

export interface BackendConfig {
    endpoint: string;
    projectId: string;
    databaseId: string;
    bucketId: string;
    tables: {
        profile: string;
        projects: string;
        blogPosts: string;
        siteSettings: string;
        resumes: string;
    };
    functions: {
        recordBlogView: string;
    };
}

export type ConfigResult = { ok: true; config: BackendConfig } | { ok: false; problems: string[] };

export function parseBackendConfig(source: Record<string, unknown>): ConfigResult {
    const result = envSchema.safeParse(source);

    if (!result.success) {
        return {
            ok: false,
            problems: result.error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`),
        };
    }

    const env = result.data;

    return {
        ok: true,
        config: {
            endpoint: env.VITE_APPWRITE_MAIN_ENDPOINT.replace(/\/+$/, ''),
            projectId: env.VITE_APPWRITE_MAIN_PROJECT_ID,
            databaseId: env.VITE_APPWRITE_DB_ID,
            bucketId: env.VITE_APPWRITE_STORAGE_FILE_BUCKET_ID,
            tables: {
                profile: env.VITE_APPWRITE_DB_PROFILE_COLLECTION_ID,
                projects: env.VITE_APPWRITE_DB_PROJECTS_COLLECTION_ID,
                blogPosts: env.VITE_APPWRITE_DB_BLOG_COLLECTION_ID,
                siteSettings: env.VITE_APPWRITE_DB_SECTION_VISIBILITY_COLLECTION_ID,
                resumes: env.VITE_APPWRITE_DB_RESUME_COLLECTION_ID,
            },
            functions: {
                recordBlogView: env.VITE_APPWRITE_FUNCTION_BLOG_VIEW_ID,
            },
        },
    };
}
