import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Starts every new page at the top, like a full page load would. */
const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, [pathname]);

    return null;
};

export default ScrollToTop;
