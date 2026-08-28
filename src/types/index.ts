import type { Models } from 'appwrite';

export interface ProfileData {
    name: string;
    email: string;
    pronouns?: string[];
    education?: string[];
    languages?: string[];
    resumeFileId?: string;
    /** `null` clears a stored image; `undefined` leaves whatever is already saved. */
    profileImageId?: string | null;
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
    coverImageId?: string | null;
    viewCount?: number;
}

export interface SectionVisibility {
    about: boolean;
    projects: boolean;
    blogs: boolean;
    resumes: boolean;
}

/** Appwrite stores each of the shapes above as a document with its own metadata. */
export type ProfileDocument = Models.Document & ProfileData;
export type ProjectDocument = Models.Document & ProjectData;
export type BlogPostDocument = Models.Document & BlogPost;
export type SectionVisibilityDocument = Models.Document & SectionVisibility;

/** `fallback` means the request failed and hardcoded defaults are being shown instead. */
export type SectionVisibilityStatus = 'loading' | 'ready' | 'fallback';
