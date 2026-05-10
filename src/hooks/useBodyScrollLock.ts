import { useEffect } from 'react';

export function useBodyScrollLock(locked: boolean) {
    useEffect(() => {
        document.body.classList.toggle('disableScroll', locked);

        return () => {
            document.body.classList.remove('disableScroll');
        };
    }, [locked]);
}
