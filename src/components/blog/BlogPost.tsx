import { useCallback, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Alert, LinearProgress } from '@mui/material';
import { getBlogPostBySlug, incrementBlogPostViewCount } from '../../services/blogService';
import { getFileUrl } from '../../services/storageService';
import NotFound from '../NotFound';
import BlogPageShell from './BlogPageShell';
import { routes } from '../../routes/paths';
import { ImageWithFallback, MarkdownContent } from '../shared';
import { useAsyncData } from '../../hooks';
import type {
    BlogPost as BlogPostType,
    BlogPostDocument,
    SectionVisibilityDocument,
    SectionVisibilityStatus,
} from '../../types';
import { BLOG_PREVIEW_STORAGE_KEY, BLOG_VIEW_COUNT_DELAY_MS, shouldRecordBlogView } from '../../utils/blog';
import { PLACEHOLDER_IMAGE } from '../../utils/assets';
import { classNames } from '../../utils/classNames';
import { formatBlogDate } from '../../utils/dates';
import { isSectionVisible } from '../../utils/sectionVisibility';
import styles from './BlogPost.module.css';

/** A draft rendered straight from session storage; it has no Appwrite document id. */
interface PreviewBlogPost extends Omit<BlogPostType, 'published'> {
    isPreview: boolean;
}

interface BlogPostProps {
    sectionVisibility: SectionVisibilityDocument | null;
    sectionVisibilityStatus: SectionVisibilityStatus;
}

const PREVIEW_SLUG = 'preview';

const isPersistedBlogPost = (post: BlogPostDocument | PreviewBlogPost): post is BlogPostDocument => '$id' in post;

const BlogPost = ({ sectionVisibility, sectionVisibilityStatus }: BlogPostProps) => {
    const { slug } = useParams<{ slug: string }>();
    const [searchParams] = useSearchParams();
    const isPreview = searchParams.get('preview') === 'true' || slug === PREVIEW_SLUG;
    const canShowBlogs = isSectionVisible(sectionVisibility, sectionVisibilityStatus, 'blogs');
    const isVisibilityResolved = sectionVisibilityStatus !== 'loading';

    const loadPost = useCallback(async (): Promise<BlogPostDocument | PreviewBlogPost> => {
        if (slug === PREVIEW_SLUG) {
            const previewData = sessionStorage.getItem(BLOG_PREVIEW_STORAGE_KEY);

            if (!previewData) {
                throw new Error('Preview data not found');
            }

            return JSON.parse(previewData) as PreviewBlogPost;
        }

        if (!slug) {
            throw new Error('Post not found');
        }

        if (!canShowBlogs && !isPreview) {
            throw new Error('Blogs section is disabled');
        }

        const blogPost = await getBlogPostBySlug(slug);

        if (!blogPost || (!blogPost.published && !isPreview)) {
            throw new Error('Post not found');
        }

        return blogPost;
    }, [canShowBlogs, isPreview, slug]);

    const { data: post, loading, error } = useAsyncData(loadPost, { enabled: isVisibilityResolved });

    useEffect(() => {
        if (!post || isPreview || import.meta.env.DEV || !isPersistedBlogPost(post)) {
            return;
        }

        // Only count a view once the reader has actually stayed on the page.
        const timer = window.setTimeout(() => {
            if (shouldRecordBlogView(post.$id)) {
                void incrementBlogPostViewCount(post.$id);
            }
        }, BLOG_VIEW_COUNT_DELAY_MS);

        return () => window.clearTimeout(timer);
    }, [isPreview, post]);

    if (!isVisibilityResolved || loading) {
        return (
            <BlogPageShell showNav={!isPreview}>
                <main className={styles.post}>
                    <p className={styles.loading}>Loading...</p>
                    <LinearProgress />
                </main>
            </BlogPageShell>
        );
    }

    if (error || !post || (!canShowBlogs && !isPreview)) {
        return <NotFound />;
    }

    const tags = post.tags ?? [];

    return (
        <BlogPageShell showNav={!isPreview}>
            <main className={classNames(styles.post, isPreview && styles.preview)}>
                {isPreview && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        This is a preview of your blog post. It is not yet published.
                    </Alert>
                )}

                <header className={styles.header}>
                    {!isPreview && (
                        <Link to={routes.blogs} className={styles.backLink}>
                            ← Back to blogs
                        </Link>
                    )}

                    <h1 className={styles.title}>{post.title}</h1>

                    <div className={styles.meta}>
                        <span>{formatBlogDate(post.publishedDate)}</span>

                        {tags.length > 0 && (
                            <div className={styles.tags}>
                                {tags.map((tag, index) => (
                                    <span key={`${tag}-${index}`} className={styles.tag}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        <span>
                            {isPersistedBlogPost(post) && !isPreview ? `${post.viewCount || 0} views` : 'Preview'}
                        </span>
                    </div>

                    {post.coverImageId && (
                        <div className={styles.cover}>
                            <ImageWithFallback
                                src={getFileUrl(post.coverImageId)}
                                fallbackSrc={PLACEHOLDER_IMAGE}
                                alt={post.title}
                            />
                        </div>
                    )}
                </header>

                <MarkdownContent>{post.content}</MarkdownContent>
            </main>
        </BlogPageShell>
    );
};

export default BlogPost;
