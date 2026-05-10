import { ID, Query, Models } from 'appwrite';
import { databases, storage, DATABASE_ID, STORAGE_FILE_BUCKET_ID, COLLECTION_RESUME_ID } from './appwrite';

export interface ResumeVersion {
    fileId: string;
    fileName: string;
    uploadDate: string;
    isActive: boolean;
    description?: string;
}

const resumeUploadDateOrder = [Query.orderDesc('uploadDate')];

const deactivateActiveResumeVersions = (versions: Array<Models.Document & ResumeVersion>) =>
    Promise.all(
        versions
            .filter((version) => version.isActive)
            .map((version) =>
                databases.updateDocument(DATABASE_ID, COLLECTION_RESUME_ID, version.$id, { isActive: false })
            )
    );

export const getResumeVersions = async (): Promise<(Models.Document & ResumeVersion)[]> => {
    try {
        const data = await databases.listDocuments(DATABASE_ID, COLLECTION_RESUME_ID, resumeUploadDateOrder);

        return data.documents as unknown as (Models.Document & ResumeVersion)[];
    } catch (error) {
        console.error('Error getting resume versions:', error);
        return [];
    }
};

export const getActiveResumeVersion = async (): Promise<(Models.Document & ResumeVersion) | null> => {
    try {
        const data = await databases.listDocuments(DATABASE_ID, COLLECTION_RESUME_ID, [
            Query.equal('isActive', true),
            Query.limit(1),
        ]);

        if (data.documents.length === 0) {
            return null;
        }

        return data.documents[0] as unknown as Models.Document & ResumeVersion;
    } catch (error) {
        console.error('Error getting active resume version:', error);
        return null;
    }
};

export const addResumeVersion = async (
    file: File,
    description?: string,
    setAsActive = false
): Promise<Models.Document & ResumeVersion> => {
    try {
        const uploadResult = await storage.createFile(STORAGE_FILE_BUCKET_ID, ID.unique(), file);
        const existingVersions = await getResumeVersions();
        const isFirstVersion = existingVersions.length === 0;
        const isActive = isFirstVersion || setAsActive;

        const resumeData: ResumeVersion = {
            fileId: uploadResult.$id,
            fileName: file.name,
            uploadDate: new Date().toISOString(),
            isActive,
            description,
        };

        const result = await databases.createDocument(DATABASE_ID, COLLECTION_RESUME_ID, ID.unique(), resumeData);

        if (setAsActive && !isFirstVersion) {
            await deactivateActiveResumeVersions(existingVersions);
        }

        return result as unknown as Models.Document & ResumeVersion;
    } catch (error) {
        console.error('Error adding resume version:', error);
        throw error;
    }
};

export const setResumeAsActive = async (resumeId: string): Promise<void> => {
    try {
        const versions = await getResumeVersions();
        await deactivateActiveResumeVersions(versions);
        await databases.updateDocument(DATABASE_ID, COLLECTION_RESUME_ID, resumeId, { isActive: true });
    } catch (error) {
        console.error('Error setting resume as active:', error);
        throw error;
    }
};

export const updateResumeVersion = async (
    resumeId: string,
    updates: { fileName?: string; description?: string }
): Promise<Models.Document & ResumeVersion> => {
    try {
        const result = await databases.updateDocument(DATABASE_ID, COLLECTION_RESUME_ID, resumeId, updates);

        return result as unknown as Models.Document & ResumeVersion;
    } catch (error) {
        console.error('Error updating resume version:', error);
        throw error;
    }
};

export const deleteResumeVersion = async (resumeId: string, fileId: string): Promise<void> => {
    try {
        const resumeDoc = (await databases.getDocument(
            DATABASE_ID,
            COLLECTION_RESUME_ID,
            resumeId
        )) as unknown as Models.Document & ResumeVersion;

        await databases.deleteDocument(DATABASE_ID, COLLECTION_RESUME_ID, resumeId);
        await storage.deleteFile(STORAGE_FILE_BUCKET_ID, fileId);

        if (resumeDoc.isActive) {
            const remainingVersions = await getResumeVersions();
            if (remainingVersions.length > 0) {
                await setResumeAsActive(remainingVersions[0].$id);
            }
        }
    } catch (error) {
        console.error('Error deleting resume version:', error);
        throw error;
    }
};
