import { useMemo } from 'react';
import { CircularProgress } from '@mui/material';
import { useBlogPosts } from '../../hooks';
import type { SectionVisibilityDocument, SectionVisibilityStatus } from '../../types';
import { isSectionVisible } from '../../utils/sectionVisibility';
import Footer from '../layout/Footer';
import BlogNav from './BlogNav';
import NotFound from '../NotFound';
import { BlogCard } from './BlogCard';
import './BlogList.css';

interface BlogListProps {
    sectionVisibility: SectionVisibilityDocument | null;
    sectionVisibilityStatus: SectionVisibilityStatus;
}

const BlogList = ({ sectionVisibility, sectionVisibilityStatus }: BlogListProps) => {
    const canShowBlogs = useMemo(
        () => isSectionVisible(sectionVisibility, sectionVisibilityStatus, 'blogs'),
        [sectionVisibility, sectionVisibilityStatus]
    );
    const { data: blogPostsData, loading: blogPostsLoading } = useBlogPosts(true, {
        enabled: canShowBlogs,
        initialData: [],
    });
    const blogPosts = blogPostsData ?? [];
    const isLoading = sectionVisibilityStatus === 'loading' || (canShowBlogs && blogPostsLoading);

    if (isLoading) {
        return (
            <div className="blog-page-wrapper">
                <BlogNav />
                <div className="blog-loading-container">
                    <CircularProgress />
                </div>
                <Footer resumeUrl={null} />
            </div>
        );
    }

    if (!canShowBlogs) {
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
                            <BlogCard key={post.$id} post={post} variant="list" />
                        ))}
                    </div>
                )}
            </div>
            <Footer resumeUrl={null} />
        </div>
    );
};

export default BlogList;
