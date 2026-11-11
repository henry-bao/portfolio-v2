import { z } from 'zod';
import { getBackend } from './core/client';
import { ApiError, toApiError, withApiErrors } from './core/errors';
import { parseInput } from './core/fields';
import { ADMIN_LABEL } from './core/permissions';

const userSchema = z.object({
    $id: z.string(),
    name: z.string().default(''),
    email: z.string().default(''),
    labels: z.array(z.string()).default([]),
});

export type User = z.infer<typeof userSchema>;

/** Only users with the `admin` label can use the dashboard; every other account is treated as a guest. */
export const isAdmin = (user: User | null | undefined) => Boolean(user?.labels.includes(ADMIN_LABEL));

export const credentialsSchema = z.object({
    email: z.string().trim().min(1, 'Email is required').pipe(z.email('Enter a valid email address')),
    password: z.string().min(1, 'Password is required'),
});

export type Credentials = z.input<typeof credentialsSchema>;

/** The signed-in user, or `null` for guests. Network and config failures still throw. */
export const getCurrentUser = () =>
    withApiErrors('Load session', async (): Promise<User | null> => {
        try {
            return userSchema.parse(await getBackend().account.get());
        } catch (error) {
            if (toApiError(error).kind === 'unauthorized') {
                return null;
            }
            throw error;
        }
    });

/** Ends the current session. Already being signed out counts as success. */
export const signOut = () =>
    withApiErrors('Sign out', async () => {
        try {
            await getBackend().account.deleteSession({ sessionId: 'current' });
        } catch (error) {
            const { kind } = toApiError(error);

            if (kind !== 'unauthorized' && kind !== 'not_found') {
                throw error;
            }
        }
    });

const createSession = async ({ email, password }: z.output<typeof credentialsSchema>) => {
    const { account } = getBackend();

    try {
        await account.createEmailPasswordSession({ email, password });
    } catch (error) {
        const apiError = toApiError(error);

        // A leftover session (e.g. from another tab) blocks creating a new one; replace it once.
        if (apiError.type === 'user_session_already_exists') {
            await signOut();
            await account.createEmailPasswordSession({ email, password });
            return;
        }

        if (apiError.type === 'user_invalid_credentials' || apiError.type === 'user_blocked') {
            throw new ApiError('invalid_input', 'Wrong email or password.', { cause: error });
        }

        throw apiError;
    }
};

/** Signs in and returns the user. Accounts without the admin label are signed straight back out. */
export const signIn = (credentials: Credentials) =>
    withApiErrors('Sign in', async () => {
        await createSession(parseInput(credentialsSchema, credentials));
        const user = await getCurrentUser();

        if (!isAdmin(user)) {
            await signOut();
            throw new ApiError('invalid_input', "This account doesn't have access to the dashboard.");
        }

        return user as User;
    });
