import { useContext } from 'react';
import { NotifyContext } from './context';
import type { Notify } from './context';

/** Shows a toast at the bottom of the screen. */
export function useNotify(): Notify {
    const notify = useContext(NotifyContext);

    if (!notify) {
        throw new Error('useNotify must be used inside <NotificationsProvider>');
    }

    return notify;
}
