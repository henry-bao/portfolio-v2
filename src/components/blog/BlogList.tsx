import { CircularProgress } from '@mui/material';
import { useBlogPosts } from '../../hooks';
import type { SectionVisibilityDocument, SectionVisibilityStatus } from '../../types';
import { isSectionVisible } from '../../utils/sectionVisibility';
import NotFound from '../NotFound';
import BlogPageShell from './BlogPageShell';
import { BlogCard } from './BlogCard';
import './BlogList.css';

interface BlogListProps {
    sectionVisibility: SectionVisibilityDocument | null;
    sectionVisibilityStatus: SectionVisibilityStatus;
}

const BlogList = ({ sectionVisibility, sectionVisibilityStatus }: BlogListProps) => {
    const canShowBlogs = isSectionVisible(sectionVisibility, sectionVisibilityStatus, 'blogs');
    const { data: blogPostsData, loading: blogPostsLoading } = useBlogPosts(true, {
        enabled: canShowBlogs,
        initialData: [],
    });

    if (sectionVisibilityStatus === 'loading' || (canShowBlogs && blogPostsLoading)) {
        return (
            <BlogPageShell>
                <div className="blog-loading-container">
                    <CircularProgress />
                </div>
            </BlogPageShell>
        );
    }

    if (!canShowBlogs) {
        return <NotFound />;
    }

    const blogPosts = blogPostsData ?? [];

    return (
        <BlogPageShell>
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
        </BlogPageShell>
    );
};

export default BlogList;
