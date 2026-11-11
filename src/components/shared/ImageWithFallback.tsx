import { useEffect, useState } from 'react';
import type { ImgHTMLAttributes } from 'react';

type ImageLoadState = 'loading' | 'loaded' | 'fallback';

const transparentPixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
const defaultFallbackDelayMs = 3000;

interface ImageWithFallbackProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    /** Show the fallback if `src` hasn't loaded after this long (it still swaps in if it loads later). */
    fallbackDelayMs?: number;
    src?: string | null;
    fallbackSrc: string;
}

/**
 * An `<img>` that preloads `src` and shows `fallbackSrc` when there is no source, when it fails, or
 * while it is too slow. Nothing is shown during the brief initial load, so a broken image never flashes.
 */
export function ImageWithFallback({
    fallbackDelayMs = defaultFallbackDelayMs,
    fallbackSrc,
    onError,
    onLoad,
    src,
    style,
    ...props
}: ImageWithFallbackProps) {
    const preferredSrc = src?.trim() || null;
    // The outcome is tagged with the source it belongs to, so a new `src` starts as "loading" without
    // having to reset any state.
    const [outcome, setOutcome] = useState<{ src: string; state: 'loaded' | 'fallback' } | null>(null);

    const loadState: ImageLoadState = !preferredSrc
        ? 'fallback'
        : outcome?.src === preferredSrc
          ? outcome.state
          : 'loading';

    useEffect(() => {
        if (!preferredSrc) {
            return;
        }

        let isCurrent = true;
        const image = new Image();
        const settle = (state: 'loaded' | 'fallback') => {
            if (isCurrent) {
                setOutcome({ src: preferredSrc, state });
            }
        };

        const fallbackTimer = window.setTimeout(() => settle('fallback'), fallbackDelayMs);

        image.onload = () => {
            window.clearTimeout(fallbackTimer);
            settle('loaded');
        };
        image.onerror = () => {
            window.clearTimeout(fallbackTimer);
            settle('fallback');
        };
        image.src = preferredSrc;

        return () => {
            isCurrent = false;
            window.clearTimeout(fallbackTimer);
            image.onload = null;
            image.onerror = null;
        };
    }, [fallbackDelayMs, preferredSrc]);

    const activeSrc = loadState === 'loaded' ? preferredSrc : loadState === 'fallback' ? fallbackSrc : null;

    const handleRenderedLoad: ImgHTMLAttributes<HTMLImageElement>['onLoad'] = (event) => {
        if (loadState !== 'loading') {
            onLoad?.(event);
        }
    };

    const handleRenderedError: ImgHTMLAttributes<HTMLImageElement>['onError'] = (event) => {
        if (preferredSrc && activeSrc === preferredSrc) {
            setOutcome({ src: preferredSrc, state: 'fallback' });
            return;
        }

        onError?.(event);
    };

    return (
        <img
            {...props}
            src={activeSrc || transparentPixel}
            data-load-state={loadState}
            onLoad={handleRenderedLoad}
            onError={handleRenderedError}
            style={{
                ...style,
                visibility: loadState === 'loading' ? 'hidden' : style?.visibility,
            }}
        />
    );
}
