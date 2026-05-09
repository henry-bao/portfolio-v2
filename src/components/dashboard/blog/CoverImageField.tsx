import type { ChangeEvent } from 'react';
import { Box, Button, Divider, Grid, Typography } from '@mui/material';
import { Delete as DeleteIcon, Upload as UploadIcon } from '@mui/icons-material';

interface CoverImageFieldProps {
    accept: string;
    coverImagePreview: string | null;
    onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
}

export function CoverImageField({ accept, coverImagePreview, onImageChange, onRemove }: CoverImageFieldProps) {
    return (
        <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
                Cover Image
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {coverImagePreview ? (
                <Box mb={2}>
                    <img
                        src={coverImagePreview}
                        alt="Cover Preview"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '300px',
                            display: 'block',
                            marginBottom: '10px',
                            borderRadius: '4px',
                        }}
                    />
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
                    <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                        Allowed formats: JPG, PNG, GIF, WebP, SVG
                    </Typography>
                </Box>
            )}
        </Grid>
    );
}
