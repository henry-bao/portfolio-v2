import { ID, Query } from 'appwrite';
import type { Models } from 'appwrite';
import { COLLECTION_RESUME_ID, DATABASE_ID, STORAGE_FILE_BUCKET_ID, databases, storage } from '../config/appwrite';

interface ResumeVersion {
    fileId: string;
    fileName: string;
    uploadDate: string;
    isActive: boolean;
    description?: string;
}

export type ResumeVersionDocument = Models.Document & ResumeVersion;

const newestFirst = [Query.orderDesc('uploadDate')];

const deactivateActiveResumeVersions = (versions: ResumeVersionDocument[]) =>
    Promise.all(
        versions
            .filter((version) => version.isActive)
            .map((version) =>
                databases.updateDocument(DATABASE_ID, COLLECTION_RESUME_ID, version.$id, { isActive: false })
            )
    );

export const getResumeVersions = async (): Promise<ResumeVersionDocument[]> => {
    try {
        const data = await databases.listDocuments(DATABASE_ID, COLLECTION_RESUME_ID, newestFirst);
        return data.documents as unknown as ResumeVersionDocument[];
    } catch (error) {
        console.error('Error getting resume versions:', error);
        return [];
    }
};

export const getActiveResumeVersion = async (): Promise<ResumeVersionDocument | null> => {
    try {
        const data = await databases.listDocuments(DATABASE_ID, COLLECTION_RESUME_ID, [
            Query.equal('isActive', true),
            Query.limit(1),
        ]);

        return (data.documents[0] as unknown as ResumeVersionDocument) ?? null;
    } catch (error) {
        console.error('Error getting active resume version:', error);
        return null;
    }
};

export const addResumeVersion = async (
    file: File,
    description?: string,
    setAsActive = false
): Promise<ResumeVersionDocument> => {
    try {
        const uploadResult = await storage.createFile(STORAGE_FILE_BUCKET_ID, ID.unique(), file);
        const existingVersions = await getResumeVersions();
        const isFirstVersion = existingVersions.length === 0;

        const resumeData: ResumeVersion = {
            fileId: uploadResult.$id,
            fileName: file.name,
            uploadDate: new Date().toISOString(),
            isActive: isFirstVersion || setAsActive,
            description,
        };

        const result = await databases.createDocument(DATABASE_ID, COLLECTION_RESUME_ID, ID.unique(), resumeData);

        if (setAsActive && !isFirstVersion) {
            await deactivateActiveResumeVersions(existingVersions);
        }

        return result as unknown as ResumeVersionDocument;
    } catch (error) {
        console.error('Error adding resume version:', error);
        throw error;
    }
};

export const setResumeAsActive = async (resumeId: string): Promise<void> => {
    try {
        await deactivateActiveResumeVersions(await getResumeVersions());
        await databases.updateDocument(DATABASE_ID, COLLECTION_RESUME_ID, resumeId, { isActive: true });
    } catch (error) {
        console.error('Error setting resume as active:', error);
        throw error;
    }
};

export const updateResumeVersion = async (
    resumeId: string,
    updates: { fileName?: string; description?: string }
): Promise<ResumeVersionDocument> => {
    try {
        const result = await databases.updateDocument(DATABASE_ID, COLLECTION_RESUME_ID, resumeId, updates);
        return result as unknown as ResumeVersionDocument;
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
        )) as unknown as ResumeVersionDocument;

        await databases.deleteDocument(DATABASE_ID, COLLECTION_RESUME_ID, resumeId);
        await storage.deleteFile(STORAGE_FILE_BUCKET_ID, fileId);

        if (!resumeDoc.isActive) {
            return;
        }

        // Promote the newest remaining version so the public resume link keeps working.
        const [newestRemaining] = await getResumeVersions();

        if (newestRemaining) {
            await setResumeAsActive(newestRemaining.$id);
        }
    } catch (error) {
        console.error('Error deleting resume version:', error);
        throw error;
    }
};
