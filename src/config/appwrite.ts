import { Account, Client, Databases, Storage } from 'appwrite';

export const appwriteConfig = {
    endpoint: import.meta.env.VITE_APPWRITE_MAIN_ENDPOINT || 'https://cloud.appwrite.io/v1',
    projectId: import.meta.env.VITE_APPWRITE_MAIN_PROJECT_ID,
    databaseId: import.meta.env.VITE_APPWRITE_DB_ID,
    storageFileBucketId: import.meta.env.VITE_APPWRITE_STORAGE_FILE_BUCKET_ID,
    storageBlogsBucketId: import.meta.env.VITE_APPWRITE_STORAGE_BLOGS_BUCKET_ID,
    profileCollectionId: import.meta.env.VITE_APPWRITE_DB_PROFILE_COLLECTION_ID,
    projectsCollectionId: import.meta.env.VITE_APPWRITE_DB_PROJECTS_COLLECTION_ID,
    blogCollectionId: import.meta.env.VITE_APPWRITE_DB_BLOG_COLLECTION_ID,
    sectionVisibilityCollectionId: import.meta.env.VITE_APPWRITE_DB_SECTION_VISIBILITY_COLLECTION_ID,
    resumeCollectionId: import.meta.env.VITE_APPWRITE_DB_RESUME_COLLECTION_ID,
} as const;

export const DATABASE_ID = appwriteConfig.databaseId;
export const STORAGE_FILE_BUCKET_ID = appwriteConfig.storageFileBucketId;
export const STORAGE_BLOGS_BUCKET_ID = appwriteConfig.storageBlogsBucketId;
export const COLLECTION_PROFILE_ID = appwriteConfig.profileCollectionId;
export const COLLECTION_PROJECTS_ID = appwriteConfig.projectsCollectionId;
export const COLLECTION_BLOG_ID = appwriteConfig.blogCollectionId;
export const COLLECTION_SECTION_VISIBILITY_ID = appwriteConfig.sectionVisibilityCollectionId;
export const COLLECTION_RESUME_ID = appwriteConfig.resumeCollectionId;

export const appwriteClient = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId);

export const account = new Account(appwriteClient);
export const storage = new Storage(appwriteClient);
export const databases = new Databases(appwriteClient);

export const sendPing = () => appwriteClient.ping();
