import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api';
import type { Project } from '../api';
import { queryKeys } from './keys';

export const useProjects = () => useQuery({ queryKey: queryKeys.projects.list, queryFn: projectsApi.listProjects });

export const useProject = (projectId: string | undefined) =>
    useQuery({
        queryKey: queryKeys.projects.detail(projectId ?? ''),
        queryFn: () => projectsApi.getProject(projectId as string),
        enabled: Boolean(projectId),
    });

export function useSaveProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: projectsApi.saveProject,
        onSuccess: (project) => {
            queryClient.setQueryData(queryKeys.projects.detail(project.$id), project);
            void queryClient.invalidateQueries({ queryKey: queryKeys.projects.list });
        },
    });
}

export function useDeleteProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: projectsApi.deleteProject,
        onSuccess: (_result, project) => {
            queryClient.removeQueries({ queryKey: queryKeys.projects.detail(project.$id) });
            void queryClient.invalidateQueries({ queryKey: queryKeys.projects.list });
        },
    });
}

/** Shows the new order immediately; on failure, reloads to show what was actually saved. */
export function useReorderProjects() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: projectsApi.reorderProjects,
        onMutate: async (orderedProjects: Project[]) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.projects.list });
            queryClient.setQueryData(queryKeys.projects.list, orderedProjects);
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
    });
}
