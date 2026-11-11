import type { ChangeEvent } from 'react';
import { Box, Button, Divider, Grid, Typography } from '@mui/material';
import { Delete as DeleteIcon, Upload as UploadIcon } from '@mui/icons-material';
import { ImagePreview } from '../ImagePreview';

interface CoverImageFieldProps {
    accept: string;
    coverImagePreview: string | null;
    onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
}

export function CoverImageField({ accept, coverImagePreview, onImageChange, onRemove }: CoverImageFieldProps) {
    return (
        <Grid size={12}>
            <Typography variant="h6" gutterBottom>
                Cover Image
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {coverImagePreview ? (
                <Box sx={{ mb: 2 }}>
                    <ImagePreview src={coverImagePreview} alt="Cover Preview" maxHeight={300} rounded />
                    <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={onRemove} size="small">
                        Remove Image
                    </Button>
                </Box>
            ) : (
                <Box>
                    <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
                        Upload Cover Image
                        <input type="file" hidden accept={accept} onChange={onImageChange} />
                    </Button>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                        Allowed formats: JPG, PNG, GIF, WebP, SVG
                    </Typography>
                </Box>
            )}
        </Grid>
    );
}
