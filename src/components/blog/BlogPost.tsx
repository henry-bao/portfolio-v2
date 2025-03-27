import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Models } from 'appwrite';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getBlogPostBySlug, BlogPost as BlogPostType } from '../../services/appwrite';
import { getFilePreviewUrl } from '../../services/fileProxy';
import Footer from '../layout/Footer';
import BlogNav from './BlogNav';
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
                    <div className="loading-spinner">Loading...</div>
                </div>
                <Footer resumeUrl={null} />
            </>
        );
    }

    if (error || !post) {
        return (
            <>
                <BlogNav />
                <div className="blog-post-container">
                    <div className="error-message">
                        <h2>Error</h2>
                        <p>{error || 'Blog post not found'}</p>
                        <Link to="/blogs" className="back-button">
                            Back to Blogs
                        </Link>
                    </div>
                </div>
                <Footer resumeUrl={null} />
            </>
        );
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
                            {new Date(post.publishedDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
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
