import type { ProfileData, ProjectData, BlogPost, SectionVisibility } from './index';

export function isProfileData(obj: unknown): obj is ProfileData {
    if (typeof obj !== 'object' || obj === null) return false;
    
    const candidate = obj as Record<string, unknown>;
    
    // Required fields
    if (typeof candidate.name !== 'string' || typeof candidate.email !== 'string') {
        return false;
    }
    
    // Optional fields - check if present, then validate type
    if (candidate.pronouns !== undefined && 
        (!Array.isArray(candidate.pronouns) || 
         !candidate.pronouns.every((p: unknown) => typeof p === 'string'))) {
        return false;
    }
    
    if (candidate.education !== undefined && 
        (!Array.isArray(candidate.education) || 
         !candidate.education.every((e: unknown) => typeof e === 'string'))) {
        return false;
    }
    
    if (candidate.languages !== undefined && 
        (!Array.isArray(candidate.languages) || 
         !candidate.languages.every((l: unknown) => typeof l === 'string'))) {
        return false;
    }
    
    if (candidate.resumeFileId !== undefined && typeof candidate.resumeFileId !== 'string') {
        return false;
    }
    
    if (candidate.profileImageId !== undefined && typeof candidate.profileImageId !== 'string') {
        return false;
    }
    
    if (candidate.linkedin !== undefined && typeof candidate.linkedin !== 'string') {
        return false;
    }
    
    if (candidate.github !== undefined && typeof candidate.github !== 'string') {
        return false;
    }
    
    return true;
}

export function isProjectData(obj: unknown): obj is ProjectData {
    if (typeof obj !== 'object' || obj === null) return false;
    
    const candidate = obj as Record<string, unknown>;
    
    // Required fields
    if (typeof candidate.title !== 'string' || 
        typeof candidate.role !== 'string' || 
        typeof candidate.date !== 'string' ||
        !Array.isArray(candidate.description) ||
        !candidate.description.every((d: unknown) => typeof d === 'string')) {
        return false;
    }
    
    // Optional fields
    if (candidate.logoFileId !== undefined && typeof candidate.logoFileId !== 'string') {
        return false;
    }
    
    if (candidate.link_url !== undefined && typeof candidate.link_url !== 'string') {
        return false;
    }
    
    if (candidate.link_text !== undefined && typeof candidate.link_text !== 'string') {
        return false;
    }
    
    if (candidate.isOpen !== undefined && typeof candidate.isOpen !== 'boolean') {
        return false;
    }
    
    return true;
}

export function isBlogPost(obj: unknown): obj is BlogPost {
    if (typeof obj !== 'object' || obj === null) return false;
    
    const candidate = obj as Record<string, unknown>;
    
    // Required fields
    if (typeof candidate.title !== 'string' ||
        typeof candidate.content !== 'string' ||
        typeof candidate.summary !== 'string' ||
        typeof candidate.slug !== 'string' ||
        typeof candidate.publishedDate !== 'string' ||
        typeof candidate.published !== 'boolean') {
        return false;
    }
    
    // Optional fields
    if (candidate.tags !== undefined && 
        (!Array.isArray(candidate.tags) || 
         !candidate.tags.every((t: unknown) => typeof t === 'string'))) {
        return false;
    }
    
    if (candidate.coverImageId !== undefined && typeof candidate.coverImageId !== 'string') {
        return false;
    }
    
    return true;
}

export function isSectionVisibility(obj: unknown): obj is SectionVisibility {
    if (typeof obj !== 'object' || obj === null) return false;
    
    const candidate = obj as Record<string, unknown>;
    
    return typeof candidate.about === 'boolean' &&
           typeof candidate.projects === 'boolean' &&
           typeof candidate.blogs === 'boolean';
}