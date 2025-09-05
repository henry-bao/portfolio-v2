import type { Models } from 'appwrite';

// Base interfaces from appwrite service
export interface ProfileData {
    name: string;
    email: string;
    pronouns?: string[];
    education?: string[];
    languages?: string[];
    resumeFileId?: string;
    profileImageId?: string;
    linkedin?: string;
    github?: string;
}

export interface ProjectData {
    title: string;
    role: string;
    description: string[];
    date: string;
    logoFileId?: string;
    link_url?: string;
    link_text?: string;
    isOpen?: boolean;
    order?: number;
}

export interface BlogPost {
    title: string;
    content: string;
    summary: string;
    slug: string;
    publishedDate: string;
    published: boolean;
    tags?: string[];
    coverImageId?: string;
    viewCount?: number;
}

export interface SectionVisibility {
    about: boolean;
    projects: boolean;
    blogs: boolean;
    resumes: boolean;
}

// Combined types with Appwrite document properties
export type ProfileDocument = Models.Document & ProfileData;
export type ProjectDocument = Models.Document & ProjectData;
export type BlogPostDocument = Models.Document & BlogPost;
export type SectionVisibilityDocument = Models.Document & SectionVisibility;

// API State types
export type DataState<T> =
    | { status: 'idle'; data: null; error: null }
    | { status: 'loading'; data: null; error: null }
    | { status: 'success'; data: T; error: null }
    | { status: 'error'; data: null; error: string };

// Re-export custom type guards that properly handle optional properties
export { isProfileData, isProjectData, isBlogPost, isSectionVisibility } from './guards';
