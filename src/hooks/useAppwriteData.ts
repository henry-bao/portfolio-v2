import { useCallback } from 'react';
import { useAsyncData } from './useAsyncData';
import { getProjects, getBlogPosts, getProfileData } from '../services/appwrite';
import type { ProjectDocument, BlogPostDocument, ProfileDocument } from '../types';

export function useProjects() {
  return useAsyncData<ProjectDocument[]>(getProjects);
}

export function useBlogPosts(publishedOnly = false) {
  const fetchBlogPosts = useCallback(() => getBlogPosts(publishedOnly), [publishedOnly]);
  return useAsyncData<BlogPostDocument[]>(fetchBlogPosts);
}

export function useProfileData() {
  return useAsyncData<ProfileDocument | null>(getProfileData);
}