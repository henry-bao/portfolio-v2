import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api';
import { queryKeys } from './keys';

const SESSION_STALE_TIME_MS = 5 * 60_000;

/** `data` is the signed-in user, or `null` for guests. */
export const useCurrentUser = () =>
    useQuery({
        queryKey: queryKeys.currentUser,
        queryFn: authApi.getCurrentUser,
        staleTime: SESSION_STALE_TIME_MS,
    });

export const useIsAdmin = () => authApi.isAdmin(useCurrentUser().data);

export function useSignIn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authApi.signIn,
        onSuccess: (user) => queryClient.setQueryData(queryKeys.currentUser, user),
    });
}

export function useSignOut() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authApi.signOut,
        onSettled: () => {
            // Drop everything that was fetched with admin rights (drafts, unpublished posts, all resumes).
            queryClient.clear();
            queryClient.setQueryData(queryKeys.currentUser, null);
        },
    });
}
