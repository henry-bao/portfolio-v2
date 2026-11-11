import { Account, Client, Databases, Storage } from 'appwrite';

const env = import.meta.env;

export const DATABASE_ID = env.VITE_APPWRITE_DB_ID;
/** The project's only storage bucket; see storageService for how files are organized inside it. */
export const STORAGE_BUCKET_ID = env.VITE_APPWRITE_STORAGE_FILE_BUCKET_ID;
export const COLLECTION_PROFILE_ID = env.VITE_APPWRITE_DB_PROFILE_COLLECTION_ID;
export const COLLECTION_PROJECTS_ID = env.VITE_APPWRITE_DB_PROJECTS_COLLECTION_ID;
export const COLLECTION_BLOG_ID = env.VITE_APPWRITE_DB_BLOG_COLLECTION_ID;
export const COLLECTION_SECTION_VISIBILITY_ID = env.VITE_APPWRITE_DB_SECTION_VISIBILITY_COLLECTION_ID;
export const COLLECTION_RESUME_ID = env.VITE_APPWRITE_DB_RESUME_COLLECTION_ID;

const appwriteClient = new Client()
    .setEndpoint(env.VITE_APPWRITE_MAIN_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(env.VITE_APPWRITE_MAIN_PROJECT_ID);

export const account = new Account(appwriteClient);
export const storage = new Storage(appwriteClient);
export const databases = new Databases(appwriteClient);

export const sendPing = () => appwriteClient.ping();
