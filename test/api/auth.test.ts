import { beforeEach, expect, test } from 'bun:test';
import { AppwriteException } from 'appwrite';
import { fakeAppwrite, resetFakeAppwrite } from '../fakeBackend';
import { getCurrentUser, signIn, signOut } from '../../src/api/auth';
import { getErrorMessage, isApiError } from '../../src/api/core/errors';

interface FakeAccountState {
    sessionUser: { $id: string; name: string; email: string; labels: string[] } | null;
    knownUsers: Record<string, { password: string; labels: string[] }>;
}

let state: FakeAccountState;

beforeEach(() => {
    resetFakeAppwrite();
    state = {
        sessionUser: null,
        knownUsers: {
            'admin@example.com': { password: 'right', labels: ['admin'] },
            'guest@example.com': { password: 'right', labels: [] },
        },
    };

    fakeAppwrite().backend.account = {
        get: async () => {
            if (!state.sessionUser) throw new AppwriteException('No session', 401, 'general_unauthorized_scope');
            return state.sessionUser;
        },
        createEmailPasswordSession: async ({ email, password }: { email: string; password: string }) => {
            if (state.sessionUser) throw new AppwriteException('Session active', 401, 'user_session_already_exists');
            const user = state.knownUsers[email];
            if (!user || user.password !== password) {
                throw new AppwriteException('Invalid credentials', 401, 'user_invalid_credentials');
            }
            state.sessionUser = { $id: email, name: email, email, labels: user.labels };
        },
        deleteSession: async () => {
            if (!state.sessionUser) throw new AppwriteException('No session', 401, 'general_unauthorized_scope');
            state.sessionUser = null;
        },
    };
});

test('guests are null, not an error', async () => {
    expect(await getCurrentUser()).toBeNull();
});

test('an admin signs in', async () => {
    const user = await signIn({ email: ' admin@example.com ', password: 'right' });
    expect(user.labels).toContain('admin');
});

test('wrong credentials get a clear message', async () => {
    const error = await signIn({ email: 'admin@example.com', password: 'wrong' }).catch((caught: unknown) => caught);
    expect(getErrorMessage(error)).toBe('Wrong email or password.');
});

test('accounts without the admin label are signed straight back out', async () => {
    const error = await signIn({ email: 'guest@example.com', password: 'right' }).catch((caught: unknown) => caught);

    expect(getErrorMessage(error)).toBe("This account doesn't have access to the dashboard.");
    expect(state.sessionUser).toBeNull();
});

test('a leftover session is replaced instead of blocking sign-in', async () => {
    state.sessionUser = { $id: 'x', name: 'x', email: 'guest@example.com', labels: [] };

    const user = await signIn({ email: 'admin@example.com', password: 'right' });

    expect(user.email).toBe('admin@example.com');
});

test('the form is validated before any request', async () => {
    const error = await signIn({ email: 'not-an-email', password: '' }).catch((caught: unknown) => caught);

    expect(isApiError(error, 'invalid_input')).toBe(true);
    expect(Object.keys((error as { fieldErrors: object }).fieldErrors).sort()).toEqual(['email', 'password']);
});

test('signing out twice is fine', async () => {
    await signIn({ email: 'admin@example.com', password: 'right' });
    await signOut();
    await signOut();

    expect(await getCurrentUser()).toBeNull();
});
