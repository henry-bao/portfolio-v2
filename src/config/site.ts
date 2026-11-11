/**
 * Single source of truth for the site owner's public details and built-in fallback content.
 * Anything hardcoded in more than one place belongs here so the copies stay in sync.
 */
export const OWNER_NAME = 'Henry Bao';
export const CONTACT_EMAIL = 'henry@bao.dev';

/**
 * Every uploaded resume is stored under this name, so the download filename never depends on what the
 * file was called on disk. The dashboard still lists each version by its original filename.
 */
export const RESUME_FILE_NAME = 'HenryBao_Resume.pdf';

/** Shown when the profile can't be loaded, so the About section is never empty. */
export const FALLBACK_PROFILE = {
    name: OWNER_NAME,
    pronouns: ['He', 'Him'],
    education: ['MS @ Cornell', 'BS @ UW'],
    languages: ['Python', 'JavaScript/TypeScript', 'Swift', 'Java'],
    linkedin: 'https://www.linkedin.com/in/henglibao',
    github: 'https://github.com/henry-bao',
    email: CONTACT_EMAIL,
};

/** Static assets served from `public/`, used whenever remote content is missing. */
export const PLACEHOLDER_IMAGE = '/img/placeholder.svg';
export const FALLBACK_PROFILE_IMAGE = '/img/henry_800x800.png';
