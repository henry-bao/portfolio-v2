import { getErrorMessage } from '../api';
import { usePublishedPosts, useSectionVisibility } from '../queries';
import BlogPageShell, { BlogPageLoading } from '../components/blog/BlogPageShell';
import { BlogCard } from '../components/blog/BlogCard';
import NotFoundPage from './NotFoundPage';
import styles from './BlogListPage.module.css';

const BlogListPage = () => {
    const { isVisible, isResolved } = useSectionVisibility();
    const canShowBlogs = isVisible('blogs');
    const { data: posts, isPending, isError, error, refetch } = usePublishedPosts({ enabled: canShowBlogs });

    if (!isResolved || (canShowBlogs && isPending)) {
        return (
            <BlogPageShell>
                <BlogPageLoading />
            </BlogPageShell>
        );
    }

    if (!canShowBlogs) {
        return <NotFoundPage />;
    }

    return (
        <BlogPageShell>
            <main className={styles.page}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Blogs</h1>
                    <p className={styles.tagline}>Thoughts, insights, and updates</p>
                </header>

                {isError ? (
                    <p className={styles.empty}>
                        {getErrorMessage(error)}{' '}
                        <button type="button" className={styles.retry} onClick={() => void refetch()}>
                            Try again
                        </button>
                    </p>
                ) : !posts?.length ? (
                    <p className={styles.empty}>No blog posts available yet. Check back soon!</p>
                ) : (
                    <div className={styles.grid}>
                        {posts.map((post) => (
                            <BlogCard key={post.$id} post={post} variant="list" />
                        ))}
                    </div>
                )}
            </main>
        </BlogPageShell>
    );
};

export default BlogListPage;
