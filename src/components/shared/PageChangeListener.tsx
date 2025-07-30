import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PageChangeListenerProps {
    onPageChange: () => void;
}

const PageChangeListener: React.FC<PageChangeListenerProps> = ({ onPageChange }) => {
    const location = useLocation();

    useEffect(() => {
        onPageChange();
    }, [location, onPageChange]);

    return null;
};

export default PageChangeListener;
