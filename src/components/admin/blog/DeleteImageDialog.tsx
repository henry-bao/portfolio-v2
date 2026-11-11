import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { mediaApi } from '../../../api';
import type { StoredFile } from '../../../api';
import { useNotify } from '../../../app/notifications/useNotify';
import { useAllPosts, useDeleteBlogImage } from '../../../queries';

const MAX_LISTED_TITLES = 5;

/** Explains what deleting the image would break, based on which posts reference it. */
function describeUsage(usingTitles: string[] | null, checkFailed: boolean) {
    if (checkFailed) {
        return "Couldn't check which posts use this image.";
    }

    if (usingTitles === null) {
        return 'Checking which posts use this image...';
    }

    if (usingTitles.length === 0) {
        return 'No post uses this image.';
    }

    const listed = usingTitles.slice(0, MAX_LISTED_TITLES).map((title) => `"${title}"`).join(', ');
    const more = usingTitles.length > MAX_LISTED_TITLES ? ` and ${usingTitles.length - MAX_LISTED_TITLES} more` : '';
    return `It is used by ${listed}${more}, which will show a broken image.`;
}

/** Confirms deleting a media library image. Mount it only while open. */
export function DeleteImageDialog({ image, onClose }: { image: StoredFile; onClose: () => void }) {
    const notify = useNotify();
    const remove = useDeleteBlogImage();
    const posts = useAllPosts();

    const usingTitles = posts.data
        ? mediaApi.findPostsUsingFile(image.$id, posts.data).map((post) => post.title || post.slug)
        : null;

    const handleConfirm = () => {
        remove.mutate(image.$id, {
            onSuccess: () => {
                notify.success('Image deleted');
                onClose();
            },
            onError: notify.error,
        });
    };

    return (
        <Dialog open onClose={remove.isPending ? undefined : onClose} maxWidth="xs">
            <DialogTitle>Delete Image</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 1 }}>Delete "{image.name}"? This can't be undone.</DialogContentText>
                <DialogContentText>{describeUsage(usingTitles, posts.isError)}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={remove.isPending}>
                    Cancel
                </Button>
                <Button
                    onClick={handleConfirm}
                    color="error"
                    // Wait for the usage check so the warning is seen before deleting; a failed check doesn't block.
                    disabled={remove.isPending || posts.isPending}
                    startIcon={remove.isPending ? <CircularProgress size={20} /> : null}
                >
                    {remove.isPending ? 'Deleting...' : 'Delete'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
