import { ID, Query } from 'appwrite';
import { COLLECTION_PROJECTS_ID, DATABASE_ID, databases } from '../config/appwrite';
import type { ProjectData, ProjectDocument } from '../types';

export const getProjects = async (): Promise<ProjectDocument[]> => {
    try {
        const data = await databases.listDocuments(DATABASE_ID, COLLECTION_PROJECTS_ID, [Query.orderAsc('order')]);
        return data.documents as unknown as ProjectDocument[];
    } catch (error) {
        console.error('Error getting projects:', error);
        return [];
    }
};

export const getProject = async (projectId: string): Promise<ProjectDocument> => {
    try {
        return (await databases.getDocument(DATABASE_ID, COLLECTION_PROJECTS_ID, projectId)) as unknown as ProjectDocument;
    } catch (error) {
        console.error('Error getting project:', error);
        throw error;
    }
};

export const createProject = async (data: ProjectData) => {
    try {
        return await databases.createDocument(DATABASE_ID, COLLECTION_PROJECTS_ID, ID.unique(), data);
    } catch (error) {
        console.error('Error creating project:', error);
        throw error;
    }
};

export const updateProject = async (projectId: string, data: Partial<ProjectData>) => {
    try {
        return await databases.updateDocument(DATABASE_ID, COLLECTION_PROJECTS_ID, projectId, data);
    } catch (error) {
        console.error('Error updating project:', error);
        throw error;
    }
};

export const deleteProject = async (projectId: string) => {
    try {
        await databases.deleteDocument(DATABASE_ID, COLLECTION_PROJECTS_ID, projectId);
        return true;
    } catch (error) {
        console.error('Error deleting project:', error);
        throw error;
    }
};
