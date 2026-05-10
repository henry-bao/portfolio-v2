import { useEffect, useState } from 'react';

export function useStickyHeader(offset = 20) {
    const [isSticky, setIsSticky] = useState(false);

    useEffect(() => {
        let animationFrame = 0;

        const syncStickyState = () => {
            animationFrame = 0;
            const nextSticky = window.scrollY > offset;
            setIsSticky((currentSticky) => (currentSticky === nextSticky ? currentSticky : nextSticky));
        };

        const handleScroll = () => {
            if (!animationFrame) {
                animationFrame = window.requestAnimationFrame(syncStickyState);
            }
        };

        syncStickyState();
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);

            if (animationFrame) {
                window.cancelAnimationFrame(animationFrame);
            }
        };
    }, [offset]);

    return isSticky;
}
