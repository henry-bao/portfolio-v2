import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useBlogPosts } from '../../hooks';
import { routes } from '../../routes/paths';
import { BlogCard } from '../blog/BlogCard';
import './Blog.css';

const Blog = () => {
    const { data: blogPostsData, loading: isLoading } = useBlogPosts(true, { initialData: [] });
    const blogPosts = useMemo(() => (blogPostsData || []).slice(0, 3), [blogPostsData]);

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
                                <BlogCard key={post.$id} post={post} />
                            ))}
                        </div>
                        <div className="view-all-container">
                            <Link to={routes.blogs} className="view-all-button">
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
