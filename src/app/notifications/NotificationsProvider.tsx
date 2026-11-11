import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { getErrorMessage } from '../../api';
import { NotifyContext } from './context';
import type { Notify } from './context';

type Severity = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    severity: Severity;
}

const AUTO_HIDE_MS: Record<Severity, number> = { success: 4000, info: 5000, error: 8000 };

/** One toast at a time; a new one replaces whatever is showing. */
export function NotificationsProvider({ children }: { children: ReactNode }) {
    const [toast, setToast] = useState<Toast | null>(null);
    const [open, setOpen] = useState(false);

    const show = useCallback((message: string, severity: Severity) => {
        setToast({ id: Date.now(), message, severity });
        setOpen(true);
    }, []);

    const notify = useMemo<Notify>(
        () => ({
            success: (message) => show(message, 'success'),
            info: (message) => show(message, 'info'),
            error: (error) => {
                if (typeof error === 'string') {
                    show(error, 'error');
                    return;
                }

                console.error(error);
                show(getErrorMessage(error), 'error');
            },
        }),
        [show]
    );

    const close = (_event?: unknown, reason?: string) => {
        if (reason !== 'clickaway') {
            setOpen(false);
        }
    };

    return (
        <NotifyContext.Provider value={notify}>
            {children}
            <Snackbar
                key={toast?.id}
                open={open}
                autoHideDuration={toast ? AUTO_HIDE_MS[toast.severity] : null}
                onClose={close}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={toast?.severity ?? 'info'} onClose={close} variant="filled" sx={{ width: '100%' }}>
                    {toast?.message}
                </Alert>
            </Snackbar>
        </NotifyContext.Provider>
    );
}
