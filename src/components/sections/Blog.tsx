import { Link } from 'react-router-dom';
import { useBlogPosts } from '../../hooks';
import { routes } from '../../routes/paths';
import { BlogCard } from '../blog/BlogCard';
import { Section, SectionTitle } from '../layout/Section';
import { classNames } from '../../utils/classNames';
import styles from './Blog.module.css';

const HOME_PAGE_POST_LIMIT = 3;

const Blog = () => {
    const { data: blogPostsData, loading: isLoading } = useBlogPosts(true, { initialData: [] });
    const blogPosts = (blogPostsData ?? []).slice(0, HOME_PAGE_POST_LIMIT);

    return (
        <Section id="blogs" inset className={styles.blog}>
            <SectionTitle>Blogs</SectionTitle>

            {isLoading ? (
                <p className={styles.status}>Loading...</p>
            ) : blogPosts.length === 0 ? (
                <p className={classNames(styles.status, styles.empty)}>No blog posts available yet.</p>
            ) : (
                <>
                    <div className={styles.grid}>
                        {blogPosts.map((post) => (
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
