import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { isApiError } from '../api';
import { isRetryable } from '../api/core/errors';
import { queryKeys } from './keys';

/** How long fetched data counts as fresh before a remount or window focus refetches it. */
const STALE_TIME_MS = 60_000;
const MAX_RETRIES = 2;

export function createQueryClient() {
    // A 401 anywhere means the session ended (expired, or signed out in another tab). Re-check it, so
    // the dashboard guard sends the user to the login page instead of showing a wall of errors.
    const recheckSessionOnUnauthorized = (error: unknown) => {
        if (isApiError(error, 'unauthorized')) {
            void queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
        }
    };

    const queryClient: QueryClient = new QueryClient({
        queryCache: new QueryCache({ onError: recheckSessionOnUnauthorized }),
        mutationCache: new MutationCache({ onError: recheckSessionOnUnauthorized }),
        defaultOptions: {
            queries: {
                staleTime: STALE_TIME_MS,
                // Only failures that might go away on their own (network, 5xx, rate limits) are retried;
                // a 404 or a validation error won't change by asking again.
                retry: (failureCount, error) => failureCount < MAX_RETRIES && isRetryable(error),
            },
            mutations: {
                retry: false,
            },
        },
    });

    return queryClient;
}
