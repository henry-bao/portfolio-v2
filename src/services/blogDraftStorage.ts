export interface DraftBlogPost {
    id?: string;
    title: string;
    content: string;
    summary: string;
    slug: string;
    publishedDate: string;
    published?: boolean;
    tags: string[];
    lastSaved: string;
    hasCoverImage?: boolean;
    coverImageId?: string;
    coverImageUrl?: string;
}

export const BLOG_DRAFTS_STORAGE_KEY = 'blog_drafts';

export const getBlogDrafts = (): DraftBlogPost[] => {
    try {
        const draftsJson = localStorage.getItem(BLOG_DRAFTS_STORAGE_KEY);
        return draftsJson ? (JSON.parse(draftsJson) as DraftBlogPost[]) : [];
    } catch (error) {
        console.error('Error reading blog drafts:', error);
        return [];
    }
};

export const setBlogDrafts = (drafts: DraftBlogPost[]) => {
    localStorage.setItem(BLOG_DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
};

export const getBlogDraft = (draftId: string) => getBlogDrafts().find((draft) => draft.id === draftId) || null;

export const upsertBlogDraft = (draft: DraftBlogPost) => {
    if (!draft.id) {
        throw new Error('Draft ID is required');
    }

    const drafts = getBlogDrafts();
    const draftIndex = drafts.findIndex((storedDraft) => storedDraft.id === draft.id);

    if (draftIndex >= 0) {
        drafts[draftIndex] = draft;
    } else {
        drafts.push(draft);
    }

    setBlogDrafts(drafts);
    return draft.id;
};

export const removeBlogDraft = (draftId?: string) => {
    if (!draftId) {
        return;
    }

    setBlogDrafts(getBlogDrafts().filter((draft) => draft.id !== draftId));
};
