import { createContext } from 'react';

export interface Notify {
    success: (message: string) => void;
    /** Shows a string as-is; any thrown value is turned into a user-safe message. */
    error: (error: unknown) => void;
    info: (message: string) => void;
}

export const NotifyContext = createContext<Notify | null>(null);
