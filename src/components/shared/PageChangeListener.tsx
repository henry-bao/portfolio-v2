import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PageChangeListenerProps {
    onPageChange: () => void;
}

const PageChangeListener: React.FC<PageChangeListenerProps> = ({ onPageChange }) => {
    const location = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        onPageChange();
    }, [location, onPageChange]);

    return null;
};

export default PageChangeListener;
