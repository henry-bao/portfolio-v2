import { Alert } from '@mui/material';

interface StatusAlertsProps {
    error?: string;
    success?: string;
}

/** Error/success banner pair shared by every dashboard editor. */
export function StatusAlerts({ error, success }: StatusAlertsProps) {
    return (
        <>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}
        </>
    );
}
