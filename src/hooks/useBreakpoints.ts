import { useMediaQuery, useTheme } from '@mui/material';

/** Width below which the dashboard sidebar and project cards switch to their compact layout. */
export const COMPACT_LAYOUT_WIDTH_PX = 992;

/**
 * Shared responsive flags for the dashboard screens, so every screen agrees on
 * what "mobile" and "tablet" mean.
 */
export function useBreakpoints() {
    const theme = useTheme();

    return {
        isMobile: useMediaQuery(theme.breakpoints.down('sm')),
        isTablet: useMediaQuery(theme.breakpoints.down('md')),
    };
}
