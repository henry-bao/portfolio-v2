import { Link } from 'react-router-dom';
import { getContentImagePreviewUrl } from '../../services/storageService';
import { routes } from '../../routes/paths';
import type { BlogPostDocument } from '../../types';
import { PLACEHOLDER_IMAGE } from '../../utils/assets';
import { formatBlogDate } from '../../utils/dates';
import { ImageWithFallback } from '../shared';

type BlogCardVariant = 'home' | 'list';

interface BlogCardProps {
    post: BlogPostDocument;
    variant?: BlogCardVariant;
}

/** Both variants use the same markup with a `blog-` or `blog-list-` class prefix. */
const classPrefixes: Record<BlogCardVariant, string> = {
    home: 'blog',
    list: 'blog-list',
};

const TagList = ({ tags, className }: { tags: string[]; className: string }) => (
    <div className={`${className}s`}>
        {tags.map((tag, index) => (
            <span key={`${tag}-${index}`} className={className}>
                {tag}
            </span>
        ))}
    </div>
);

export function BlogCard({ post, variant = 'home' }: BlogCardProps) {
    const prefix = classPrefixes[variant];
    const tags = post.tags ?? [];

    return (
        <Link to={routes.blogPostBySlug(post.slug)} className={`${prefix}-card-link`}>
            <article className={`${prefix}-card`}>
                {post.coverImageId && (
                    <div className={`${prefix}-card-image`}>
                        <ImageWithFallback
                            src={getContentImagePreviewUrl(post.coverImageId)}
                            fallbackSrc={PLACEHOLDER_IMAGE}
                            alt={post.title}
                            loading="lazy"
                        />
                    </div>
                )}
                <div className={`${prefix}-card-content`}>
                    <h2 className={`${prefix}-title`}>{post.title}</h2>
                    <p className={`${prefix}-date`}>{formatBlogDate(post.publishedDate)}</p>
                    <p className={`${prefix}-summary`}>{post.summary}</p>

                    {variant === 'list' ? (
                        <div className="blog-list-card-meta">
                            {tags.length > 0 && <TagList tags={tags} className="blog-list-tag" />}
                            <div className="blog-list-views">
                                <span>{post.viewCount || 0} views</span>
                            </div>
                        </div>
                    ) : (
                        tags.length > 0 && <TagList tags={tags} className="blog-tag" />
                    )}

                    <div className={`${prefix}-read-more`}>
                        Read more <span aria-hidden="true">&rarr;</span>
                    </div>
                </div>
            </article>
        </Link>
    );
}
