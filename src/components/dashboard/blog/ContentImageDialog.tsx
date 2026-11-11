import type { ChangeEvent } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { useObjectUrl } from '../../../hooks';
import { ImagePreview } from '../ImagePreview';

interface ContentImageDialogProps {
    accept: string;
    image: File | null;
    isUploading: boolean;
    open: boolean;
    onClose: () => void;
    onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onInsert: () => void;
}

export function ContentImageDialog({
    accept,
    image,
    isUploading,
    open,
    onClose,
    onImageChange,
    onInsert,
}: ContentImageDialogProps) {
    const previewUrl = useObjectUrl(image);

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Insert Image</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 1 }}>
                    {image ? (
                        <Box sx={{ textAlign: 'center' }}>
                            {previewUrl && <ImagePreview src={previewUrl} alt="Preview" maxHeight={200} centered />}
                            <Typography variant="body2">
                                {image.name} ({Math.round(image.size / 1024)} KB)
                            </Typography>
                        </Box>
                    ) : (
                        <Box>
                            <Button variant="outlined" component="label" startIcon={<UploadIcon />} fullWidth>
                                Select Image
                                <input type="file" hidden accept={accept} onChange={onImageChange} />
                            </Button>
                            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                                Allowed formats: JPG, PNG, GIF, WebP, SVG
                            </Typography>
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onInsert} disabled={!image || isUploading} variant="contained">
                    {isUploading ? <CircularProgress size={24} /> : 'Insert Image'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
