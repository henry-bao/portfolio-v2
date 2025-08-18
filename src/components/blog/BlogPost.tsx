import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Models } from 'appwrite';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    getBlogPostBySlug,
    BlogPost as BlogPostType,
    incrementBlogPostViewCount,
    getContentImagePreviewUrl,
    SectionVisibility,
} from '../../services/appwrite';
import { LinearProgress, Alert } from '@mui/material';
import Footer from '../layout/Footer';
import BlogNav from './BlogNav';
import NotFound from '../NotFound';
import './BlogPost.css';

// Interface for preview blog post
interface PreviewBlogPost extends Omit<BlogPostType, 'published'> {
    isPreview: boolean;
}

interface BlogPostProps {
    sectionVisibility: (Models.Document & SectionVisibility) | null;
}

const BlogPost = ({ sectionVisibility }: BlogPostProps) => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isPreview = searchParams.get('preview') === 'true' || slug === 'preview';

    const [post, setPost] = useState<(Models.Document & BlogPostType) | PreviewBlogPost | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let viewCountTimer: ReturnType<typeof setTimeout> | undefined;

        const fetchData = async () => {
            setIsLoading(true);

            try {
                // If blogs are disabled and not in preview mode, don't fetch blog post
                if (!sectionVisibility?.blogs && !isPreview) {
                    setError('Blogs section is disabled');
                    setIsLoading(false);
                    return;
                }

                // Check if this is a preview from session storage (for drafts)
                if (slug === 'preview') {
                    try {
                        const previewData = sessionStorage.getItem('preview_blog_post');
                        if (!previewData) {
                            setError('Preview data not found');
                            setIsLoading(false);
                            return;
                        }

                        const previewPost = JSON.parse(previewData) as PreviewBlogPost;
                        setPost(previewPost);
                        setIsLoading(false);
                        return;
                    } catch (err) {
                        console.error('Error loading preview data:', err);
                        setError('Failed to load preview');
                        setIsLoading(false);
                        return;
                    }
                }

                // Otherwise load from database
                if (!slug) {
                    setIsLoading(false);
                    return;
                }

                const blogPost = await getBlogPostBySlug(slug);

                // If post not found or not published (and not in preview mode), show not found
                if (!blogPost || (!blogPost.published && !isPreview)) {
                    setError('Post not found');
                    setIsLoading(false);
                    return;
                }

                setPost(blogPost);

                // Only increment view count if not in preview mode
                if (!isPreview) {
                    // Improved view counting logic
                    const handleViewCount = () => {
                        // Skip counting in development mode
                        if (import.meta.env.DEV) return;

                        // Get viewed posts from localStorage
                        const viewedPosts = JSON.parse(localStorage.getItem('henry-blog-viewed-posts') || '{}');
                        const lastViewedTime = viewedPosts[blogPost.$id] || 0;
                        const currentTime = Date.now();

                        // Only count a view if it's been more than 24 hours since the last view
                        // or if the post has never been viewed
                        if (!lastViewedTime || currentTime - lastViewedTime > 24 * 60 * 60 * 1000) {
                            // Record this view with the current timestamp
                            viewedPosts[blogPost.$id] = currentTime;
                            localStorage.setItem('henry-blog-viewed-posts', JSON.stringify(viewedPosts));

                            // Increment the view count in the database
                            incrementBlogPostViewCount(blogPost.$id);
                        }
                    };

                    // Add a small delay to ensure the page is actually viewed
                    // This helps avoid counting accidental or bounce views
                    viewCountTimer = setTimeout(handleViewCount, 10000);
                }
            } catch (err) {
                console.error('Error fetching blog post:', err);
                setError('Failed to load blog post');
            } finally {
                setIsLoading(false);
            }
        };

        // Only fetch data when sectionVisibility is loaded
        if (sectionVisibility !== null) {
            fetchData();
        }

        return () => {
            if (viewCountTimer) clearTimeout(viewCountTimer);
        };
    }, [slug, navigate, isPreview, sectionVisibility]);

    // Continue showing loading state until sectionVisibility is loaded
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

    // If blogs are disabled and not in preview mode, show the NotFound page
    if (!sectionVisibility?.blogs && !isPreview) {
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
                        <Link to="/blogs" className="back-to-blog">
                            ← Back to blogs
                        </Link>
                    )}

                    <h1 className="blog-post-title">{post.title}</h1>

                    <div className="blog-post-meta">
                        <span className="blog-post-date">
                            {new Date(post.publishedDate).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                timeZone: 'UTC',
                            })}
                        </span>

                        {post.tags && post.tags.length > 0 && (
                            <div className="blog-post-tags">
                                {post.tags.map((tag, index) => (
                                    <span key={index} className="blog-post-tag">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="blog-post-views">
                            <p>{isPreview ? 'Preview' : `${post.viewCount || 0} views`}</p>
                        </div>
                    </div>

                    {post.coverImageId && (
                        <div className="blog-post-cover">
                            <img src={getContentImagePreviewUrl(post.coverImageId)} alt={post.title} />
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
