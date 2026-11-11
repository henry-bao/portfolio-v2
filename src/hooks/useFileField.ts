import { useState } from 'react';
import { KEEP_FILE } from '../api';
import type { FileChange } from '../api';
import { useObjectUrl } from './useObjectUrl';

/**
 * State for an image field in an editor (profile photo, project logo, blog cover).
 *
 * Tracks what the user wants to happen to the stored file as a `FileChange`, which the save
 * functions in src/api take as-is, and exposes the URL to preview right now.
 *
 * @param storedUrl URL of the file currently saved on the row, if any.
 * @param initialChange Starting state, e.g. `{ type: 'remove' }` when restoring a draft that removed it.
 */
export function useFileField(storedUrl: string | null, initialChange: FileChange = KEEP_FILE) {
    const [change, setChange] = useState<FileChange>(initialChange);
    const pickedUrl = useObjectUrl(change.type === 'replace' ? change.file : null);

    const previewUrl = change.type === 'keep' ? storedUrl : change.type === 'replace' ? pickedUrl : null;

    return {
        change,
        previewUrl,
        isChanged: change.type !== 'keep',
        pick: (file: File) => setChange({ type: 'replace', file }),
        remove: () => setChange({ type: 'remove' }),
        /** Back to "keep whatever is saved", e.g. after a successful save or a discard. */
        reset: () => setChange(KEEP_FILE),
    };
}
