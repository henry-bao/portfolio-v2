import type { ChangeEvent } from 'react';
import type { Models } from 'appwrite';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Typography } from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { useObjectUrl } from '../../../hooks';
import { ImagePreview } from '../ImagePreview';

interface EditImageDialogProps {
    accept: string;
    imageToEdit: Models.File | null;
    newImageFile: File | null;
    open: boolean;
    getImageUrl: (fileId: string) => string;
    onClose: () => void;
    onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onUpdate: () => void;
}

export function EditImageDialog({
    accept,
    imageToEdit,
    newImageFile,
    open,
    getImageUrl,
    onClose,
    onFileChange,
    onUpdate,
}: EditImageDialogProps) {
    const newImagePreviewUrl = useObjectUrl(newImageFile);

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Edit Image</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 1 }}>
                    {imageToEdit && (
                        <Box sx={{ mb: 3, textAlign: 'center' }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Current Image
                            </Typography>
                            <ImagePreview
                                src={getImageUrl(imageToEdit.$id)}
                                alt={imageToEdit.name}
                                maxHeight={150}
                                centered
                            />
                            <Typography variant="caption">
                                {imageToEdit.name} ({Math.round(imageToEdit.sizeOriginal / 1024)} KB)
                            </Typography>
                        </Box>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" gutterBottom>
                        Replace with new image
                    </Typography>

                    {newImageFile ? (
                        <Box sx={{ textAlign: 'center' }}>
                            {newImagePreviewUrl && (
                                <ImagePreview
                                    src={newImagePreviewUrl}
                                    alt="New image preview"
                                    maxHeight={150}
                                    centered
                                />
                            )}
                            <Typography variant="body2">
                                {newImageFile.name} ({Math.round(newImageFile.size / 1024)} KB)
                            </Typography>
                        </Box>
                    ) : (
                        <Box>
                            <Button variant="outlined" component="label" startIcon={<UploadIcon />} fullWidth>
                                Select New Image
                                <input type="file" hidden accept={accept} onChange={onFileChange} />
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
                <Button onClick={onUpdate} disabled={!newImageFile} variant="contained">
                    Update Image
                </Button>
            </DialogActions>
        </Dialog>
    );
}
