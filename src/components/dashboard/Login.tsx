import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, CircularProgress, Container, Divider, Paper, TextField, Typography } from '@mui/material';
import { login } from '../../services/authService';
import { useAuth } from '../../context/useAuth';
import { routes } from '../../routes/paths';
import { StatusAlerts } from '../shared';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated, checkAuthStatus } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            // `replace` keeps the login screen out of the history stack.
            navigate(routes.admin.overview, { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            await checkAuthStatus();
            navigate(routes.admin.overview, { replace: true });
        } catch (err) {
            console.error('Login error:', err);
            setError(`Login failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100dvh',
                }}
            >
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Typography component="h1" variant="h5" align="center" gutterBottom>
                        Dashboard Login
                    </Typography>

                    <StatusAlerts error={error} />

                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            disabled={isLoading}
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
                            onChange={(event) => setPassword(event.target.value)}
                            disabled={isLoading}
                        />
                        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={isLoading}>
                            {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
                        </Button>
                        <Divider />
                        <Button
                            type="button"
                            color="warning"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={isLoading}
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

export default Login;
