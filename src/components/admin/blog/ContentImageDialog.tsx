import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { FILE_RULES, acceptAttribute, fileUrl, validateFile } from '../../../api';
import { useNotify } from '../../../app/notifications/useNotify';
import { useObjectUrl } from '../../../hooks';
import { useUploadBlogImage } from '../../../queries';
import { ImagePreview } from '../ImagePreview';
import { imageMarkdown } from './blogForm';

interface ContentImageDialogProps {
    onClose: () => void;
    /** Receives the Markdown for the uploaded image. */
    onInsert: (markdown: string) => void;
}

/** Uploads one image to the media library and inserts it into the post. Mount it only while open. */
export function ContentImageDialog({ onClose, onInsert }: ContentImageDialogProps) {
    const notify = useNotify();
    const upload = useUploadBlogImage();
    const [file, setFile] = useState<File | null>(null);
    const previewUrl = useObjectUrl(file);

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

    const handleInsert = () => {
        if (!file) {
            return;
        }

        upload.mutate(file, {
            onSuccess: (stored) => {
                const url = fileUrl(stored.$id);

                if (url) {
                    onInsert(imageMarkdown(file.name, url));
                }

                notify.success('Image uploaded');
                onClose();
            },
            onError: notify.error,
        });
    };

    return (
        <Dialog open onClose={upload.isPending ? undefined : onClose}>
            <DialogTitle>Insert Image</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 1, textAlign: 'center' }}>
                    {file && previewUrl && <ImagePreview src={previewUrl} alt="Preview" maxHeight={200} centered />}
                    {file && (
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            {file.name} ({Math.round(file.size / 1024)} KB)
                        </Typography>
                    )}
                    <Button variant="outlined" component="label" startIcon={<UploadIcon />} fullWidth disabled={upload.isPending}>
                        {file ? 'Choose a Different Image' : 'Select Image'}
                        <input type="file" hidden accept={acceptAttribute('image')} onChange={handlePick} />
                    </Button>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                        {FILE_RULES.image.description}
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={upload.isPending}>
                    Cancel
                </Button>
                <Button onClick={handleInsert} disabled={!file || upload.isPending} variant="contained">
                    {upload.isPending ? <CircularProgress size={24} /> : 'Insert Image'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
