import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    busyLabel?: string;
    isBusy?: boolean;
    fullWidth?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

/** Destructive-action confirmation used by the blog, project and resume managers. */
export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = 'Delete',
    busyLabel = 'Deleting...',
    isBusy = false,
    fullWidth = false,
    onCancel,
    onConfirm,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onClose={onCancel} fullWidth={fullWidth} maxWidth={fullWidth ? 'sm' : 'xs'}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText>{description}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} disabled={isBusy}>
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    color="error"
                    disabled={isBusy}
                    startIcon={isBusy ? <CircularProgress size={20} /> : null}
                >
                    {isBusy ? busyLabel : confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
