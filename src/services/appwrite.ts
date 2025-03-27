import { Client, Account, Storage, Databases, ID, Query, Models } from 'appwrite';

// Initialize Appwrite client
const client = new Client();

// Set Appwrite endpoint and project ID
// These values should be stored in environment variables in a production app
client.setEndpoint('https://cloud.appwrite.io/v1').setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

// Initialize Appwrite services
export const account = new Account(client);
export const storage = new Storage(client);
export const databases = new Databases(client);

// Bucket and database IDs
export const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID;
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const PROFILE_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PROFILE_COLLECTION_ID;
export const PROJECTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PROJECTS_COLLECTION_ID;
export const BLOG_COLLECTION_ID = import.meta.env.VITE_APPWRITE_BLOG_COLLECTION_ID;

// Define interfaces for our data
export interface ProfileData {
    name: string;
    email: string;
    pronouns?: string[];
    education?: string[];
    languages?: string[];
    resumeFileId?: string;
    profileImageId?: string;
    linkedin?: string;
    github?: string;
}

export interface ProjectData {
    title: string;
    role: string;
    description: string[];
    date: string;
    logoFileId?: string;
    link_url?: string;
    link_text?: string;
    isOpen?: boolean;
    order?: number;
}

export interface BlogPost {
    title: string;
    content: string;
    summary: string;
    slug: string;
    coverImageId?: string;
    publishedDate: string;
    published: boolean;
    tags?: string[];
    viewCount?: number;
}

// Authentication functions
export const createAccount = async (email: string, password: string, name: string) => {
    try {
        const newAccount = await account.create(ID.unique(), email, password, name);
        if (newAccount) {
            // Login immediately after account creation
            return await login(email, password);
        }
        return newAccount;
    } catch (error) {
        console.error('Error creating account:', error);
        throw error;
    }
};

export const login = async (email: string, password: string) => {
    try {
        return await account.createEmailPasswordSession(email, password);
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
};

export const getCurrentUser = async () => {
    try {
        return await account.get();
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
};

export const logout = async () => {
    try {
        return await account.deleteSession('current');
    } catch (error) {
        console.error('Error logging out:', error);
        throw error;
    }
};

// File storage functions
export const uploadFile = async (file: File) => {
    try {
        const result = await storage.createFile(BUCKET_ID, ID.unique(), file);
        return result;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

export const getFilePreview = (fileId: string) => {
    return storage.getFilePreview(BUCKET_ID, fileId);
};

export const deleteFile = async (fileId: string) => {
    try {
        await storage.deleteFile(BUCKET_ID, fileId);
        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
};

// Database functions for profile data
export const getProfileData = async (): Promise<(Models.Document & ProfileData) | null> => {
    try {
        const data = await databases.listDocuments(DATABASE_ID, PROFILE_COLLECTION_ID, [Query.limit(1)]);

        if (data.documents.length === 0) {
            return null;
        }

        return data.documents[0] as Models.Document & ProfileData;
    } catch (error) {
        console.error('Error getting profile data:', error);
        return null;
    }
};

export const createProfileData = async (data: ProfileData) => {
    try {
        // Create a document with the correct structure based on your Appwrite collection schema
        // You need to match the field names with what's defined in your Appwrite collection
        const documentData: Record<string, unknown> = {};

        if (data.name) documentData.name = data.name;
        if (data.email) documentData.email = data.email;
        if (data.pronouns) documentData.pronouns = data.pronouns;
        if (data.education) documentData.education = data.education;
        if (data.languages) documentData.languages = data.languages;
        if (data.linkedin) documentData.linkedin = data.linkedin;
        if (data.github) documentData.github = data.github;
        if (data.profileImageId) documentData.profileImageId = data.profileImageId;
        if (data.resumeFileId) documentData.resumeFileId = data.resumeFileId;

        return await databases.createDocument(DATABASE_ID, PROFILE_COLLECTION_ID, ID.unique(), documentData);
    } catch (error) {
        console.error('Error creating profile data:', error);
        throw error;
    }
};

export const updateProfileData = async (profileId: string, data: Partial<ProfileData>) => {
    try {
        // Create a document with the correct structure based on your Appwrite collection schema
        const documentData: Record<string, unknown> = {};

        // Map your ProfileData fields to the Appwrite collection fields
        if (data.name !== undefined) documentData.name = data.name;
        if (data.email !== undefined) documentData.email = data.email;
        if (data.pronouns !== undefined) documentData.pronouns = data.pronouns;
        if (data.education !== undefined) documentData.education = data.education;
        if (data.languages !== undefined) documentData.languages = data.languages;
        if (data.linkedin !== undefined) documentData.linkedin = data.linkedin;
        if (data.github !== undefined) documentData.github = data.github;
        if (data.profileImageId !== undefined) documentData.profileImageId = data.profileImageId;
        if (data.resumeFileId !== undefined) documentData.resumeFileId = data.resumeFileId;

        return await databases.updateDocument(DATABASE_ID, PROFILE_COLLECTION_ID, profileId, documentData);
    } catch (error) {
        console.error('Error updating profile data:', error);
        throw error;
    }
};

// Database functions for projects
export const getProjects = async (): Promise<(Models.Document & ProjectData)[]> => {
    try {
        // Query with sorting by order field
        const data = await databases.listDocuments(DATABASE_ID, PROJECTS_COLLECTION_ID, [
            Query.orderAsc('order'), // Sort by order ascending
        ]);

        return data.documents as (Models.Document & ProjectData)[];
    } catch (error) {
        console.error('Error getting projects:', error);
        return [];
    }
};

export const getProject = async (projectId: string): Promise<Models.Document & ProjectData> => {
    try {
        return (await databases.getDocument(DATABASE_ID, PROJECTS_COLLECTION_ID, projectId)) as Models.Document &
            ProjectData;
    } catch (error) {
        console.error('Error getting project:', error);
        throw error;
    }
};

export const createProject = async (data: ProjectData) => {
    try {
        return await databases.createDocument(DATABASE_ID, PROJECTS_COLLECTION_ID, ID.unique(), data);
    } catch (error) {
        console.error('Error creating project:', error);
        throw error;
    }
};

export const updateProject = async (projectId: string, data: Partial<ProjectData>) => {
    try {
        return await databases.updateDocument(DATABASE_ID, PROJECTS_COLLECTION_ID, projectId, data);
    } catch (error) {
        console.error('Error updating project:', error);
        throw error;
    }
};

export const deleteProject = async (projectId: string) => {
    try {
        await databases.deleteDocument(DATABASE_ID, PROJECTS_COLLECTION_ID, projectId);
        return true;
    } catch (error) {
        console.error('Error deleting project:', error);
        throw error;
    }
};

// Database functions for blog posts
export const getBlogPosts = async (publishedOnly = false): Promise<(Models.Document & BlogPost)[]> => {
    try {
        const queries = [Query.orderDesc('publishedDate')];

        // If we only want published posts (for public view)
        if (publishedOnly) {
            queries.push(Query.equal('published', true));
        }

        const data = await databases.listDocuments(DATABASE_ID, BLOG_COLLECTION_ID, queries);
        return data.documents as (Models.Document & BlogPost)[];
    } catch (error) {
        console.error('Error getting blog posts:', error);
        return [];
    }
};

export const getBlogPost = async (postId: string): Promise<Models.Document & BlogPost> => {
    try {
        return (await databases.getDocument(DATABASE_ID, BLOG_COLLECTION_ID, postId)) as Models.Document & BlogPost;
    } catch (error) {
        console.error('Error getting blog post:', error);
        throw error;
    }
};

export const getBlogPostBySlug = async (slug: string): Promise<(Models.Document & BlogPost) | null> => {
    try {
        const data = await databases.listDocuments(DATABASE_ID, BLOG_COLLECTION_ID, [Query.equal('slug', slug)]);

        if (data.documents.length === 0) {
            return null;
        }

        return data.documents[0] as Models.Document & BlogPost;
    } catch (error) {
        console.error('Error getting blog post by slug:', error);
        return null;
    }
};

export const createBlogPost = async (data: BlogPost) => {
    try {
        // Create a document with the correct structure
        const documentData: Record<string, unknown> = {
            title: data.title,
            content: data.content,
            summary: data.summary,
            slug: data.slug,
            publishedDate: data.publishedDate,
            published: data.published || false,
            viewCount: data.viewCount || 0,
        };

        if (data.coverImageId) documentData.coverImageId = data.coverImageId;
        if (data.tags) documentData.tags = data.tags;

        return await databases.createDocument(DATABASE_ID, BLOG_COLLECTION_ID, ID.unique(), documentData);
    } catch (error) {
        console.error('Error creating blog post:', error);
        throw error;
    }
};

export const updateBlogPost = async (postId: string, data: Partial<BlogPost>) => {
    try {
        const documentData: Record<string, unknown> = {};

        if (data.title !== undefined) documentData.title = data.title;
        if (data.content !== undefined) documentData.content = data.content;
        if (data.summary !== undefined) documentData.summary = data.summary;
        if (data.slug !== undefined) documentData.slug = data.slug;
        if (data.publishedDate !== undefined) documentData.publishedDate = data.publishedDate;
        if (data.published !== undefined) documentData.published = data.published;
        if (data.coverImageId !== undefined) documentData.coverImageId = data.coverImageId;
        if (data.tags !== undefined) documentData.tags = data.tags;
        if (data.viewCount !== undefined) documentData.viewCount = data.viewCount;

        return await databases.updateDocument(DATABASE_ID, BLOG_COLLECTION_ID, postId, documentData);
    } catch (error) {
        console.error('Error updating blog post:', error);
        throw error;
    }
};

export const deleteBlogPost = async (postId: string) => {
    try {
        await databases.deleteDocument(DATABASE_ID, BLOG_COLLECTION_ID, postId);
        return true;
    } catch (error) {
        console.error('Error deleting blog post:', error);
        throw error;
    }
};

export const incrementBlogPostViewCount = async (postId: string) => {
    try {
        // First get the current post to get the current view count
        const post = await getBlogPost(postId);

        // Increment the view count or set to 1 if it doesn't exist
        const currentViewCount = post.viewCount || 0;
        const newViewCount = currentViewCount + 1;

        // Update the post with the new view count
        return await updateBlogPost(postId, { viewCount: newViewCount });
    } catch (error) {
        console.error('Error incrementing blog post view count:', error);
        // Don't throw error to avoid breaking the user experience
        // Just silently fail
        return null;
    }
};
