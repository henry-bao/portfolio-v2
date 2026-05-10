import type { SectionVisibility, SectionVisibilityDocument, SectionVisibilityStatus } from '../types';

export function isSectionVisible(
    sectionVisibility: SectionVisibilityDocument | null,
    sectionVisibilityStatus: SectionVisibilityStatus,
    section: keyof SectionVisibility
) {
    if (sectionVisibilityStatus === 'loading') {
        return false;
    }

    return sectionVisibility ? Boolean(sectionVisibility[section]) : sectionVisibilityStatus === 'fallback';
}
