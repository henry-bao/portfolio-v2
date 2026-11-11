import { Link } from 'react-router-dom';
import { fileUrl } from '../../api';
import type { BlogPost } from '../../api';
import { routes } from '../../app/routes';
import { PLACEHOLDER_IMAGE } from '../../config/site';
import { classNames } from '../../lib/classNames';
import { formatBlogDate } from '../../lib/dates';
import { ImageWithFallback } from '../shared';
import styles from './BlogCard.module.css';

interface BlogCardProps {
    post: BlogPost;
    /** `home`: compact light card on the home page. `list`: larger dark card with view counts. */
    variant?: 'home' | 'list';
}

const TagList = ({ tags }: { tags: string[] }) => (
    <div className={styles.tags}>
        {tags.map((tag, index) => (
            <span key={`${tag}-${index}`} className={styles.tag}>
                {tag}
            </span>
        ))}
    </div>
);

export function BlogCard({ post, variant = 'home' }: BlogCardProps) {
    const isListVariant = variant === 'list';
    const { tags } = post;
    // Home cards sit under the section's h2; list cards under the page's h1.
    const Title = isListVariant ? 'h2' : 'h3';

    return (
        <Link to={routes.blogPostBySlug(post.slug)} className={classNames(styles.link, isListVariant && styles.list)}>
            <article className={styles.card}>
                {post.coverImageId && (
                    <div className={styles.cover}>
                        <ImageWithFallback
                            src={fileUrl(post.coverImageId)}
                            fallbackSrc={PLACEHOLDER_IMAGE}
                            alt={post.title}
                            loading="lazy"
                        />
                    </div>
                )}
                <div className={styles.body}>
                    <Title className={styles.title}>{post.title}</Title>
                    <p className={styles.date}>{formatBlogDate(post.publishedDate)}</p>
                    <p className={styles.summary}>{post.summary}</p>

                    {isListVariant ? (
                        <div className={styles.meta}>
                            {tags.length > 0 && <TagList tags={tags} />}
                            <span className={styles.views}>{post.viewCount} views</span>
                        </div>
                    ) : (
                        tags.length > 0 && <TagList tags={tags} />
                    )}

                    <div className={styles.readMore}>Read more</div>
                </div>
            </article>
        </Link>
    );
}
