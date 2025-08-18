import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Models } from 'appwrite';
import { CircularProgress } from '@mui/material';
import { getBlogPosts, BlogPost, getContentImagePreviewUrl, SectionVisibility } from '../../services/appwrite';
import { logger } from '../../utils/logger';
import Footer from '../layout/Footer';
import BlogNav from './BlogNav';
import NotFound from '../NotFound';
import './BlogList.css';

interface BlogListProps {
    sectionVisibility: (Models.Document & SectionVisibility) | null;
}

const BlogList = ({ sectionVisibility }: BlogListProps) => {
    const [blogPosts, setBlogPosts] = useState<(Models.Document & BlogPost)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const resumeUrl = null; // Fixed to avoid unused state variable

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Only fetch blog posts if section visibility has loaded and blogs are enabled
                if (sectionVisibility?.blogs) {
                    // Only fetch published blog posts for the public view
                    const posts = await getBlogPosts(true);
                    setBlogPosts(posts);
                }
            } catch (error) {
                logger.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        // Only fetch data when sectionVisibility is available (not null)
        if (sectionVisibility !== null) {
            fetchData();
        }
    }, [sectionVisibility]);

    // Show loading state until sectionVisibility is loaded and component data is ready
    if (isLoading) {
        return (
            <div className="blog-page-wrapper">
                <BlogNav />
                <div className="blog-loading-container">
                    <CircularProgress />
                </div>
                <Footer resumeUrl={resumeUrl} />
            </div>
        );
    }

    // If blogs are disabled, show the NotFound page
    if (!sectionVisibility?.blogs) {
        return <NotFound />;
    }

    return (
        <div className="blog-page-wrapper">
            <BlogNav />
            <div className="blog-list-container">
                <header className="blog-list-header">
                    <h1>Blogs</h1>
                    <p>Thoughts, insights, and updates</p>
                </header>

                {blogPosts.length === 0 ? (
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
                                                src={getContentImagePreviewUrl(post.coverImageId)}
                                                alt={post.title}
                                                loading="lazy"
                                            />
                                        </div>
                                    )}
                                    <div className="blog-list-card-content">
                                        <h2 className="blog-list-title">{post.title}</h2>
                                        <p className="blog-list-date">
                                            {new Date(post.publishedDate).toLocaleString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                timeZone: 'UTC',
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
        </div>
    );
};

export default BlogList;
