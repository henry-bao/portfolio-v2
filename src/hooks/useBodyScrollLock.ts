import { useEffect } from 'react';

const SCROLL_LOCKED_CLASS = 'scroll-locked';

export function useBodyScrollLock(locked: boolean) {
    useEffect(() => {
        if (!locked) {
            return;
        }

        document.body.classList.add(SCROLL_LOCKED_CLASS);

        return () => {
            document.body.classList.remove(SCROLL_LOCKED_CLASS);
        };
    }, [locked]);
}
