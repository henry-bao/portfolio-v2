import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, CircularProgress, Container, Divider, Paper, TextField, Typography } from '@mui/material';
import { getErrorMessage, getFieldErrors } from '../../api';
import { useIsAdmin, useSignIn } from '../../queries';
import { routes } from '../../app/routes';
import type { LoginRedirectState } from '../../app/RequireAdmin';
import { StatusAlerts } from '../../components/admin/StatusAlerts';

/** Only same-site paths are followed, so a crafted history state can't redirect elsewhere. */
const getRedirectTarget = (state: unknown) => {
    const from = (state as LoginRedirectState | null)?.from;
    return from && from.startsWith('/') && !from.startsWith('//') ? from : routes.admin.overview;
};

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const isAdmin = useIsAdmin();
    const signIn = useSignIn();

    // Covers both "already signed in" and "just signed in": the session query updates on success.
    if (isAdmin) {
        return <Navigate to={getRedirectTarget(location.state)} replace />;
    }

    const fieldErrors = getFieldErrors(signIn.error);
    const formError = signIn.error && !fieldErrors.email && !fieldErrors.password ? getErrorMessage(signIn.error) : '';

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        signIn.mutate({ email, password });
    };

    const clearErrorThen = (update: (value: string) => void) => (value: string) => {
        if (signIn.error) {
            signIn.reset();
        }
        update(value);
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100dvh',
                }}
            >
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Typography component="h1" variant="h5" align="center" gutterBottom>
                        Dashboard Login
                    </Typography>

                    <StatusAlerts error={formError} />

                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(event) => clearErrorThen(setEmail)(event.target.value)}
                            error={Boolean(fieldErrors.email)}
                            helperText={fieldErrors.email}
                            disabled={signIn.isPending}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => clearErrorThen(setPassword)(event.target.value)}
                            error={Boolean(fieldErrors.password)}
                            helperText={fieldErrors.password}
                            disabled={signIn.isPending}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={signIn.isPending}
                        >
                            {signIn.isPending ? <CircularProgress size={24} /> : 'Sign In'}
                        </Button>
                        <Divider />
                        <Button
                            type="button"
                            color="warning"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={signIn.isPending}
                            onClick={() => navigate(routes.home)}
                        >
                            Back to Home Page
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default LoginPage;
