import { ID, Query } from 'appwrite';
import { COLLECTION_PROFILE_ID, DATABASE_ID, databases } from '../config/appwrite';
import type { ProfileData, ProfileDocument } from '../types';
import { compactCreatePayload, compactUndefined } from '../utils/object';

export const getProfileData = async (): Promise<ProfileDocument | null> => {
    try {
        const data = await databases.listDocuments(DATABASE_ID, COLLECTION_PROFILE_ID, [Query.limit(1)]);
        return data.documents.length > 0 ? (data.documents[0] as unknown as ProfileDocument) : null;
    } catch (error) {
        console.error('Error getting profile data:', error);
        return null;
    }
};

export const createProfileData = async (data: ProfileData) => {
    try {
        const documentData = compactCreatePayload({
            name: data.name,
            email: data.email,
            pronouns: data.pronouns,
            education: data.education,
            languages: data.languages,
            linkedin: data.linkedin,
            github: data.github,
            profileImageId: data.profileImageId,
            resumeFileId: data.resumeFileId,
        });

        return await databases.createDocument(DATABASE_ID, COLLECTION_PROFILE_ID, ID.unique(), documentData);
    } catch (error) {
        console.error('Error creating profile data:', error);
        throw error;
    }
};

export const updateProfileData = async (profileId: string, data: Partial<ProfileData>) => {
    try {
        const documentData = compactUndefined({
            name: data.name,
            email: data.email,
            pronouns: data.pronouns,
            education: data.education,
            languages: data.languages,
            linkedin: data.linkedin,
            github: data.github,
            profileImageId: data.profileImageId,
            resumeFileId: data.resumeFileId,
        });

        return await databases.updateDocument(DATABASE_ID, COLLECTION_PROFILE_ID, profileId, documentData);
    } catch (error) {
        console.error('Error updating profile data:', error);
        throw error;
    }
};
