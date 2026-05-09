import { useEffect, useState } from 'react';
import type { ImgHTMLAttributes } from 'react';

type ImageLoadState = 'loading' | 'loaded' | 'fallback';
const transparentPixel =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
const defaultFallbackDelayMs = 3000;

interface ImageWithFallbackProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    fallbackDelayMs?: number;
    src?: string | null;
    fallbackSrc: string;
}

export function ImageWithFallback({
    fallbackDelayMs = defaultFallbackDelayMs,
    fallbackSrc,
    onError,
    onLoad,
    src,
    style,
    ...props
}: ImageWithFallbackProps) {
    const [activeSrc, setActiveSrc] = useState<string | null>(src ? null : fallbackSrc);
    const [loadState, setLoadState] = useState<ImageLoadState>(src ? 'loading' : 'fallback');

    useEffect(() => {
        const preferredSrc = src?.trim();

        if (!preferredSrc) {
            setActiveSrc(fallbackSrc);
            setLoadState('fallback');
            return;
        }

        let isCurrentRequest = true;
        const image = new Image();

        setActiveSrc(null);
        setLoadState('loading');

        const fallbackTimer = window.setTimeout(() => {
            if (!isCurrentRequest) {
                return;
            }

            setActiveSrc(fallbackSrc);
            setLoadState('fallback');
        }, fallbackDelayMs);

        image.onload = () => {
            if (!isCurrentRequest) {
                return;
            }

            window.clearTimeout(fallbackTimer);
            setActiveSrc(preferredSrc);
            setLoadState('loaded');
        };

        image.onerror = () => {
            if (!isCurrentRequest) {
                return;
            }

            window.clearTimeout(fallbackTimer);
            setActiveSrc(fallbackSrc);
            setLoadState('fallback');
        };

        image.src = preferredSrc;

        return () => {
            isCurrentRequest = false;
            window.clearTimeout(fallbackTimer);
            image.onload = null;
            image.onerror = null;
        };
    }, [fallbackDelayMs, fallbackSrc, src]);

    const handleRenderedLoad: ImgHTMLAttributes<HTMLImageElement>['onLoad'] = (event) => {
        if (loadState !== 'loading') {
            onLoad?.(event);
        }
    };

    const handleRenderedError: ImgHTMLAttributes<HTMLImageElement>['onError'] = (event) => {
        if (activeSrc && activeSrc !== fallbackSrc) {
            setActiveSrc(fallbackSrc);
            setLoadState('fallback');
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
