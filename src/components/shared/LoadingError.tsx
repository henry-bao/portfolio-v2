import { Alert, Box, Button, CircularProgress } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import type { ReactNode } from 'react';
import { getErrorMessage } from '../../api';

interface LoadingErrorProps {
    loading: boolean;
    /** Anything thrown; shown with a user-safe message. */
    error: unknown;
    onRetry?: () => void;
    children: ReactNode;
}

/** Swaps children for a spinner while loading, or a retryable error banner on failure. */
export function LoadingError({ loading, error, onRetry, children }: LoadingErrorProps) {
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    action={
                        onRetry && (
                            <Button color="inherit" size="small" onClick={onRetry} startIcon={<Refresh />}>
                                Retry
                            </Button>
                        )
                    }
                >
                    {getErrorMessage(error)}
                </Alert>
            </Box>
        );
    }

    return <>{children}</>;
}
