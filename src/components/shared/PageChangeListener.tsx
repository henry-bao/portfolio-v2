import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PageChangeListenerProps {
    onPageChange: () => void;
}

/** Resets scroll position and refreshes route-level data on every navigation. */
const PageChangeListener = ({ onPageChange }: PageChangeListenerProps) => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        onPageChange();
    }, [onPageChange, pathname]);

    return null;
};

export default PageChangeListener;
