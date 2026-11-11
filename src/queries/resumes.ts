import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { resumesApi } from '../api';
import { queryKeys } from './keys';

export const useResumes = () => useQuery({ queryKey: queryKeys.resumes.list, queryFn: resumesApi.listResumes });

export const useActiveResume = () =>
    useQuery({ queryKey: queryKeys.resumes.active, queryFn: resumesApi.getActiveResume });

/** Every resume write can change which version is active, so all resume queries are refreshed. */
function useResumeMutation<Variables, Result>(mutationFn: (variables: Variables) => Promise<Result>) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn,
        onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.resumes.all }),
    });
}

export const useUploadResume = () => useResumeMutation(resumesApi.uploadResume);
export const useSetActiveResume = () => useResumeMutation(resumesApi.setActiveResume);
export const useDeleteResume = () => useResumeMutation(resumesApi.deleteResume);
export const useUpdateResumeDetails = () =>
    useResumeMutation(({ rowId, values }: { rowId: string; values: resumesApi.ResumeDetailsInput }) =>
        resumesApi.updateResumeDetails(rowId, values)
    );
