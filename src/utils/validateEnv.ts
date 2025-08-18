/**
 * Validates that all required environment variables are set
 * Throws an error if any required variables are missing
 */

interface RequiredEnvVars {
    VITE_APPWRITE_MAIN_PROJECT_ID: string;
    VITE_APPWRITE_DB_ID: string;
    VITE_APPWRITE_STORAGE_FILE_BUCKET_ID: string;
    VITE_APPWRITE_STORAGE_BLOGS_BUCKET_ID: string;
    VITE_APPWRITE_DB_PROFILE_COLLECTION_ID: string;
    VITE_APPWRITE_DB_PROJECTS_COLLECTION_ID: string;
    VITE_APPWRITE_DB_BLOG_COLLECTION_ID: string;
    VITE_APPWRITE_DB_SECTION_VISIBILITY_COLLECTION_ID: string;
    VITE_APPWRITE_DB_RESUME_COLLECTION_ID: string;
}

export function validateEnvironmentVariables(): void {
    const requiredVars: (keyof RequiredEnvVars)[] = [
        'VITE_APPWRITE_MAIN_PROJECT_ID',
        'VITE_APPWRITE_DB_ID',
        'VITE_APPWRITE_STORAGE_FILE_BUCKET_ID',
        'VITE_APPWRITE_STORAGE_BLOGS_BUCKET_ID',
        'VITE_APPWRITE_DB_PROFILE_COLLECTION_ID',
        'VITE_APPWRITE_DB_PROJECTS_COLLECTION_ID',
        'VITE_APPWRITE_DB_BLOG_COLLECTION_ID',
        'VITE_APPWRITE_DB_SECTION_VISIBILITY_COLLECTION_ID',
        'VITE_APPWRITE_DB_RESUME_COLLECTION_ID',
    ];

    const missingVars: string[] = [];

    for (const varName of requiredVars) {
        if (!import.meta.env[varName]) {
            missingVars.push(varName);
        }
    }

    if (missingVars.length > 0) {
        const errorMessage = `Missing required environment variables:\n${missingVars.join('\n')}\n\nPlease ensure all required environment variables are set in your .env file.`;
        
        // In development, log a warning but don't crash the app
        if (import.meta.env.DEV) {
            console.warn(errorMessage);
        } else {
            // In production, throw an error to prevent the app from running with missing config
            throw new Error(errorMessage);
        }
    }
}

/**
 * Get an environment variable with a fallback value
 * @param key The environment variable key
 * @param fallback The fallback value if the variable is not set
 * @returns The environment variable value or the fallback
 */
export function getEnvVar(key: string, fallback?: string): string {
    const value = import.meta.env[key];
    
    if (!value && !fallback) {
        throw new Error(`Environment variable ${key} is not set and no fallback was provided`);
    }
    
    return value || fallback || '';
}