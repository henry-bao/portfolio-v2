import type { ProfileDocument } from '../types';

export interface DisplayProfileData {
    name: string;
    pronouns: string[];
    education: string[];
    languages: string[];
    resumeFileId?: string;
    profileImageId?: string;
    linkedin: string;
    github: string;
    email: string;
}

export const fallbackProfileData: DisplayProfileData = {
    name: 'Henry Bao',
    pronouns: ['He', 'Him'],
    education: ['MS @ Cornell', 'BS @ UW'],
    languages: ['Python', 'JavaScript/TypeScript', 'Swift', 'Java'],
    linkedin: 'https://www.linkedin.com/in/henglibao',
    github: 'https://github.com/henry-bao',
    email: 'henry@bao.dev',
};

export const fallbackProfileImage = '/img/henry_800x800.png';
export const fallbackResumeUrl = '/file/Resume.pdf';

export const mapProfileDocumentToDisplayData = (doc: ProfileDocument | null): DisplayProfileData => {
    if (!doc) {
        return fallbackProfileData;
    }

    return {
        ...fallbackProfileData,
        name: doc.name || fallbackProfileData.name,
        pronouns: doc.pronouns || fallbackProfileData.pronouns,
        education: doc.education || fallbackProfileData.education,
        languages: doc.languages || fallbackProfileData.languages,
        resumeFileId: doc.resumeFileId,
        profileImageId: doc.profileImageId,
        linkedin: doc.linkedin || fallbackProfileData.linkedin,
        github: doc.github || fallbackProfileData.github,
        email: doc.email || fallbackProfileData.email,
    };
};
