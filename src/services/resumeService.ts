import { databases, storage, DATABASE_ID, STORAGE_FILE_BUCKET_ID, COLLECTION_RESUME_ID } from './appwrite';
import { ID, Query, Models } from 'appwrite';

export interface ResumeVersion {
    fileId: string;
    fileName: string;
    uploadDate: string;
    isActive: boolean;
    description?: string;
}

// Get all resume versions
export const getResumeVersions = async (): Promise<(Models.Document & ResumeVersion)[]> => {
    try {
        const data = await databases.listDocuments(DATABASE_ID, COLLECTION_RESUME_ID, [
            Query.orderDesc('uploadDate'), // Sort by upload date, newest first
        ]);

        return data.documents as (Models.Document & ResumeVersion)[];
    } catch (error) {
        console.error('Error getting resume versions:', error);
        return [];
    }
};

// Get active resume version
export const getActiveResumeVersion = async (): Promise<(Models.Document & ResumeVersion) | null> => {
    try {
        const data = await databases.listDocuments(DATABASE_ID, COLLECTION_RESUME_ID, [
            Query.equal('isActive', true),
            Query.limit(1),
        ]);

        if (data.documents.length === 0) {
            return null;
        }

        return data.documents[0] as Models.Document & ResumeVersion;
    } catch (error) {
        console.error('Error getting active resume version:', error);
        return null;
    }
};

// Add a new resume version
export const addResumeVersion = async (
    file: File,
    description?: string,
    setAsActive: boolean = false
): Promise<Models.Document & ResumeVersion> => {
    try {
        // Upload the file
        const uploadResult = await storage.createFile(STORAGE_FILE_BUCKET_ID, ID.unique(), file);

        // Check if this is the first resume version
        const existingVersions = await getResumeVersions();
        const isFirstVersion = existingVersions.length === 0;

        // Create the resume version document
        const resumeData: ResumeVersion = {
            fileId: uploadResult.$id,
            fileName: file.name,
            uploadDate: new Date().toISOString(),
            isActive: isFirstVersion || setAsActive, // Make it active if it's the first version or if setAsActive is true
            description: description,
        };

        // Add to database
        const result = await databases.createDocument(DATABASE_ID, COLLECTION_RESUME_ID, ID.unique(), resumeData);

        // If this should be active and it's not the first version, deactivate other versions
        if (setAsActive && !isFirstVersion) {
            // Set all other resumes to inactive
            for (const version of existingVersions) {
                if (version.isActive) {
                    await databases.updateDocument(DATABASE_ID, COLLECTION_RESUME_ID, version.$id, { isActive: false });
                }
            }
        }

        return result as Models.Document & ResumeVersion;
    } catch (error) {
        console.error('Error adding resume version:', error);
        throw error;
    }
};

// Set a resume version as active
export const setResumeAsActive = async (resumeId: string): Promise<void> => {
    try {
        // First, set all resumes to inactive
        const versions = await getResumeVersions();

        for (const version of versions) {
            if (version.isActive) {
                await databases.updateDocument(DATABASE_ID, COLLECTION_RESUME_ID, version.$id, { isActive: false });
            }
        }

        // Then set the selected resume as active
        await databases.updateDocument(DATABASE_ID, COLLECTION_RESUME_ID, resumeId, { isActive: true });
    } catch (error) {
        console.error('Error setting resume as active:', error);
        throw error;
    }
};

// Update a resume version
export const updateResumeVersion = async (
    resumeId: string,
    updates: { fileName?: string; description?: string }
): Promise<Models.Document & ResumeVersion> => {
    try {
        // Update the document
        const result = await databases.updateDocument(DATABASE_ID, COLLECTION_RESUME_ID, resumeId, updates);

        return result as Models.Document & ResumeVersion;
    } catch (error) {
        console.error('Error updating resume version:', error);
        throw error;
    }
};

// Delete a resume version
export const deleteResumeVersion = async (resumeId: string, fileId: string): Promise<void> => {
    try {
        // Check if this is the active resume
        const resumeDoc = (await databases.getDocument(
            DATABASE_ID,
            COLLECTION_RESUME_ID,
            resumeId
        )) as Models.Document & ResumeVersion;

        // Delete the document
        await databases.deleteDocument(DATABASE_ID, COLLECTION_RESUME_ID, resumeId);

        // Delete the file
        await storage.deleteFile(STORAGE_FILE_BUCKET_ID, fileId);

        // If this was the active resume, set another one as active if available
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
