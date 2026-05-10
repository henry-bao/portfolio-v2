import type { MouseEvent } from 'react';
import { Models } from 'appwrite';
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CardMedia,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Typography,
} from '@mui/material';
import { MoreVert as MoreVertIcon, Upload as UploadIcon } from '@mui/icons-material';
import { formatShortDateTime } from '../../../utils/dates';

interface MediaLibraryDialogProps {
    images: Models.File[];
    loading: boolean;
    open: boolean;
    selectedImage: Models.File | null;
    getImageUrl: (fileId: string) => string;
    onClose: () => void;
    onImageMenuOpen: (event: MouseEvent<HTMLElement>, imageId: string) => void;
    onInsert: () => void;
    onOpenUploadDialog: () => void;
    onSelectImage: (image: Models.File) => void;
}

export function MediaLibraryDialog({
    images,
    loading,
    open,
    selectedImage,
    getImageUrl,
    onClose,
    onImageMenuOpen,
    onInsert,
    onOpenUploadDialog,
    onSelectImage,
}: MediaLibraryDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>Media Library</DialogTitle>
            <DialogContent>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : images.length === 0 ? (
                    <Box sx={{ textAlign: 'center', my: 4 }}>
                        <Typography color="textSecondary">No images found</Typography>
                        <Button variant="outlined" startIcon={<UploadIcon />} sx={{ mt: 2 }} onClick={onOpenUploadDialog}>
                            Upload New Image
                        </Button>
                    </Box>
                ) : (
                    <Grid container spacing={2} sx={{ mt: 1, mb: 3 }}>
                        {images.map((image) => (
                            <Grid item xs={12} sm={6} md={4} key={image.$id}>
                                <Card
                                    sx={{
                                        border: selectedImage?.$id === image.$id ? '2px solid #1976d2' : 'none',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }}
                                    onClick={() => onSelectImage(image)}
                                >
                                    <CardMedia
                                        component="img"
                                        image={getImageUrl(image.$id)}
                                        alt={image.name}
                                        sx={{ height: 140, objectFit: 'cover' }}
                                    />
                                    <CardContent sx={{ flexGrow: 1, pb: 1, pt: 1 }}>
                                        <Typography variant="body2" noWrap>
                                            {image.name}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {formatShortDateTime(image.$createdAt)}
                                        </Typography>
                                    </CardContent>
                                    <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
                                        <Button
                                            size="small"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onSelectImage(image);
                                            }}
                                        >
                                            Select
                                        </Button>
                                        <IconButton
                                            size="small"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onImageMenuOpen(event, image.$id);
                                            }}
                                        >
                                            <MoreVertIcon fontSize="small" />
                                        </IconButton>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" disabled={!selectedImage} onClick={onInsert}>
                    Insert Selected Image
                </Button>
            </DialogActions>
        </Dialog>
    );
}
