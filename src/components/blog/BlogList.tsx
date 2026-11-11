import { useBlogPosts } from '../../hooks';
import type { SectionVisibilityDocument, SectionVisibilityStatus } from '../../types';
import { isSectionVisible } from '../../utils/sectionVisibility';
import NotFound from '../NotFound';
import BlogPageShell, { BlogPageLoading } from './BlogPageShell';
import { BlogCard } from './BlogCard';
import styles from './BlogList.module.css';

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
                <BlogPageLoading />
            </BlogPageShell>
        );
    }

    if (!canShowBlogs) {
        return <NotFound />;
    }

    const blogPosts = blogPostsData ?? [];

    return (
        <BlogPageShell>
            <main className={styles.page}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Blogs</h1>
                    <p className={styles.tagline}>Thoughts, insights, and updates</p>
                </header>

                {blogPosts.length === 0 ? (
                    <p className={styles.empty}>No blog posts available yet. Check back soon!</p>
                ) : (
                    <div className={styles.grid}>
                        {blogPosts.map((post) => (
                            <BlogCard key={post.$id} post={post} variant="list" />
                        ))}
                    </div>
                )}
            </main>
        </BlogPageShell>
    );
};

export default BlogList;
