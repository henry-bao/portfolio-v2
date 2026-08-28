import { useCallback } from 'react';
import { useAsyncData } from './useAsyncData';
import type { AsyncDataOptions } from './useAsyncData';
import { getBlogPosts } from '../services/blogService';
import { getProfileData } from '../services/profileService';
import { getProjects } from '../services/projectService';
import { getActiveResumeVersion } from '../services/resumeService';
import type { ResumeVersionDocument } from '../services/resumeService';
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

export function useActiveResumeVersion(options?: AsyncDataOptions<ResumeVersionDocument | null>) {
  return useAsyncData<ResumeVersionDocument | null>(getActiveResumeVersion, options);
}
