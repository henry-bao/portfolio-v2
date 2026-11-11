import { useState } from 'react';
import type { MouseEvent } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardActionArea,
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
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Typography,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Edit as EditIcon,
    MoreVert as MoreVertIcon,
    Refresh as RefreshIcon,
    Upload as UploadIcon,
} from '@mui/icons-material';
import { fileUrl, getErrorMessage } from '../../../api';
import type { StoredFile } from '../../../api';
import { formatShortDateTime } from '../../../lib/dates';
import { useBlogImages } from '../../../queries';
import { DeleteImageDialog } from './DeleteImageDialog';
import { ReplaceImageDialog } from './ReplaceImageDialog';
import { imageMarkdown } from './blogForm';

interface MediaLibraryDialogProps {
    onClose: () => void;
    /** Receives the Markdown for the chosen image. */
    onInsert: (markdown: string) => void;
    onUploadNew: () => void;
}

/** Pick, replace or delete images in the blog media library. Mount it only while open. */
export function MediaLibraryDialog({ onClose, onInsert, onUploadNew }: MediaLibraryDialogProps) {
    const images = useBlogImages();
    const [selected, setSelected] = useState<StoredFile | null>(null);
    const [menu, setMenu] = useState<{ anchor: HTMLElement; image: StoredFile } | null>(null);
    const [toReplace, setToReplace] = useState<StoredFile | null>(null);
    const [toDelete, setToDelete] = useState<StoredFile | null>(null);

    const handleInsert = () => {
        const url = selected ? fileUrl(selected.$id) : null;

        if (selected && url) {
            onInsert(imageMarkdown(selected.name, url));
            onClose();
        }
    };

    const openMenu = (event: MouseEvent<HTMLElement>, image: StoredFile) => {
        event.stopPropagation();
        setMenu({ anchor: event.currentTarget, image });
    };

    const handleDeleted = () => {
        if (selected?.$id === toDelete?.$id) {
            setSelected(null);
        }
        setToDelete(null);
    };

    return (
        <>
            <Dialog open onClose={onClose} fullWidth maxWidth="md">
                <DialogTitle>Media Library</DialogTitle>
                <DialogContent>
                    {images.isPending ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : images.isError ? (
                        <Alert
                            severity="error"
                            action={
                                <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={() => void images.refetch()}>
                                    Retry
                                </Button>
                            }
                        >
                            {getErrorMessage(images.error)}
                        </Alert>
                    ) : images.data.length === 0 ? (
                        <Box sx={{ textAlign: 'center', my: 4 }}>
                            <Typography color="textSecondary">No images yet</Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={2} sx={{ mt: 1, mb: 3 }}>
                            {images.data.map((image) => (
                                <Grid key={image.$id} size={{ xs: 12, sm: 6, md: 4 }}>
                                    <MediaCard
                                        image={image}
                                        isSelected={selected?.$id === image.$id}
                                        onSelect={() => setSelected(image)}
                                        onOpenMenu={(event) => openMenu(event, image)}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'space-between' }}>
                    <Button startIcon={<UploadIcon />} onClick={onUploadNew}>
                        Upload New Image
                    </Button>
                    <Box>
                        <Button onClick={onClose}>Cancel</Button>
                        <Button variant="contained" disabled={!selected} onClick={handleInsert} sx={{ ml: 1 }}>
                            Insert Selected Image
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>

            <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
                <MenuItem
                    onClick={() => {
                        setToReplace(menu?.image ?? null);
                        setMenu(null);
                    }}
                >
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Replace</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        setToDelete(menu?.image ?? null);
                        setMenu(null);
                    }}
                >
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>

            {toReplace && <ReplaceImageDialog image={toReplace} onClose={() => setToReplace(null)} />}
            {toDelete && <DeleteImageDialog image={toDelete} onClose={handleDeleted} />}
        </>
    );
}

interface MediaCardProps {
    image: StoredFile;
    isSelected: boolean;
    onSelect: () => void;
    onOpenMenu: (event: MouseEvent<HTMLElement>) => void;
}

function MediaCard({ image, isSelected, onSelect, onOpenMenu }: MediaCardProps) {
    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                outline: isSelected ? 2 : 0,
                outlineColor: 'primary.main',
            }}
        >
            <CardActionArea onClick={onSelect} sx={{ flexGrow: 1 }}>
                <CardMedia
                    component="img"
                    image={fileUrl(image.$id) ?? undefined}
                    alt={image.name}
                    loading="lazy"
                    sx={{ height: 140, objectFit: 'cover' }}
                />
                <CardContent sx={{ pb: 1, pt: 1 }}>
                    <Typography variant="body2" noWrap title={image.name}>
                        {image.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        {formatShortDateTime(image.$createdAt)}
                    </Typography>
                </CardContent>
            </CardActionArea>
            <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                <IconButton size="small" onClick={onOpenMenu} aria-label={`More actions for ${image.name}`}>
                    <MoreVertIcon fontSize="small" />
                </IconButton>
            </CardActions>
        </Card>
    );
}
