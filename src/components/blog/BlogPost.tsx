import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getBlogPostBySlug, incrementBlogPostViewCount, getContentImagePreviewUrl } from '../../services/appwrite';
import { LinearProgress, Alert } from '@mui/material';
import Footer from '../layout/Footer';
import BlogNav from './BlogNav';
import NotFound from '../NotFound';
import { routes } from '../../routes/paths';
import { ImageWithFallback } from '../shared';
import type {
    BlogPost as BlogPostType,
    BlogPostDocument,
    SectionVisibilityDocument,
    SectionVisibilityStatus,
} from '../../types';
import { BLOG_PREVIEW_STORAGE_KEY, BLOG_VIEW_COUNT_DELAY_MS, shouldRecordBlogView } from '../../utils/blog';
import { formatBlogDate } from '../../utils/dates';
import { isSectionVisible } from '../../utils/sectionVisibility';
import './BlogPost.css';

interface PreviewBlogPost extends Omit<BlogPostType, 'published'> {
    isPreview: boolean;
}

interface BlogPostProps {
    sectionVisibility: SectionVisibilityDocument | null;
    sectionVisibilityStatus: SectionVisibilityStatus;
}

const isPersistedBlogPost = (post: BlogPostDocument | PreviewBlogPost): post is BlogPostDocument => '$id' in post;

const BlogPost = ({ sectionVisibility, sectionVisibilityStatus }: BlogPostProps) => {
    const { slug } = useParams<{ slug: string }>();
    const [searchParams] = useSearchParams();
    const isPreview = searchParams.get('preview') === 'true' || slug === 'preview';

    const [post, setPost] = useState<BlogPostDocument | PreviewBlogPost | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const canShowBlogs = useMemo(
        () => isSectionVisible(sectionVisibility, sectionVisibilityStatus, 'blogs'),
        [sectionVisibility, sectionVisibilityStatus]
    );

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            setPost(null);

            try {
                if (!canShowBlogs && !isPreview) {
                    setError('Blogs section is disabled');
                    setIsLoading(false);
                    return;
                }

                if (slug === 'preview') {
                    try {
                        const previewData = sessionStorage.getItem(BLOG_PREVIEW_STORAGE_KEY);
                        if (!previewData) {
                            setError('Preview data not found');
                            setIsLoading(false);
                            return;
                        }

                        const previewPost = JSON.parse(previewData) as PreviewBlogPost;
                        if (isMounted) {
                            setPost(previewPost);
                        }
                        setIsLoading(false);
                        return;
                    } catch (err) {
                        console.error('Error loading preview data:', err);
                        setError('Failed to load preview');
                        setIsLoading(false);
                        return;
                    }
                }

                if (!slug) {
                    setIsLoading(false);
                    return;
                }

                const blogPost = await getBlogPostBySlug(slug);

                if (!isMounted) {
                    return;
                }

                if (!blogPost || (!blogPost.published && !isPreview)) {
                    setError('Post not found');
                    setIsLoading(false);
                    return;
                }

                setPost(blogPost);
            } catch (err) {
                console.error('Error fetching blog post:', err);
                if (isMounted) {
                    setError('Failed to load blog post');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        if (sectionVisibilityStatus !== 'loading') {
            void fetchData();
        }

        return () => {
            isMounted = false;
        };
    }, [slug, isPreview, canShowBlogs, sectionVisibilityStatus]);

    useEffect(() => {
        if (!post || isPreview || import.meta.env.DEV || !isPersistedBlogPost(post)) {
            return;
        }

        const timer = window.setTimeout(() => {
            if (shouldRecordBlogView(post.$id)) {
                void incrementBlogPostViewCount(post.$id);
            }
        }, BLOG_VIEW_COUNT_DELAY_MS);

        return () => window.clearTimeout(timer);
    }, [isPreview, post]);

    if (isLoading) {
        return (
            <div className="blog-page-wrapper">
                {!isPreview && <BlogNav />}
                <div className="blog-post-container">
                    <p className="loading-message">Loading...</p>
                    <LinearProgress />
                </div>
                <Footer resumeUrl={null} />
            </div>
        );
    }

    if (!canShowBlogs && !isPreview) {
        return <NotFound />;
    }

    if (error || !post) {
        return <NotFound />;
    }

    return (
        <div className="blog-page-wrapper">
            {!isPreview && <BlogNav />}
            <div className="blog-post-container" style={isPreview ? { paddingTop: '2rem' } : undefined}>
                {isPreview && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        This is a preview of your blog post. It is not yet published.
                    </Alert>
                )}

                <div className="blog-post-header">
                    {!isPreview && (
                        <Link to={routes.blogs} className="back-to-blog">
                            ← Back to blogs
                        </Link>
                    )}

                    <h1 className="blog-post-title">{post.title}</h1>

                    <div className="blog-post-meta">
                        <span className="blog-post-date">{formatBlogDate(post.publishedDate)}</span>

                        {post.tags && post.tags.length > 0 && (
                            <div className="blog-post-tags">
                                {post.tags.map((tag, index) => (
                                    <span key={`${tag}-${index}`} className="blog-post-tag">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="blog-post-views">
                            <p>
                                {isPreview || !isPersistedBlogPost(post)
                                    ? 'Preview'
                                    : `${post.viewCount || 0} views`}
                            </p>
                        </div>
                    </div>

                    {post.coverImageId && (
                        <div className="blog-post-cover">
                            <ImageWithFallback
                                src={getContentImagePreviewUrl(post.coverImageId)}
                                fallbackSrc="/img/placeholder.svg"
                                alt={post.title}
                            />
                        </div>
                    )}
                </div>

                <div className="blog-post-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                </div>
            </div>
            <Footer resumeUrl={null} />
        </div>
    );
};

export default BlogPost;
