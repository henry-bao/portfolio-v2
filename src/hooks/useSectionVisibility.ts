import { useCallback, useEffect, useState } from 'react';
import { getSectionVisibility, sendPing } from '../services/appwrite';
import type { SectionVisibilityDocument, SectionVisibilityStatus } from '../types';

export function useSectionVisibility() {
    const [sectionVisibility, setSectionVisibility] = useState<SectionVisibilityDocument | null>(null);
    const [sectionVisibilityStatus, setSectionVisibilityStatus] = useState<SectionVisibilityStatus>('loading');

    const refreshSectionVisibility = useCallback(async () => {
        try {
            const visibility = await getSectionVisibility();

            if (visibility) {
                setSectionVisibility(visibility);
                setSectionVisibilityStatus('ready');
                return;
            }

            setSectionVisibilityStatus((currentStatus) => (currentStatus === 'ready' ? currentStatus : 'fallback'));
        } catch (error) {
            console.error('Error fetching section visibility:', error);
            setSectionVisibilityStatus((currentStatus) => (currentStatus === 'ready' ? currentStatus : 'fallback'));
        }
    }, []);

    useEffect(() => {
        const checkConnectivity = async () => {
            try {
                await sendPing();
            } catch (error) {
                console.error('Error connecting to Appwrite:', error);
            }
        };

        checkConnectivity();
        refreshSectionVisibility();
    }, [refreshSectionVisibility]);

    return {
        sectionVisibility,
        sectionVisibilityStatus,
        refreshSectionVisibility,
    };
}
