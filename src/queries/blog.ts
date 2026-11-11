import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { blogApi, draftsApi, mediaApi } from '../api';
import type { BlogPost } from '../api';
import { queryKeys } from './keys';

export const usePublishedPosts = ({ limit, enabled = true }: { limit?: number; enabled?: boolean } = {}) =>
    useQuery({
        queryKey: queryKeys.blog.published(limit),
        queryFn: () => blogApi.listPublishedPosts(limit),
        enabled,
    });

/** Every post including unpublished ones. Admin only. */
export const useAllPosts = () => useQuery({ queryKey: queryKeys.blog.everything, queryFn: blogApi.listAllPosts });

export const usePost = (postId: string | undefined) =>
    useQuery({
        queryKey: queryKeys.blog.detail(postId ?? ''),
        queryFn: () => blogApi.getPost(postId as string),
        enabled: Boolean(postId),
    });

export const usePostBySlug = (
    slug: string,
    { includeUnpublished, enabled = true }: { includeUnpublished: boolean; enabled?: boolean }
) =>
    useQuery({
        queryKey: queryKeys.blog.bySlug(slug, includeUnpublished),
        queryFn: () => blogApi.getPostBySlug(slug, { includeUnpublished }),
        enabled,
    });

function useBlogMutation<Variables, Result extends BlogPost | void>(
    mutationFn: (variables: Variables) => Promise<Result>
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn,
        onSuccess: (result) => {
            const post = result as BlogPost | void;

            if (post) {
                queryClient.setQueryData(queryKeys.blog.detail(post.$id), post);
            }
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.blog.all }),
    });
}

export const useSavePost = () => useBlogMutation(blogApi.savePost);

export const useSetPostPublished = () =>
    useBlogMutation(({ post, published }: { post: BlogPost; published: boolean }) =>
        blogApi.setPostPublished(post, published)
    );

/** Also deletes the post's local draft, so it doesn't linger as an orphan. */
export const useDeletePost = () =>
    useBlogMutation(async (post: BlogPost) => {
        await blogApi.deletePost(post);
        draftsApi.deleteDraft(post.$id);
    });

/** Local drafts, kept in sync across components and browser tabs. */
export const useDrafts = () => useSyncExternalStore(draftsApi.subscribeToDrafts, draftsApi.listDrafts);

export const useBlogImages = ({ enabled = true }: { enabled?: boolean } = {}) =>
    useQuery({ queryKey: queryKeys.media, queryFn: mediaApi.listBlogImages, enabled });

function useMediaMutation<Variables, Result>(mutationFn: (variables: Variables) => Promise<Result>) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn,
        onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.media }),
    });
}

export const useUploadBlogImage = () => useMediaMutation(mediaApi.uploadBlogImage);
export const useDeleteBlogImage = () => useMediaMutation(mediaApi.deleteBlogImage);
export const useReplaceBlogImage = () =>
    useMediaMutation(({ fileId, file }: { fileId: string; file: File }) => mediaApi.replaceBlogImage(fileId, file));
