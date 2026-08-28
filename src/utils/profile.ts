import { CONTACT_EMAIL } from '../config/site';
import type { ProfileDocument } from '../types';

interface DisplayProfileData {
    name: string;
    pronouns: string[];
    education: string[];
    languages: string[];
    linkedin: string;
    github: string;
    email: string;
}

/** Shown when the profile document cannot be loaded, so the About section is never empty. */
const fallbackProfileData: DisplayProfileData = {
    name: 'Henry Bao',
    pronouns: ['He', 'Him'],
    education: ['MS @ Cornell', 'BS @ UW'],
    languages: ['Python', 'JavaScript/TypeScript', 'Swift', 'Java'],
    linkedin: 'https://www.linkedin.com/in/henglibao',
    github: 'https://github.com/henry-bao',
    email: CONTACT_EMAIL,
};

export const mapProfileDocumentToDisplayData = (doc: ProfileDocument | null): DisplayProfileData => {
    if (!doc) {
        return fallbackProfileData;
    }

    return {
        name: doc.name || fallbackProfileData.name,
        pronouns: doc.pronouns ?? fallbackProfileData.pronouns,
        education: doc.education ?? fallbackProfileData.education,
        languages: doc.languages ?? fallbackProfileData.languages,
        linkedin: doc.linkedin || fallbackProfileData.linkedin,
        github: doc.github || fallbackProfileData.github,
        email: doc.email || fallbackProfileData.email,
    };
};
