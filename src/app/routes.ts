/** Every path in the app. Build links from these, never from string literals. */
export const routes = {
    home: '/',
    blogs: '/blogs',
    blogPost: '/blogs/:slug',
    blogPostBySlug: (slug: string) => `/blogs/${encodeURIComponent(slug)}`,
    /** A saved post as admins see it, including unpublished posts. */
    blogPostAdminPreview: (slug: string) => `/blogs/${encodeURIComponent(slug)}?preview=true`,
    /** A local draft rendered as a post. `preview` is reserved, so no real post can take this slug. */
    blogDraftPreview: (draftId: string) => `/blogs/preview?draft=${encodeURIComponent(draftId)}`,
    /**
     * The canonical public resume link. On Vercel, vercel.json sends it to api/resume.ts (a real 302);
     * elsewhere the SPA's ResumePage handles it. Link to it with a plain `<a href>`, never a router
     * `<Link>`, which would stay inside the SPA and skip the server redirect.
     */
    resume: '/resume',
    /** Legacy alias of `resume`, kept because it has been shared externally. */
    resumeLegacy: '/resume-redirect',
    admin: {
        root: '/admin',
        login: '/admin/login',
        overview: '/admin/overview',
        profile: '/admin/profile',
        projects: '/admin/projects',
        projectNew: '/admin/projects/new',
        projectEdit: (projectId: string) => `/admin/projects/edit/${encodeURIComponent(projectId)}`,
        resumes: '/admin/resumes',
        blogs: '/admin/blogs',
        blogNew: '/admin/blogs/new',
        /** Reopens a local draft of a post that was never saved. */
        blogNewFromDraft: (draftId: string) => `/admin/blogs/new?draft=${encodeURIComponent(draftId)}`,
        blogEdit: (postId: string) => `/admin/blogs/edit/${encodeURIComponent(postId)}`,
    },
} as const;
