import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { getErrorMessage } from '../api';
import { useCurrentUser, useIsAdmin } from '../queries';
import { routes } from './routes';

/** Where the login page sends the user back to after signing in. */
export interface LoginRedirectState {
    from?: string;
}

const centered = { display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center', alignItems: 'center', minHeight: '100dvh', p: 2 } as const;

/** Renders the admin routes only for signed-in admins; everyone else goes to the login page. */
const RequireAdmin = () => {
    const location = useLocation();
    const { isPending, isError, error, refetch } = useCurrentUser();
    const isAdmin = useIsAdmin();

    if (isPending) {
        return (
            <Box sx={centered}>
                <CircularProgress />
            </Box>
        );
    }

    // Couldn't even check the session (offline, Appwrite down): don't pretend the user is signed out.
    if (isError) {
        return (
            <Box sx={centered}>
                <Typography>{getErrorMessage(error)}</Typography>
                <Button variant="contained" onClick={() => void refetch()}>
                    Try again
                </Button>
            </Box>
        );
    }

    if (!isAdmin) {
        const state: LoginRedirectState = { from: `${location.pathname}${location.search}` };
        return <Navigate to={routes.admin.login} replace state={state} />;
    }

    return <Outlet />;
};

export default RequireAdmin;
