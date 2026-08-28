import { useCallback, useState } from 'react';
import { useObjectUrl } from './useObjectUrl';

/**
 * Tracks an image that is either already stored remotely or newly picked from disk,
 * and exposes whichever one should currently be previewed.
 */
export function useImagePreview() {
    const [file, setFile] = useState<File | null>(null);
    const [remoteUrl, setRemoteUrl] = useState<string | null>(null);
    const objectUrl = useObjectUrl(file);

    const clear = useCallback(() => {
        setFile(null);
        setRemoteUrl(null);
    }, []);

    return { file, setFile, remoteUrl, setRemoteUrl, previewUrl: objectUrl ?? remoteUrl, clear };
}
