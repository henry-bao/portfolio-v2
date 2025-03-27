import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Models } from 'appwrite';
import { getBlogPosts, BlogPost } from '../../services/appwrite';
import { getFilePreviewUrl } from '../../services/fileProxy';
import Footer from '../layout/Footer';
import BlogNav from './BlogNav';
import './BlogList.css';

const BlogList = () => {
    const [blogPosts, setBlogPosts] = useState<(Models.Document & BlogPost)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const resumeUrl = null; // Fixed to avoid unused state variable

    useEffect(() => {
        const fetchBlogPosts = async () => {
            try {
                // Only fetch published blog posts for the public view
                const posts = await getBlogPosts(true);
                setBlogPosts(posts);
            } catch (error) {
                console.error('Error fetching blog posts:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBlogPosts();
    }, []);

    return (
        <>
            <BlogNav />
            <div className="blog-list-container">
                <header className="blog-list-header">
                    <h1>Blogs</h1>
                    <p>Thoughts, insights, and updates</p>
                </header>

                {isLoading ? (
                    <div className="loading-spinner">Loading...</div>
                ) : blogPosts.length === 0 ? (
                    <div className="no-posts-message">
                        <p>No blog posts available yet. Check back soon!</p>
                    </div>
                ) : (
                    <div className="blog-list-grid">
                        {blogPosts.map((post) => (
                            <Link to={`/blogs/${post.slug}`} key={post.$id} className="blog-list-card-link">
                                <article className="blog-list-card">
                                    {post.coverImageId && (
                                        <div className="blog-list-card-image">
                                            <img
                                                src={getFilePreviewUrl(post.coverImageId)}
                                                alt={post.title}
                                                loading="lazy"
                                            />
                                        </div>
                                    )}
                                    <div className="blog-list-card-content">
                                        <h2 className="blog-list-title">{post.title}</h2>
                                        <p className="blog-list-date">
                                            {new Date(post.publishedDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                        <p className="blog-list-summary">{post.summary}</p>

                                        <div className="blog-list-card-meta">
                                            {post.tags && post.tags.length > 0 && (
                                                <div className="blog-list-tags">
                                                    {post.tags.map((tag, index) => (
                                                        <span key={index} className="blog-list-tag">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="blog-list-views">
                                                <span>{post.viewCount || 0} views</span>
                                            </div>
                                        </div>

                                        <div className="read-more">Read more →</div>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
            <Footer resumeUrl={resumeUrl} />
        </>
    );
};

export default BlogList;
