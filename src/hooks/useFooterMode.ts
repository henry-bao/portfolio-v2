import { useEffect, useState } from 'react';

/**
 * On wide screens the footer is pinned to the viewport while the hero is in view and
 * animates back into the page flow once the visitor scrolls. Narrow screens always get
 * a plain in-flow footer.
 */
type FooterMode = 'entering' | 'fixed' | 'exiting' | 'normal';

const MOBILE_FOOTER_QUERY = '(max-width: 768px)';
const HERO_SCROLL_THRESHOLD_PX = 1;

/** Must stay in sync with the footer enter/exit animations in Footer.css. */
const TRANSITION_DURATION_MS: Partial<Record<FooterMode, number>> = {
    entering: 280,
    exiting: 360,
};

/** Where each transitional mode settles once its animation has played. */
const SETTLED_MODE: Partial<Record<FooterMode, FooterMode>> = {
    entering: 'fixed',
    exiting: 'normal',
};

const isMobileViewport = () => window.matchMedia(MOBILE_FOOTER_QUERY).matches;

export function useFooterMode(isPageContentLoading: boolean): FooterMode {
    const [footerMode, setFooterMode] = useState<FooterMode>(() => (isMobileViewport() ? 'normal' : 'fixed'));

    useEffect(() => {
        // Hold the footer in place while the page is still resolving its sections.
        if (isPageContentLoading) {
            if (!isMobileViewport()) {
                setFooterMode('fixed');
            }

            return;
        }

        const mobileFooterMedia = window.matchMedia(MOBILE_FOOTER_QUERY);

        const syncFooterPlacement = () => {
            if (mobileFooterMedia.matches) {
                setFooterMode('normal');
                return;
            }

            const isAtHero = window.scrollY <= HERO_SCROLL_THRESHOLD_PX;

            setFooterMode((currentMode) => {
                if (isAtHero) {
                    return currentMode === 'fixed' || currentMode === 'entering' ? currentMode : 'entering';
                }

                return currentMode === 'fixed' ? 'exiting' : currentMode;
            });
        };

        syncFooterPlacement();
        window.addEventListener('scroll', syncFooterPlacement, { passive: true });
        mobileFooterMedia.addEventListener('change', syncFooterPlacement);

        return () => {
            window.removeEventListener('scroll', syncFooterPlacement);
            mobileFooterMedia.removeEventListener('change', syncFooterPlacement);
        };
    }, [isPageContentLoading]);

    // Let the enter/exit animation play, then settle into the resting mode.
    useEffect(() => {
        const settledMode = SETTLED_MODE[footerMode];

        if (!settledMode) {
            return;
        }

        const timer = window.setTimeout(() => setFooterMode(settledMode), TRANSITION_DURATION_MS[footerMode]);

        return () => window.clearTimeout(timer);
    }, [footerMode]);

    return footerMode;
}
