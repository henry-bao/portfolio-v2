import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    OpenInNew as OpenInNewIcon,
    Preview as PreviewIcon,
    Refresh as RefreshIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { draftsApi, getErrorMessage } from '../../api';
import { useNotify } from '../../app/notifications/useNotify';
import { routes } from '../../app/routes';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { PageHeader } from '../../components/admin/PageHeader';
import { buildBlogListItems, itemTags, itemTitle, matchesSearch } from '../../components/admin/blog/blogListItems';
import type { BlogListItem } from '../../components/admin/blog/blogListItems';
import { useBreakpoints } from '../../hooks';
import { formatBlogDate, formatLocalDateTime } from '../../lib/dates';
import { useAllPosts, useDeletePost, useDrafts, useSetPostPublished } from '../../queries';

const openInNewTab = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

const itemDate = (item: BlogListItem) =>
    item.kind === 'draft' ? `Last edited ${formatLocalDateTime(item.draft.lastSaved)}` : formatBlogDate(item.post.publishedDate);

function StatusChip({ item }: { item: BlogListItem }) {
    if (item.kind === 'draft') {
        return <Chip size="small" color="warning" label="Draft" />;
    }

    return item.post.published ? (
        <Chip size="small" color="success" label="Published" />
    ) : (
        <Chip size="small" label="Unpublished" />
    );
}

function UnsavedNote({ item }: { item: BlogListItem }) {
    if (item.kind !== 'post' || !item.draft) {
        return null;
    }

    return (
        <Typography variant="body2" sx={{ color: 'warning.main', fontSize: '0.75rem', pt: 0.5 }}>
            Has unsaved changes
        </Typography>
    );
}

const TagChips = ({ tags }: { tags: string[] }) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: '200px' }}>
        {tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" sx={{ fontSize: '0.7rem', height: '22px' }} />
        ))}
    </Box>
);

interface ItemActionsProps {
    item: BlogListItem;
    isPublishPending: boolean;
    onEdit: (item: BlogListItem) => void;
    onDelete: (item: BlogListItem) => void;
    onTogglePublished: (item: BlogListItem) => void;
}

function ItemActions({ item, isPublishPending, onEdit, onDelete, onTogglePublished }: ItemActionsProps) {
    const isPublished = item.kind === 'post' && item.post.published;
    const previewUrl =
        item.kind === 'post' ? routes.blogPostAdminPreview(item.post.slug) : routes.blogDraftPreview(item.draft.id);

    return (
        <>
            <IconButton color="secondary" onClick={() => openInNewTab(previewUrl)} size="small" title="Preview">
                <PreviewIcon fontSize="small" />
            </IconButton>
            <IconButton color="primary" onClick={() => onEdit(item)} size="small" title="Edit">
                <EditIcon fontSize="small" />
            </IconButton>
            <IconButton color="error" onClick={() => onDelete(item)} size="small" title="Delete">
                <DeleteIcon fontSize="small" />
            </IconButton>
            {item.kind === 'post' && (
                <IconButton
                    color={isPublished ? 'warning' : 'success'}
                    onClick={() => onTogglePublished(item)}
                    disabled={isPublishPending}
                    size="small"
                    title={isPublished ? 'Unpublish' : 'Publish'}
                >
                    {isPublished ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </IconButton>
            )}
            {item.kind === 'post' && isPublished && (
                <IconButton
                    color="info"
                    onClick={() => openInNewTab(routes.blogPostBySlug(item.post.slug))}
                    size="small"
                    title="View on site"
                >
                    <OpenInNewIcon fontSize="small" />
                </IconButton>
            )}
        </>
    );
}

const deleteDescription = (item: BlogListItem) => {
    if (item.kind === 'draft') {
        return `Delete the draft "${itemTitle(item)}"? This can't be undone.`;
    }

    const unsaved = item.draft ? ' Your unsaved local changes to it are deleted too.' : '';
    return `Delete the blog post "${itemTitle(item)}" and its cover image?${unsaved} This can't be undone.`;
};

const BlogPostsPage = () => {
    const navigate = useNavigate();
    const notify = useNotify();
    const { isMobile, isTablet } = useBreakpoints();

    const posts = useAllPosts();
    const drafts = useDrafts();
    const deletePost = useDeletePost();
    const setPublished = useSetPostPublished();

    const [searchTerm, setSearchTerm] = useState('');
    const [itemToDelete, setItemToDelete] = useState<BlogListItem | null>(null);

    const items = useMemo(
        () => buildBlogListItems(posts.data ?? [], drafts).filter((item) => matchesSearch(item, searchTerm)),
        [drafts, posts.data, searchTerm]
    );

    const handleEdit = (item: BlogListItem) =>
        navigate(item.kind === 'draft' ? routes.admin.blogNewFromDraft(item.draft.id) : routes.admin.blogEdit(item.post.$id));

    const handleTogglePublished = (item: BlogListItem) => {
        if (item.kind !== 'post') {
            return;
        }

        const published = !item.post.published;

        setPublished.mutate(
            { post: item.post, published },
            {
                onSuccess: () => notify.success(published ? 'Post published' : 'Post unpublished'),
                onError: notify.error,
            }
        );
    };

    const handleDeleteConfirm = () => {
        if (!itemToDelete) {
            return;
        }

        if (itemToDelete.kind === 'draft') {
            draftsApi.deleteDraft(itemToDelete.draft.id);
            notify.success('Draft deleted');
            setItemToDelete(null);
            return;
        }

        deletePost.mutate(itemToDelete.post, {
            onSuccess: () => notify.success('Blog post deleted'),
            onError: notify.error,
            onSettled: () => setItemToDelete(null),
        });
    };

    const actionProps = {
        isPublishPending: setPublished.isPending,
        onEdit: handleEdit,
        onDelete: setItemToDelete,
        onTogglePublished: handleTogglePublished,
    };

    const renderCards = () => (
        <Stack spacing={2} sx={{ mt: 2 }}>
            {items.map((item) => (
                <Card key={item.id} variant="outlined">
                    <CardContent>
                        <Typography variant="h6" component="div" gutterBottom>
                            {itemTitle(item)}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {itemDate(item)}
                            </Typography>
                            <StatusChip item={item} />
                        </Box>
                        <UnsavedNote item={item} />
                        {item.kind === 'post' && (
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                                Views: {item.post.viewCount}
                            </Typography>
                        )}
                        <TagChips tags={itemTags(item)} />
                    </CardContent>
                    <Divider />
                    <CardActions sx={{ justifyContent: 'flex-end' }}>
                        <ItemActions item={item} {...actionProps} />
                    </CardActions>
                </Card>
            ))}
        </Stack>
    );

    const renderTable = () => (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Views</TableCell>
                        <TableCell>Tags</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>{itemTitle(item)}</TableCell>
                            <TableCell>{itemDate(item)}</TableCell>
                            <TableCell>
                                <StatusChip item={item} />
                                <UnsavedNote item={item} />
                            </TableCell>
                            <TableCell>{item.kind === 'post' ? item.post.viewCount : '–'}</TableCell>
                            <TableCell>
                                <TagChips tags={itemTags(item)} />
                            </TableCell>
                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                <ItemActions item={item} {...actionProps} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    const renderBody = () => {
        if (posts.isPending) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                    <CircularProgress />
                </Box>
            );
        }

        if (posts.isError) {
            return (
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={() => void posts.refetch()}>
                            Retry
                        </Button>
                    }
                >
                    {getErrorMessage(posts.error)}
                </Alert>
            );
        }

        if (items.length === 0) {
            return (
                <Typography color="textSecondary" sx={{ textAlign: 'center', my: 5 }}>
                    {searchTerm.trim() ? 'No blog posts match your search' : 'No blog posts yet. Create your first one!'}
                </Typography>
            );
        }

        return isTablet ? renderCards() : renderTable();
    };

    return (
        <Box>
            <PageHeader
                title="Blogs"
                action={
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate(routes.admin.blogNew)}>
                        New
                    </Button>
                }
            />

            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
                <TextField
                    label="Search blog posts"
                    size="small"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    sx={{ width: isMobile ? '100%' : '300px', mb: 2 }}
                />
                {renderBody()}
            </Paper>

            <ConfirmDialog
                open={Boolean(itemToDelete)}
                title="Confirm Delete"
                description={itemToDelete ? deleteDescription(itemToDelete) : ''}
                isBusy={deletePost.isPending}
                fullWidth={isMobile}
                onCancel={() => setItemToDelete(null)}
                onConfirm={handleDeleteConfirm}
            />
        </Box>
    );
};

export default BlogPostsPage;
