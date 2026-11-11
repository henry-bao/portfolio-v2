import { useEffect, useState } from 'react';

/** A temporary `blob:` URL for previewing a picked file, revoked when the file changes or on unmount. */
export function useObjectUrl(file: File | null) {
    const [url, setUrl] = useState<string | null>(null);

    // The URL has to be created inside the effect, next to the cleanup that revokes it: creating it
    // during render would leak one per discarded render and break under StrictMode's double effects.
    useEffect(() => {
        if (!file) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors the external blob URL's lifetime
            setUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [file]);

    return url;
}
