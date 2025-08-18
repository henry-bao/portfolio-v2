import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Models } from 'appwrite';
import { getBlogPosts, BlogPost, getContentImagePreviewUrl } from '../../services/appwrite';
import { logger } from '../../utils/logger';
import './Blog.css';

const Blog = () => {
    const [blogPosts, setBlogPosts] = useState<(Models.Document & BlogPost)[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBlogPosts = async () => {
            try {
                // Only fetch published blog posts for the public view
                // Limit to 3 most recent posts for the section preview
                const posts = await getBlogPosts(true);
                setBlogPosts(posts.slice(0, 3));
            } catch (error) {
                logger.error('Error fetching blog posts:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBlogPosts();
    }, []);

    if (isLoading) {
        return (
            <section id="blogs" className="blog-section">
                <div className="container">
                    <h1 className="section-title">Blogs</h1>
                    <div className="loading-spinner">Loading...</div>
                </div>
            </section>
        );
    }

    return (
        <section id="blogs" className="blog-section">
            <div className="container">
                <h1 className="section-title">Blogs</h1>
                {blogPosts.length === 0 ? (
                    <p className="blog-no-posts-message">No blog posts available yet.</p>
                ) : (
                    <>
                        <div className="blog-grid">
                            {blogPosts.map((post) => (
                                <Link to={`/blogs/${post.slug}`} key={post.$id} className="blog-card-link">
                                    <div className="blog-card">
                                        {post.coverImageId && (
                                            <div className="blog-card-image">
                                                <img
                                                    src={getContentImagePreviewUrl(post.coverImageId)}
                                                    alt={post.title}
                                                    loading="lazy"
                                                />
                                            </div>
                                        )}
                                        <div className="blog-card-content">
                                            <h3 className="blog-title">{post.title}</h3>
                                            <p className="blog-date">
                                                {new Date(post.publishedDate).toLocaleString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    timeZone: 'UTC',
                                                })}
                                            </p>
                                            <p className="blog-summary">{post.summary}</p>

                                            {post.tags && post.tags.length > 0 && (
                                                <div className="blog-tags">
                                                    {post.tags.map((tag, index) => (
                                                        <span key={index} className="blog-tag">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="blog-read-more">Read more →</div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <div className="view-all-container">
                            <Link to="/blogs" className="view-all-button">
                                View All Posts
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};

export default Blog;
