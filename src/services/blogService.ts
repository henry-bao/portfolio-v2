import { ID, Query } from 'appwrite';
import { COLLECTION_BLOG_ID, DATABASE_ID, databases } from '../config/appwrite';
import type { BlogPost, BlogPostDocument } from '../types';
import { compactUndefined } from '../utils/object';

export const getBlogPosts = async (publishedOnly = false): Promise<BlogPostDocument[]> => {
    try {
        const queries = [Query.orderDesc('publishedDate')];

        if (publishedOnly) {
            queries.push(Query.equal('published', true));
        }

        const data = await databases.listDocuments(DATABASE_ID, COLLECTION_BLOG_ID, queries);
        return data.documents as unknown as BlogPostDocument[];
    } catch (error) {
        console.error('Error getting blog posts:', error);
        return [];
    }
};

export const getBlogPost = async (postId: string): Promise<BlogPostDocument> => {
    try {
        return (await databases.getDocument(DATABASE_ID, COLLECTION_BLOG_ID, postId)) as unknown as BlogPostDocument;
    } catch (error) {
        console.error('Error getting blog post:', error);
        throw error;
    }
};

export const getBlogPostBySlug = async (slug: string): Promise<BlogPostDocument | null> => {
    try {
        const data = await databases.listDocuments(DATABASE_ID, COLLECTION_BLOG_ID, [Query.equal('slug', slug)]);
        return data.documents.length > 0 ? (data.documents[0] as unknown as BlogPostDocument) : null;
    } catch (error) {
        console.error('Error getting blog post by slug:', error);
        return null;
    }
};

export const createBlogPost = async (data: BlogPost) => {
    try {
        const documentData = compactUndefined({
            title: data.title,
            content: data.content,
            summary: data.summary,
            slug: data.slug,
            publishedDate: data.publishedDate,
            published: data.published || false,
            viewCount: data.viewCount || 0,
            coverImageId: data.coverImageId,
            tags: data.tags,
        });

        return await databases.createDocument(DATABASE_ID, COLLECTION_BLOG_ID, ID.unique(), documentData);
    } catch (error) {
        console.error('Error creating blog post:', error);
        throw error;
    }
};

export const updateBlogPost = async (postId: string, data: Partial<BlogPost>) => {
    try {
        const documentData = compactUndefined({
            title: data.title,
            content: data.content,
            summary: data.summary,
            slug: data.slug,
            publishedDate: data.publishedDate,
            published: data.published,
            coverImageId: data.coverImageId,
            tags: data.tags,
            viewCount: data.viewCount,
        });

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
        const post = await getBlogPost(postId);
        return await updateBlogPost(postId, { viewCount: (post.viewCount || 0) + 1 });
    } catch (error) {
        console.error('Error incrementing blog post view count:', error);
        return null;
    }
};
