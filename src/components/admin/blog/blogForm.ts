import { blogApi } from '../../../api';
import type { BlogDraft, BlogPost } from '../../../api';
import { getTodayInputDate, toInputDate } from '../../../lib/dates';

/** What the blog editor edits. `publishedDate` is `YYYY-MM-DD`, as `<input type="date">` uses. */
export interface BlogFormValues {
    title: string;
    slug: string;
    summary: string;
    content: string;
    publishedDate: string;
    published: boolean;
    tags: string[];
}

/** Matches the tag limit in blogPostInputSchema. */
export const MAX_TAGS = 20;
export const MAX_TAG_LENGTH = 99;

export const emptyFormValues = (): BlogFormValues => ({
    title: '',
    slug: '',
    summary: '',
    content: '',
    publishedDate: getTodayInputDate(),
    published: false,
    tags: [],
});

export const formValuesFromPost = (post: BlogPost): BlogFormValues => ({
    title: post.title,
    slug: post.slug,
    summary: post.summary,
    content: post.content,
    publishedDate: toInputDate(post.publishedDate) || getTodayInputDate(),
    published: post.published,
    tags: post.tags,
});

export const formValuesFromDraft = (draft: BlogDraft): BlogFormValues => ({
    title: draft.title,
    slug: draft.slug,
    summary: draft.summary,
    content: draft.content,
    publishedDate: toInputDate(draft.publishedDate) || getTodayInputDate(),
    published: draft.published,
    tags: draft.tags,
});

export const sameFormValues = (a: BlogFormValues, b: BlogFormValues) => JSON.stringify(a) === JSON.stringify(b);

export const hasWrittenAnything = ({ title, summary, content }: BlogFormValues) =>
    Boolean(title.trim() || summary.trim() || content.trim());

/**
 * A slug the user typed or generated on purpose is left alone. Otherwise it follows the title.
 * Saved posts always start "manual", so a published post's URL never changes by accident.
 */
export const isSlugManual = (post: BlogPost | null, draft: BlogDraft | null) =>
    Boolean(post) || Boolean(draft && draft.slug && draft.slug !== blogApi.slugify(draft.title));

/** Adds `tag` unless it's blank, a case-insensitive duplicate, or over the limit. */
export function addTag(tags: string[], tag: string): string[] {
    const trimmed = tag.trim().slice(0, MAX_TAG_LENGTH);
    const exists = tags.some((existing) => existing.toLowerCase() === trimmed.toLowerCase());

    return !trimmed || exists || tags.length >= MAX_TAGS ? tags : [...tags, trimmed];
}

/** Markdown for an inserted image; `[` and `]` are stripped so the alt text can't break the syntax. */
export const imageMarkdown = (fileName: string, url: string) => {
    const alt = fileName.replace(/\.[^.]+$/, '').replace(/[[\]]/g, '').trim() || 'image';
    return `![${alt}](${url})`;
};
