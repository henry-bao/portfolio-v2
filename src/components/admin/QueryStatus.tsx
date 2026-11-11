import type { ReactNode } from 'react';
import { Alert, Box, Button, CircularProgress } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { getErrorMessage, isApiError } from '../../api';

/** Centered spinner for a dashboard screen that is still loading. */
export function PageSpinner() {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
        </Box>
    );
}

interface LoadErrorAlertProps {
    error: unknown;
    onRetry: () => void;
    /** Shown instead of the generic message when the item doesn't exist. */
    notFoundMessage?: string;
    /** Rendered next to Retry, e.g. a "Back to list" button. */
    action?: ReactNode;
}

/** Explains why a dashboard screen couldn't load, with a Retry button. */
export function LoadErrorAlert({ error, onRetry, notFoundMessage, action }: LoadErrorAlertProps) {
    const isNotFound = isApiError(error, 'not_found');

    return (
        <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {action}
                    {!isNotFound && (
                        <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={onRetry}>
                            Retry
                        </Button>
                    )}
                </Box>
            }
        >
            {isNotFound && notFoundMessage ? notFoundMessage : getErrorMessage(error)}
        </Alert>
    );
}
