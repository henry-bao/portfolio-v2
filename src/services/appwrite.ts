import { Client, Account, Storage, Databases, ID, Query, Models } from 'appwrite';

const client = new Client();

const PROJECT_ID = import.meta.env.VITE_APPWRITE_MAIN_PROJECT_ID as string | undefined;
const ENDPOINT = (import.meta.env.VITE_APPWRITE_MAIN_ENDPOINT as string | undefined) || 'https://cloud.appwrite.io/v1';
client.setEndpoint(ENDPOINT);
if (PROJECT_ID) {
    client.setProject(PROJECT_ID);
} else {
    console.warn('VITE_APPWRITE_MAIN_PROJECT_ID is not set. Appwrite client will not be fully initialized.');
}

// Initialize Appwrite services
export const account = new Account(client);
export const storage = new Storage(client);
export const databases = new Databases(client);

// Appwrite IDs
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DB_ID;

export const STORAGE_FILE_BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_FILE_BUCKET_ID;
export const STORAGE_BLOGS_BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BLOGS_BUCKET_ID;

export const COLLECTION_PROFILE_ID = import.meta.env.VITE_APPWRITE_DB_PROFILE_COLLECTION_ID;
export const COLLECTION_PROJECTS_ID = import.meta.env.VITE_APPWRITE_DB_PROJECTS_COLLECTION_ID;
export const COLLECTION_BLOG_ID = import.meta.env.VITE_APPWRITE_DB_BLOG_COLLECTION_ID;
export const COLLECTION_SECTION_VISIBILITY_ID = import.meta.env.VITE_APPWRITE_DB_SECTION_VISIBILITY_COLLECTION_ID;
export const COLLECTION_RESUME_ID = import.meta.env.VITE_APPWRITE_DB_RESUME_COLLECTION_ID;

// Allowed file type configurations
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
export const ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

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

export interface SectionVisibility {
    about: boolean;
    projects: boolean;
    blogs: boolean;
    resumes: boolean;
}

export const sendPing = async () => {
    try {
        const response = await fetch(`${ENDPOINT}/health`);
        if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
    } catch (error) {
        console.error('Error pinging Appwrite:', error);
        throw error;
    }
};

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
        const user = await account.get();
        return user;
    } catch {
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

// File validation functions
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type);
};

// File storage functions
export const uploadFile = async (file: File, options?: { allowedTypes?: string[] }) => {
    try {
        // Default to image types if not specified
        const allowedTypes = options?.allowedTypes || ALLOWED_IMAGE_TYPES;

        // Validate file type
        if (!validateFileType(file, allowedTypes)) {
            throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
        }

        const result = await storage.createFile(STORAGE_FILE_BUCKET_ID, ID.unique(), file);
        return result;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

export const getFilePreview = (fileId: string): string => {
    return storage.getFilePreview(STORAGE_FILE_BUCKET_ID, fileId).toString();
};

export const deleteFile = async (fileId: string, bucketId = STORAGE_FILE_BUCKET_ID) => {
    try {
        await storage.deleteFile(bucketId, fileId);
        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
};

// Database functions for profile data
export const getProfileData = async (): Promise<(Models.Document & ProfileData) | null> => {
    try {
        const data = await databases.listDocuments(DATABASE_ID, COLLECTION_PROFILE_ID, [Query.limit(1)]);

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

        return await databases.createDocument(DATABASE_ID, COLLECTION_PROFILE_ID, ID.unique(), documentData);
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

        return await databases.updateDocument(DATABASE_ID, COLLECTION_PROFILE_ID, profileId, documentData);
    } catch (error) {
        console.error('Error updating profile data:', error);
        throw error;
    }
};

// Database functions for projects
export const getProjects = async (): Promise<(Models.Document & ProjectData)[]> => {
    try {
        // Query with sorting by order field
        const data = await databases.listDocuments(DATABASE_ID, COLLECTION_PROJECTS_ID, [
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
        return (await databases.getDocument(DATABASE_ID, COLLECTION_PROJECTS_ID, projectId)) as Models.Document &
            ProjectData;
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

// Database functions for blog posts
export const getBlogPosts = async (publishedOnly = false): Promise<(Models.Document & BlogPost)[]> => {
    try {
        const queries = [Query.orderDesc('publishedDate')];

        // If we only want published posts (for public view)
        if (publishedOnly) {
            queries.push(Query.equal('published', true));
        }

        const data = await databases.listDocuments(DATABASE_ID, COLLECTION_BLOG_ID, queries);
        return data.documents as (Models.Document & BlogPost)[];
    } catch (error) {
        console.error('Error getting blog posts:', error);
        return [];
    }
};

export const getBlogPost = async (postId: string): Promise<Models.Document & BlogPost> => {
    try {
        return (await databases.getDocument(DATABASE_ID, COLLECTION_BLOG_ID, postId)) as Models.Document & BlogPost;
    } catch (error) {
        console.error('Error getting blog post:', error);
        throw error;
    }
};

export const getBlogPostBySlug = async (slug: string): Promise<(Models.Document & BlogPost) | null> => {
    try {
        const data = await databases.listDocuments(DATABASE_ID, COLLECTION_BLOG_ID, [Query.equal('slug', slug)]);

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

        return await databases.createDocument(DATABASE_ID, COLLECTION_BLOG_ID, ID.unique(), documentData);
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

        return await databases.updateDocument(DATABASE_ID, COLLECTION_BLOG_ID, postId, documentData);
    } catch (error) {
        console.error('Error updating blog post:', error);
        throw error;
    }
};

export const deleteBlogPost = async (postId: string) => {
    try {
        await databases.deleteDocument(DATABASE_ID, COLLECTION_BLOG_ID, postId);
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

// Functions for managing content images
export const getContentImages = async (limit = 50): Promise<Models.File[]> => {
    try {
        const images = await storage.listFiles(STORAGE_BLOGS_BUCKET_ID, [
            Query.limit(limit),
            Query.orderDesc('$createdAt'),
        ]);
        return images.files;
    } catch (error) {
        console.error('Error getting content images:', error);
        return [];
    }
};

export const updateContentImage = async (fileId: string, file: File): Promise<Models.File> => {
    try {
        // Validate file type
        if (!validateFileType(file, ALLOWED_IMAGE_TYPES)) {
            throw new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
        }

        // Delete the old file
        await storage.deleteFile(STORAGE_BLOGS_BUCKET_ID, fileId);

        // Upload the new file with the same ID
        const result = await storage.createFile(STORAGE_BLOGS_BUCKET_ID, fileId, file);
        return result;
    } catch (error) {
        console.error('Error updating content image:', error);
        throw error;
    }
};

// Function to upload an image for blog content and return a markdown-ready URL
export const uploadContentImage = async (file: File): Promise<{ fileId: string; url: string }> => {
    try {
        // Validate file type
        if (!validateFileType(file, ALLOWED_IMAGE_TYPES)) {
            throw new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
        }

        const result = await storage.createFile(STORAGE_BLOGS_BUCKET_ID, ID.unique(), file);
        const fileId = result.$id;
        const url = storage.getFileView(STORAGE_BLOGS_BUCKET_ID, fileId).toString();
        return { fileId, url };
    } catch (error) {
        console.error('Error uploading content image:', error);
        throw error;
    }
};

// Utility function to get content image preview URL
export const getContentImagePreviewUrl = (fileId: string): string => {
    return storage.getFileView(STORAGE_BLOGS_BUCKET_ID, fileId).toString();
};

export const getSectionVisibility = async (): Promise<(Models.Document & SectionVisibility) | null> => {
    try {
        const data = await databases.listDocuments(DATABASE_ID, COLLECTION_SECTION_VISIBILITY_ID, [Query.limit(1)]);

        if (data.documents.length === 0) {
            // Create initial document with all sections enabled
            const initialVisibility = {
                about: true,
                projects: true,
                blogs: true,
                resumes: true,
            };
            const newDoc = await createSectionVisibility(initialVisibility);
            return newDoc as Models.Document & SectionVisibility;
        }

        return data.documents[0] as Models.Document & SectionVisibility;
    } catch (error) {
        console.error('Error getting section visibility:', error);
        return null;
    }
};

export const createSectionVisibility = async (data: SectionVisibility) => {
    try {
        const documentData: Record<string, unknown> = {
            about: data.about,
            projects: data.projects,
            blogs: data.blogs,
            resumes: data.resumes,
        };

        return await databases.createDocument(DATABASE_ID, COLLECTION_SECTION_VISIBILITY_ID, ID.unique(), documentData);
    } catch (error) {
        console.error('Error creating section visibility:', error);
        throw error;
    }
};

export const updateSectionVisibility = async (visibilityId: string, data: Partial<SectionVisibility>) => {
    try {
        const documentData: Record<string, unknown> = {};

        if (data.about !== undefined) documentData.about = data.about;
        if (data.projects !== undefined) documentData.projects = data.projects;
        if (data.blogs !== undefined) documentData.blogs = data.blogs;
        if (data.resumes !== undefined) documentData.resumes = data.resumes;

        return await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_SECTION_VISIBILITY_ID,
            visibilityId,
            documentData
        );
    } catch (error) {
        console.error('Error updating section visibility:', error);
        throw error;
    }
};
