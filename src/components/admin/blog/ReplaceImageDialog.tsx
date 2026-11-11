import { useState } from 'react';
import type { ChangeEvent } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Typography,
} from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { FILE_RULES, acceptAttribute, fileUrl, validateFile } from '../../../api';
import type { StoredFile } from '../../../api';
import { useNotify } from '../../../app/notifications/useNotify';
import { useObjectUrl } from '../../../hooks';
import { useReplaceBlogImage } from '../../../queries';
import { ImagePreview } from '../ImagePreview';

interface ReplaceImageDialogProps {
    image: StoredFile;
    onClose: () => void;
}

/**
 * Swaps an image's contents but keeps its URL, so every post embedding it shows the new one.
 * Mount it only while open.
 */
export function ReplaceImageDialog({ image, onClose }: ReplaceImageDialogProps) {
    const notify = useNotify();
    const replace = useReplaceBlogImage();
    const [file, setFile] = useState<File | null>(null);
    const newPreviewUrl = useObjectUrl(file);
    const currentUrl = fileUrl(image.$id);

    const handlePick = (event: ChangeEvent<HTMLInputElement>) => {
        const picked = event.target.files?.[0];
        event.target.value = '';

        if (!picked) {
            return;
        }

        const invalid = validateFile(picked, 'image');

        if (invalid) {
            notify.error(invalid);
            return;
        }

        setFile(picked);
    };

    const handleReplace = () => {
        if (!file) {
            return;
        }

        replace.mutate(
            { fileId: image.$id, file },
            {
                onSuccess: () => {
                    notify.success('Image replaced. Browsers that cached the old version may show it for a while.');
                    onClose();
                },
                onError: notify.error,
            }
        );
    };

    return (
        <Dialog open onClose={replace.isPending ? undefined : onClose}>
            <DialogTitle>Replace Image</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 1, textAlign: 'center' }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Current Image
                    </Typography>
                    {currentUrl && <ImagePreview src={currentUrl} alt={image.name} maxHeight={150} centered />}
                    <Typography variant="caption">
                        {image.name} ({Math.round(image.sizeOriginal / 1024)} KB)
                    </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                    New image (keeps the same URL, so posts using it update too)
                </Typography>

                <Box sx={{ textAlign: 'center' }}>
                    {file && newPreviewUrl && <ImagePreview src={newPreviewUrl} alt="New image preview" maxHeight={150} centered />}
                    {file && (
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            {file.name} ({Math.round(file.size / 1024)} KB)
                        </Typography>
                    )}
                    <Button variant="outlined" component="label" startIcon={<UploadIcon />} fullWidth disabled={replace.isPending}>
                        {file ? 'Choose a Different Image' : 'Select New Image'}
                        <input type="file" hidden accept={acceptAttribute('image')} onChange={handlePick} />
                    </Button>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                        {FILE_RULES.image.description}
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={replace.isPending}>
                    Cancel
                </Button>
                <Button onClick={handleReplace} disabled={!file || replace.isPending} variant="contained">
                    {replace.isPending ? <CircularProgress size={24} /> : 'Replace Image'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
