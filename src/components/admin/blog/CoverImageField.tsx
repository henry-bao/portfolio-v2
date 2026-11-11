import type { ChangeEvent } from 'react';
import { Box, Button, Divider, Grid, Typography } from '@mui/material';
import { Delete as DeleteIcon, Upload as UploadIcon } from '@mui/icons-material';
import { FILE_RULES, acceptAttribute } from '../../../api';
import { ImagePreview } from '../ImagePreview';

interface CoverImageFieldProps {
    previewUrl: string | null;
    onPick: (file: File) => void;
    onRemove: () => void;
}

export function CoverImageField({ previewUrl, onPick, onRemove }: CoverImageFieldProps) {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            onPick(file);
        }

        // Clear the input so picking the same file again after a removal still fires a change.
        event.target.value = '';
    };

    return (
        <Grid size={12}>
            <Typography variant="h6" gutterBottom>
                Cover Image
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {previewUrl && <ImagePreview src={previewUrl} alt="Cover preview" maxHeight={300} rounded />}

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button variant="outlined" component="label" startIcon={<UploadIcon />} size="small">
                    {previewUrl ? 'Replace Image' : 'Upload Cover Image'}
                    <input type="file" hidden accept={acceptAttribute('image')} onChange={handleChange} />
                </Button>
                {previewUrl && (
                    <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={onRemove} size="small">
                        Remove Image
                    </Button>
                )}
            </Box>
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                {FILE_RULES.image.description}. Applied when you save.
            </Typography>
        </Grid>
    );
}
