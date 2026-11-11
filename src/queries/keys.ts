/**
 * Every React Query cache key in one place. Keys are nested so a whole domain can be invalidated by
 * its prefix (e.g. `queryKeys.blog.all` after any blog write).
 */
export const queryKeys = {
    currentUser: ['auth', 'user'] as const,
    siteSettings: ['site-settings'] as const,
    profile: ['profile'] as const,
    projects: {
        all: ['projects'] as const,
        list: ['projects', 'list'] as const,
        detail: (projectId: string) => ['projects', 'detail', projectId] as const,
    },
    resumes: {
        all: ['resumes'] as const,
        list: ['resumes', 'list'] as const,
        active: ['resumes', 'active'] as const,
    },
    blog: {
        all: ['blog'] as const,
        published: (limit?: number) => ['blog', 'published', limit ?? 'all'] as const,
        everything: ['blog', 'everything'] as const,
        detail: (postId: string) => ['blog', 'detail', postId] as const,
        bySlug: (slug: string, includeUnpublished: boolean) => ['blog', 'slug', slug, includeUnpublished] as const,
    },
    media: ['media', 'blog'] as const,
};
