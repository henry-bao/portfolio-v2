import { ID, Query } from 'appwrite';
import { COLLECTION_SECTION_VISIBILITY_ID, DATABASE_ID, databases } from '../config/appwrite';
import type { SectionVisibility, SectionVisibilityDocument } from '../types';
import { compactUndefined } from '../utils/object';

const defaultSectionVisibility: SectionVisibility = {
    about: true,
    projects: true,
    blogs: true,
    resumes: true,
};

export const getSectionVisibility = async (): Promise<SectionVisibilityDocument | null> => {
    try {
        const data = await databases.listDocuments(DATABASE_ID, COLLECTION_SECTION_VISIBILITY_ID, [Query.limit(1)]);

        if (data.documents.length > 0) {
            return data.documents[0] as unknown as SectionVisibilityDocument;
        }

        return (await createSectionVisibility(defaultSectionVisibility)) as unknown as SectionVisibilityDocument;
    } catch (error) {
        console.error('Error getting section visibility:', error);
        return null;
    }
};

const createSectionVisibility = async (data: SectionVisibility) => {
    try {
        return await databases.createDocument(DATABASE_ID, COLLECTION_SECTION_VISIBILITY_ID, ID.unique(), data);
    } catch (error) {
        console.error('Error creating section visibility:', error);
        throw error;
    }
};

export const updateSectionVisibility = async (visibilityId: string, data: Partial<SectionVisibility>) => {
    try {
        return await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_SECTION_VISIBILITY_ID,
            visibilityId,
            compactUndefined(data)
        );
    } catch (error) {
        console.error('Error updating section visibility:', error);
        throw error;
    }
};
