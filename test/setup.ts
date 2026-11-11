/**
 * Preloaded before every test file (see bunfig.toml).
 *
 * Gives the data layer a valid config (Bun exposes `process.env` as `import.meta.env`) and a
 * minimal in-memory `localStorage`, so browser-only modules can run under `bun test`.
 */
Object.assign(process.env, {
    VITE_APPWRITE_MAIN_ENDPOINT: 'https://appwrite.test/v1',
    VITE_APPWRITE_MAIN_PROJECT_ID: 'project',
    VITE_APPWRITE_DB_ID: 'db',
    VITE_APPWRITE_DB_PROFILE_COLLECTION_ID: 'profile',
    VITE_APPWRITE_DB_PROJECTS_COLLECTION_ID: 'projects',
    VITE_APPWRITE_DB_BLOG_COLLECTION_ID: 'blogs',
    VITE_APPWRITE_DB_SECTION_VISIBILITY_COLLECTION_ID: 'settings',
    VITE_APPWRITE_DB_RESUME_COLLECTION_ID: 'resumes',
    VITE_APPWRITE_STORAGE_FILE_BUCKET_ID: 'bucket',
});

class MemoryStorage {
    private items = new Map<string, string>();

    getItem(key: string) {
        return this.items.get(key) ?? null;
    }

    setItem(key: string, value: string) {
        this.items.set(key, String(value));
    }

    removeItem(key: string) {
        this.items.delete(key);
    }

    clear() {
        this.items.clear();
    }
}

const windowStub = globalThis as unknown as Record<string, unknown>;
windowStub.window ??= globalThis;
windowStub.localStorage = new MemoryStorage();
