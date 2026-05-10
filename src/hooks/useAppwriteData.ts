import { useCallback } from 'react';
import { useAsyncData } from './useAsyncData';
import type { AsyncDataOptions } from './useAsyncData';
import { getProjects, getBlogPosts, getProfileData } from '../services/appwrite';
import type { ProjectDocument, BlogPostDocument, ProfileDocument } from '../types';

export function useProjects(options?: AsyncDataOptions<ProjectDocument[]>) {
  return useAsyncData<ProjectDocument[]>(getProjects, options);
}

export function useBlogPosts(publishedOnly = false, options?: AsyncDataOptions<BlogPostDocument[]>) {
  const fetchBlogPosts = useCallback(() => getBlogPosts(publishedOnly), [publishedOnly]);
  return useAsyncData<BlogPostDocument[]>(fetchBlogPosts, options);
}

export function useProfileData(options?: AsyncDataOptions<ProfileDocument | null>) {
  return useAsyncData<ProfileDocument | null>(getProfileData, options);
}
