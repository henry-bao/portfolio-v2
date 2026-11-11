import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../api';
import { queryKeys } from './keys';

/** `data` is `null` until a profile has been saved. */
export const useProfile = () => useQuery({ queryKey: queryKeys.profile, queryFn: profileApi.getProfile });

export function useSaveProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: profileApi.saveProfile,
        onSuccess: (profile) => queryClient.setQueryData(queryKeys.profile, profile),
    });
}
