export const BLOG_PREVIEW_STORAGE_KEY = 'preview_blog_post';
const BLOG_VIEW_STORAGE_KEY = 'henry-blog-viewed-posts';
export const BLOG_VIEW_COUNT_DELAY_MS = 10000;
const BLOG_VIEW_COUNT_INTERVAL_MS = 24 * 60 * 60 * 1000;

export const buildSlug = (title: string) =>
    title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

export function shouldRecordBlogView(postId: string, now = Date.now()) {
    const viewedPosts = JSON.parse(localStorage.getItem(BLOG_VIEW_STORAGE_KEY) || '{}') as Record<string, number>;
    const lastViewedAt = viewedPosts[postId] || 0;

    if (lastViewedAt && now - lastViewedAt <= BLOG_VIEW_COUNT_INTERVAL_MS) {
        return false;
    }

    viewedPosts[postId] = now;
    localStorage.setItem(BLOG_VIEW_STORAGE_KEY, JSON.stringify(viewedPosts));
    return true;
}
