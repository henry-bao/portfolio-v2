import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = () => {
    const { isAuthenticated, isLoading, checkAuthStatus } = useAuth();

    useEffect(() => {
        checkAuthStatus();
    }, []);

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100dvh">
                <CircularProgress />
            </Box>
        );
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

export default ProtectedRoute;
