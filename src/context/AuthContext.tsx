import { createContext, useContext, useState, ReactNode } from 'react';
import type { Models } from 'appwrite';

interface AuthContextType {
    user: Models.User<Models.Preferences> | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    logout: () => Promise<void>;
    checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuthStatus = async () => {
        setIsLoading(true);
        try {
            const { getCurrentUser } = await import('../services/appwrite');
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        } catch (error) {
            console.error('Error checking auth status:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            const { logout } = await import('../services/appwrite');
            await logout();
            setUser(null);
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    // Avoid checking auth on initial app load to keep public bundle lean.

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        logout: handleLogout,
        checkAuthStatus,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
