import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Models } from 'appwrite';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getBlogPostBySlug, BlogPost as BlogPostType, incrementBlogPostViewCount } from '../../services/appwrite';
import { getFilePreviewUrl } from '../../services/fileProxy';
import { LinearProgress } from '@mui/material';
import Footer from '../layout/Footer';
import BlogNav from './BlogNav';
import NotFound from '../NotFound';
import './BlogPost.css';

const BlogPost = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [post, setPost] = useState<(Models.Document & BlogPostType) | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBlogPost = async () => {
            if (!slug) return;

            try {
                const blogPost = await getBlogPostBySlug(slug);

                // If post not found or not published, redirect to blog list
                if (!blogPost || !blogPost.published) {
                    // navigate('/blogs');
                    return;
                }

                setPost(blogPost);

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
                const timer = setTimeout(handleViewCount, 10000);

                return () => clearTimeout(timer);
            } catch (err) {
                console.error('Error fetching blog post:', err);
                setError('Failed to load blog post');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBlogPost();
    }, [slug, navigate]);

    if (isLoading) {
        return (
            <>
                <BlogNav />
                <div className="blog-post-container">
                    <p className="loading-message">Loading...</p>
                    <LinearProgress />
                </div>
                <Footer resumeUrl={null} />
            </>
        );
    }

    if (error || !post) {
        return <NotFound />;
    }

    return (
        <>
            <BlogNav />
            <div className="blog-post-container">
                <div className="blog-post-header">
                    <Link to="/blogs" className="back-to-blog">
                        Back to Blogs
                    </Link>

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
                            <span>{post.viewCount || 0} views</span>
                        </div>
                    </div>

                    {post.coverImageId && (
                        <div className="blog-post-cover">
                            <img src={getFilePreviewUrl(post.coverImageId)} alt={post.title} />
                        </div>
                    )}
                </div>

                <div className="blog-post-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                </div>
            </div>
            <Footer resumeUrl={null} />
        </>
    );
};

export default BlogPost;
