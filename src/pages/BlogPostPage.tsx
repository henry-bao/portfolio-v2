import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Alert, LinearProgress } from '@mui/material';
import { blogApi, fileUrl, getErrorMessage, isApiError } from '../api';
import { routes } from '../app/routes';
import { PLACEHOLDER_IMAGE } from '../config/site';
import { useCurrentUser, useDrafts, useIsAdmin, usePostBySlug, useSectionVisibility } from '../queries';
import { ImageWithFallback, MarkdownContent } from '../components/shared';
import BlogPageShell from '../components/blog/BlogPageShell';
import { classNames } from '../lib/classNames';
import { formatBlogDate } from '../lib/dates';
import { claimPostView, VIEW_COUNT_DELAY_MS } from '../lib/viewedPosts';
import NotFoundPage from './NotFoundPage';
import styles from './BlogPostPage.module.css';

interface ArticleProps {
    title: string;
    publishedDate: string;
    tags: string[];
    content: string;
    coverUrl: string | null;
    /** Shown in the meta line: the view count for live posts, a label for previews. */
    metaLabel: string;
    /** Previews render without the site nav or the back link. */
    isPreview: boolean;
    banner?: ReactNode;
}

const Article = ({ title, publishedDate, tags, content, coverUrl, metaLabel, isPreview, banner }: ArticleProps) => (
    <BlogPageShell showNav={!isPreview}>
        <main className={classNames(styles.post, isPreview && styles.preview)}>
            {banner}

            <header className={styles.header}>
                {!isPreview && (
                    <Link to={routes.blogs} className={styles.backLink}>
                        ← Back to blogs
                    </Link>
                )}

                <h1 className={styles.title}>{title || 'Untitled'}</h1>

                <div className={styles.meta}>
                    <span>{formatBlogDate(publishedDate)}</span>

                    {tags.length > 0 && (
                        <div className={styles.tags}>
                            {tags.map((tag) => (
                                <span key={tag} className={styles.tag}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <span>{metaLabel}</span>
                </div>

                {coverUrl && (
                    <div className={styles.cover}>
                        <ImageWithFallback src={coverUrl} fallbackSrc={PLACEHOLDER_IMAGE} alt={title} />
                    </div>
                )}
            </header>

            <MarkdownContent>{content}</MarkdownContent>
        </main>
    </BlogPageShell>
);

const LoadingArticle = ({ isPreview }: { isPreview: boolean }) => (
    <BlogPageShell showNav={!isPreview}>
        <main className={classNames(styles.post, isPreview && styles.preview)}>
            <p className={styles.loading}>Loading...</p>
            <LinearProgress />
        </main>
    </BlogPageShell>
);

/** Counts one view once the reader has stayed a while (not in dev, not for admin previews). */
function useRecordView(postId: string | null) {
    useEffect(() => {
        if (!postId || import.meta.env.DEV) {
            return;
        }

        const timer = window.setTimeout(() => {
            if (claimPostView(postId)) {
                blogApi.recordPostView(postId).catch((error: unknown) => console.error(error));
            }
        }, VIEW_COUNT_DELAY_MS);

        return () => window.clearTimeout(timer);
    }, [postId]);
}

/**
 * A saved post. Guests see published posts while the blog section is on. Admins adding
 * `?preview=true` also see unpublished posts and hidden sections.
 */
const SavedPost = ({ slug, previewRequested }: { slug: string; previewRequested: boolean }) => {
    const { isVisible, isResolved } = useSectionVisibility();
    const { isPending: isAuthPending } = useCurrentUser();
    const isAdmin = useIsAdmin();
    const isAdminPreview = previewRequested && isAdmin;
    // Only wait for the session when it decides what to show.
    const isReady = isResolved && (!previewRequested || !isAuthPending);
    const canShow = isAdminPreview || isVisible('blogs');

    const { data: post, isPending, isError, error, refetch } = usePostBySlug(slug, {
        includeUnpublished: isAdminPreview,
        enabled: isReady && canShow,
    });

    useRecordView(post && post.published && !isAdminPreview ? post.$id : null);

    if (!isReady || (canShow && isPending)) {
        return <LoadingArticle isPreview={isAdminPreview} />;
    }

    if (!canShow || !post || isApiError(error, 'not_found')) {
        if (isError && !isApiError(error, 'not_found')) {
            return (
                <BlogPageShell>
                    <main className={styles.post}>
                        <Alert
                            severity="error"
                            action={
                                <button type="button" className={styles.retry} onClick={() => void refetch()}>
                                    Try again
                                </button>
                            }
                        >
                            {getErrorMessage(error)}
                        </Alert>
                    </main>
                </BlogPageShell>
            );
        }

        return <NotFoundPage />;
    }

    return (
        <Article
            title={post.title}
            publishedDate={post.publishedDate}
            tags={post.tags}
            content={post.content}
            coverUrl={fileUrl(post.coverImageId)}
            metaLabel={isAdminPreview ? 'Preview' : `${post.viewCount} views`}
            isPreview={isAdminPreview}
            banner={
                isAdminPreview && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        {post.published
                            ? 'Admin preview of a published post.'
                            : 'This post is not published. Only signed-in admins can see it.'}
                    </Alert>
                )
            }
        />
    );
};

/** A local draft from this browser, opened from the dashboard's blog list. */
const DraftPreview = ({ draftId }: { draftId: string | null }) => {
    const drafts = useDrafts();
    const draft = draftId ? drafts.find((stored) => stored.id === draftId) : undefined;

    if (!draft) {
        return <NotFoundPage />;
    }

    return (
        <Article
            title={draft.title}
            publishedDate={draft.publishedDate}
            tags={draft.tags}
            content={draft.content}
            coverUrl={null}
            metaLabel="Draft"
            isPreview
            banner={
                <Alert severity="info" sx={{ mb: 3 }}>
                    Preview of a draft saved in this browser. It is not published.
                </Alert>
            }
        />
    );
};

const BlogPostPage = () => {
    const { slug = '' } = useParams<{ slug: string }>();
    const [searchParams] = useSearchParams();

    if (blogApi.RESERVED_SLUGS.includes(slug)) {
        return <DraftPreview draftId={searchParams.get('draft')} />;
    }

    return <SavedPost slug={slug} previewRequested={searchParams.get('preview') === 'true'} />;
};

export default BlogPostPage;
