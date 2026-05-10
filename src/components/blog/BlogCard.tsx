import { Link } from 'react-router-dom';
import { getContentImagePreviewUrl } from '../../services/appwrite';
import { routes } from '../../routes/paths';
import type { BlogPostDocument } from '../../types';
import { formatBlogDate } from '../../utils/dates';
import { ImageWithFallback } from '../shared';

type BlogCardVariant = 'home' | 'list';

interface BlogCardProps {
    post: BlogPostDocument;
    variant?: BlogCardVariant;
}

export function BlogCard({ post, variant = 'home' }: BlogCardProps) {
    const isListVariant = variant === 'list';
    const prefix = isListVariant ? 'blog-list' : 'blog';
    const titleClassName = isListVariant ? 'blog-list-title' : 'blog-title';
    const dateClassName = isListVariant ? 'blog-list-date' : 'blog-date';
    const summaryClassName = isListVariant ? 'blog-list-summary' : 'blog-summary';
    const tagsClassName = isListVariant ? 'blog-list-tags' : 'blog-tags';
    const tagClassName = isListVariant ? 'blog-list-tag' : 'blog-tag';
    const readMoreClassName = isListVariant ? 'read-more' : 'blog-read-more';

    const content = (
        <>
            {post.coverImageId && (
                <div className={`${prefix}-card-image`}>
                    <ImageWithFallback
                        src={getContentImagePreviewUrl(post.coverImageId)}
                        fallbackSrc="/img/placeholder.svg"
                        alt={post.title}
                        loading="lazy"
                    />
                </div>
            )}
            <div className={`${prefix}-card-content`}>
                <h2 className={titleClassName}>{post.title}</h2>
                <p className={dateClassName}>{formatBlogDate(post.publishedDate)}</p>
                <p className={summaryClassName}>{post.summary}</p>

                {isListVariant ? (
                    <div className="blog-list-card-meta">
                        {post.tags && post.tags.length > 0 && (
                            <div className={tagsClassName}>
                                {post.tags.map((tag, index) => (
                                    <span key={`${tag}-${index}`} className={tagClassName}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="blog-list-views">
                            <span>{post.viewCount || 0} views</span>
                        </div>
                    </div>
                ) : (
                    post.tags &&
                    post.tags.length > 0 && (
                        <div className={tagsClassName}>
                            {post.tags.map((tag, index) => (
                                <span key={`${tag}-${index}`} className={tagClassName}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )
                )}

                <div className={readMoreClassName}>
                    Read more <span aria-hidden="true">&rarr;</span>
                </div>
            </div>
        </>
    );

    return (
        <Link to={routes.blogPostBySlug(post.slug)} className={`${prefix}-card-link`}>
            <article className={`${prefix}-card`}>{content}</article>
        </Link>
    );
}
