import { Link } from 'react-router-dom';
import { routes } from '../../app/routes';
import { getErrorMessage } from '../../api';
import { usePublishedPosts } from '../../queries';
import { classNames } from '../../lib/classNames';
import { BlogCard } from '../blog/BlogCard';
import { Section, SectionTitle } from '../layout/Section';
import styles from './Blog.module.css';

const HOME_PAGE_POST_LIMIT = 3;

const Blog = () => {
    const { data: posts, isPending, isError, error, refetch } = usePublishedPosts({ limit: HOME_PAGE_POST_LIMIT });

    return (
        <Section id="blogs" inset className={styles.blog}>
            <SectionTitle>Blogs</SectionTitle>

            {isPending ? (
                <p className={styles.status}>Loading...</p>
            ) : isError ? (
                <p className={classNames(styles.status, styles.empty)}>
                    {getErrorMessage(error)}{' '}
                    <button type="button" className={styles.retry} onClick={() => void refetch()}>
                        Try again
                    </button>
                </p>
            ) : posts.length === 0 ? (
                <p className={classNames(styles.status, styles.empty)}>No blog posts available yet.</p>
            ) : (
                <>
                    <div className={styles.grid}>
                        {posts.map((post) => (
                            <BlogCard key={post.$id} post={post} />
                        ))}
                    </div>
                    <div className={styles.actions}>
                        <Link to={routes.blogs} className={styles.viewAll}>
                            View All Posts
                        </Link>
                    </div>
                </>
            )}
        </Section>
    );
};

export default Blog;
