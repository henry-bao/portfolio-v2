import { useCallback } from 'react';

export interface DraftBlogPost {
    id: string;
    title: string;
    content: string;
    summary: string;
    slug: string;
    publishedDate: string;
    published: boolean;
    tags: string[];
    lastSaved: string;
}

export function useBlogDraft(draftId: string) {
    const getDraftsFromStorage = (): DraftBlogPost[] => {
        const drafts = localStorage.getItem('blog_drafts');
        return drafts ? JSON.parse(drafts) : [];
    };

    const saveDraftToStorage = useCallback((draft: DraftBlogPost) => {
        const drafts = getDraftsFromStorage();
        const draftIndex = drafts.findIndex((d) => d.id === draftId);

        if (draftIndex >= 0) {
            drafts[draftIndex] = draft;
        } else {
            drafts.push(draft);
        }

        localStorage.setItem('blog_drafts', JSON.stringify(drafts));
    }, [draftId]);

    const removeDraftFromStorage = useCallback(() => {
        const drafts = getDraftsFromStorage();
        const filteredDrafts = drafts.filter((d) => d.id !== draftId);
        localStorage.setItem('blog_drafts', JSON.stringify(filteredDrafts));
    }, [draftId]);

    const getDraft = useCallback((): DraftBlogPost | null => {
        const drafts = getDraftsFromStorage();
        return drafts.find((draft) => draft.id === draftId) || null;
    }, [draftId]);

    const saveDraft = useCallback((blogData: Omit<DraftBlogPost, 'id' | 'lastSaved'>) => {
        const draft: DraftBlogPost = {
            ...blogData,
            id: draftId,
            lastSaved: new Date().toISOString(),
        };
        saveDraftToStorage(draft);
        return draft.lastSaved;
    }, [draftId, saveDraftToStorage]);

    return {
        getDraft,
        saveDraft,
        removeDraft: removeDraftFromStorage,
        getDraftsFromStorage
    };
}