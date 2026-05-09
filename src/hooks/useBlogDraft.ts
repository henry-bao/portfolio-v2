import { useCallback } from 'react';
import { getBlogDraft, getBlogDrafts, removeBlogDraft, upsertBlogDraft } from '../services/blogDraftStorage';
import type { DraftBlogPost } from '../services/blogDraftStorage';

export type { DraftBlogPost };

export function useBlogDraft(draftId: string) {
    const saveDraftToStorage = useCallback((draft: DraftBlogPost) => {
        upsertBlogDraft({ ...draft, id: draftId });
    }, [draftId]);

    const removeDraftFromStorage = useCallback(() => {
        removeBlogDraft(draftId);
    }, [draftId]);

    const getDraft = useCallback((): DraftBlogPost | null => {
        return getBlogDraft(draftId);
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
        getDraftsFromStorage: getBlogDrafts,
    };
}
