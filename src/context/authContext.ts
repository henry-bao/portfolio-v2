import { createContext } from 'react';
import type { Models } from 'appwrite';

export interface AuthContextValue {
    user: Models.User<Models.Preferences> | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    logout: () => Promise<void>;
    checkAuthStatus: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
