/**
 * The data layer: every read and write the app makes goes through these modules.
 *
 * core/      Appwrite client, env validation, errors, and the table/file/transaction primitives
 * *.ts       one module per domain, each owning its Zod schemas, types and operations
 *
 * React code should use the hooks in src/queries, which add caching and invalidation on top.
 */
export { ApiError, getErrorMessage, getFieldErrors, isApiError } from './core/errors';
export type { ApiErrorKind } from './core/errors';
export { FILE_RULES, KEEP_FILE, acceptAttribute, fileUrl, validateFile } from './core/files';
export type { FileChange, FileKind, StoredFile } from './core/files';

export * as authApi from './auth';
export * as blogApi from './blog';
export * as draftsApi from './drafts';
export * as mediaApi from './media';
export * as profileApi from './profile';
export * as projectsApi from './projects';
export * as resumesApi from './resumes';
export * as siteSettingsApi from './siteSettings';

export type { User } from './auth';
export type { BlogPost, BlogPostInput } from './blog';
export type { BlogDraft } from './drafts';
export type { Profile, ProfileInput } from './profile';
export type { Project, ProjectInput } from './projects';
export type { Resume } from './resumes';
export type { SiteSection, SiteSettings } from './siteSettings';
