import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { siteSettingsApi } from '../api';
import type { SiteSection, SiteSettings } from '../api';
import { queryKeys } from './keys';

/**
 * Which home-page sections to render.
 *
 * - While the settings load, sections are hidden, so a disabled one never flashes on screen.
 * - If they can't be loaded at all, every section is shown, so a backend outage still leaves a
 *   working page (each section has its own fallback).
 */
export function useSectionVisibility() {
    const { data, isPending } = useQuery({ queryKey: queryKeys.siteSettings, queryFn: siteSettingsApi.getSiteSettings });

    const isVisible = (section: SiteSection) => (data ? data[section] : !isPending);

    return { isVisible, isResolved: !isPending };
}

/** Raw settings for the dashboard toggles. */
export const useSiteSettings = () =>
    useQuery({ queryKey: queryKeys.siteSettings, queryFn: siteSettingsApi.getSiteSettings });

/** Applies the change immediately and rolls it back if saving fails. */
export function useUpdateSiteSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: siteSettingsApi.updateSiteSettings,
        onMutate: async (changes: Partial<SiteSettings>) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.siteSettings });
            const previous = queryClient.getQueryData<SiteSettings>(queryKeys.siteSettings);

            if (previous) {
                queryClient.setQueryData<SiteSettings>(queryKeys.siteSettings, { ...previous, ...changes });
            }

            return { previous };
        },
        onError: (_error, _changes, context) => {
            if (context?.previous) {
                queryClient.setQueryData(queryKeys.siteSettings, context.previous);
            }
        },
        onSuccess: (saved) => queryClient.setQueryData(queryKeys.siteSettings, saved),
    });
}
