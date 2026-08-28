import { useCallback, useEffect, useMemo, useState } from 'react';
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
    Snackbar,
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
    Preview as PreviewIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { deleteBlogPost, getBlogPosts, updateBlogPost } from '../../services/blogService';
import { getBlogDrafts, removeBlogDraft } from '../../services/blogDraftStorage';
import type { DraftBlogPost } from '../../services/blogDraftStorage';
import type { BlogPostDocument } from '../../types';
import { routes } from '../../routes/paths';
import { useBreakpoints } from '../../hooks';
import { BLOG_PREVIEW_STORAGE_KEY } from '../../utils/blog';
import { formatBlogDate, formatLocalDateTime } from '../../utils/dates';
import { ConfirmDialog, PageHeader } from '../shared';

const SNACKBAR_DURATION_MS = 5000;

type SnackbarSeverity = 'success' | 'error';

/** A saved post, a local-only draft, or a saved post that has unsaved local edits. */
interface DisplayBlogPost {
    $id: string;
    id?: string;
    title: string;
    summary: string;
    slug: string;
    publishedDate: string;
    tags?: string[];
    viewCount?: number;
    status: 'published' | 'unpublished' | 'draft';
    isDraft: boolean;
    hasDraft?: boolean;
    lastSaved?: string;
}

/** Drafts for posts that were never saved to the database get a synthetic `new-` id. */
const isNewDraftId = (id?: string) => Boolean(id?.startsWith('new-'));

const mapDatabasePost = (post: BlogPostDocument): DisplayBlogPost => ({
    $id: post.$id,
    title: post.title,
    summary: post.summary,
    slug: post.slug,
    publishedDate: post.publishedDate,
    tags: post.tags,
    viewCount: post.viewCount,
    status: post.published ? 'published' : 'unpublished',
    isDraft: false,
});

const mapDraftPost = (draft: DraftBlogPost, index: number): DisplayBlogPost => ({
    $id: draft.id || `draft-${index}`,
    id: draft.id,
    title: draft.title || 'Untitled Draft',
    summary: draft.summary || '',
    slug: draft.slug || '',
    publishedDate: draft.publishedDate || new Date().toISOString(),
    tags: draft.tags,
    status: 'draft',
    isDraft: true,
    lastSaved: draft.lastSaved,
});

const buildDisplayPosts = (dbPosts: BlogPostDocument[], drafts: DraftBlogPost[]) => {
    const posts = dbPosts.map(mapDatabasePost);
    const draftPosts = drafts.map(mapDraftPost);
    const postIds = new Set(posts.map((post) => post.$id));
    const draftsByPostId = new Map(
        draftPosts
            .filter((draft) => draft.id && !isNewDraftId(draft.id) && postIds.has(draft.id))
            .map((draft) => [draft.id, draft])
    );

    const getSortTimestamp = (item: DisplayBlogPost) => {
        const draftTimestamp = item.isDraft ? item.lastSaved : draftsByPostId.get(item.$id)?.lastSaved;
        return new Date(draftTimestamp || item.publishedDate).getTime();
    };

    return [
        ...posts.map((post) => (draftsByPostId.has(post.$id) ? { ...post, hasDraft: true } : post)),
        ...draftPosts.filter((draft) => isNewDraftId(draft.id)),
    ].sort((a, b) => getSortTimestamp(b) - getSortTimestamp(a));
};

const getPostDisplayDate = (post: DisplayBlogPost) =>
    post.isDraft && post.lastSaved
        ? `Last edited: ${formatLocalDateTime(post.lastSaved)}`
        : formatBlogDate(post.publishedDate);

const matchesSearch = (post: DisplayBlogPost, searchTerm: string) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
        return true;
    }

    return (
        post.title.toLowerCase().includes(normalizedSearch) ||
        post.summary.toLowerCase().includes(normalizedSearch) ||
        Boolean(post.tags?.some((tag) => tag.toLowerCase().includes(normalizedSearch)))
    );
};

const BlogStatusChip = ({ post }: { post: DisplayBlogPost }) => {
    if (post.isDraft) {
        return <Chip size="small" color="warning" label={isNewDraftId(post.id) ? 'Draft' : 'Modified'} />;
    }

    return post.status === 'published' ? (
        <Chip size="small" color="success" label="Published" />
    ) : (
        <Chip size="small" color="default" label="Unpublished" />
    );
};

const BlogTags = ({ tags }: { tags?: string[] }) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: '200px' }}>
        {tags?.map((tag, index) => (
            <Chip key={`${tag}-${index}`} label={tag} size="small" sx={{ fontSize: '0.7rem', height: '22px' }} />
        ))}
    </Box>
);

interface BlogPostActionsProps {
    post: DisplayBlogPost;
    onPreview: (post: DisplayBlogPost) => void;
    onEdit: (post: DisplayBlogPost) => void;
    onDelete: (post: DisplayBlogPost) => void;
    onTogglePublish: (post: DisplayBlogPost) => void;
    onView: (post: DisplayBlogPost) => void;
}

const BlogPostActions = ({ post, onPreview, onEdit, onDelete, onTogglePublish, onView }: BlogPostActionsProps) => {
    const isPublished = post.status === 'published';

    return (
        <>
            <IconButton color="secondary" onClick={() => onPreview(post)} size="small" title="Preview">
                <PreviewIcon fontSize="small" />
            </IconButton>
            <IconButton color="primary" onClick={() => onEdit(post)} size="small" title="Edit">
                <EditIcon fontSize="small" />
            </IconButton>
            <IconButton color="error" onClick={() => onDelete(post)} size="small" title="Delete">
                <DeleteIcon fontSize="small" />
            </IconButton>
            {!post.isDraft && (
                <IconButton
                    color={isPublished ? 'warning' : 'success'}
                    onClick={() => onTogglePublish(post)}
                    size="small"
                    title={isPublished ? 'Unpublish' : 'Publish'}
                >
                    {isPublished ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </IconButton>
            )}
            {isPublished && (
                <IconButton color="info" onClick={() => onView(post)} size="small" title="View">
                    <VisibilityIcon fontSize="small" />
                </IconButton>
            )}
        </>
    );
};

const BlogManager = () => {
    const navigate = useNavigate();
    const { isMobile, isTablet } = useBreakpoints();

    const [allPosts, setAllPosts] = useState<DisplayBlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [postToDelete, setPostToDelete] = useState<DisplayBlogPost | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: SnackbarSeverity }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const showSnackbar = useCallback((message: string, severity: SnackbarSeverity) => {
        setSnackbar({ open: true, message, severity });
    }, []);

    const loadAllPosts = useCallback(async () => {
        setIsLoading(true);

        try {
            setAllPosts(buildDisplayPosts(await getBlogPosts(false), getBlogDrafts()));
        } catch (error) {
            console.error('Error fetching blog posts:', error);
            showSnackbar('Failed to load blog posts', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showSnackbar]);

    useEffect(() => {
        void loadAllPosts();
    }, [loadAllPosts]);

    const handleDeleteConfirm = async () => {
        if (!postToDelete) {
            return;
        }

        try {
            if (postToDelete.isDraft) {
                removeBlogDraft(postToDelete.id || postToDelete.$id);
                showSnackbar('Draft deleted successfully', 'success');
            } else {
                await deleteBlogPost(postToDelete.$id);
                showSnackbar('Blog post deleted successfully', 'success');
            }

            setAllPosts((current) => current.filter((post) => post.$id !== postToDelete.$id));
        } catch (error) {
            console.error('Error deleting blog post:', error);
            showSnackbar('Failed to delete blog post', 'error');
        } finally {
            setPostToDelete(null);
        }
    };

    const handlePublishToggle = async (post: DisplayBlogPost) => {
        if (post.isDraft) {
            showSnackbar('Save draft to database before publishing', 'error');
            return;
        }

        const nextStatus = post.status === 'unpublished' ? 'published' : 'unpublished';

        try {
            await updateBlogPost(post.$id, { published: nextStatus === 'published' });
            setAllPosts((current) =>
                current.map((item) => (item.$id === post.$id ? { ...item, status: nextStatus } : item))
            );
            showSnackbar(`Blog post ${nextStatus} successfully`, 'success');
        } catch (error) {
            console.error('Error updating blog post:', error);
            showSnackbar('Failed to update blog post', 'error');
        }
    };

    const handleEditPost = (post: DisplayBlogPost) => {
        navigate(
            post.isDraft && isNewDraftId(post.id)
                ? routes.admin.blogNewWithDraft(post.$id)
                : routes.admin.blogEdit(post.$id)
        );
    };

    const handleViewPost = (post: DisplayBlogPost) => window.open(routes.blogPostBySlug(post.slug), '_blank');

    const handlePreviewPost = (post: DisplayBlogPost) => {
        if (!post.isDraft) {
            window.open(`${routes.blogPostBySlug(post.slug)}?preview=true`, '_blank');
            return;
        }

        const draft = getBlogDrafts().find((storedDraft) => storedDraft.id === (post.id ?? post.$id));

        if (!draft) {
            showSnackbar('Could not find draft content to preview', 'error');
            return;
        }

        sessionStorage.setItem(
            BLOG_PREVIEW_STORAGE_KEY,
            JSON.stringify({
                title: draft.title,
                content: draft.content,
                summary: draft.summary,
                slug: draft.slug || 'preview',
                publishedDate: draft.publishedDate || new Date().toISOString(),
                tags: draft.tags || [],
                viewCount: 0,
                isPreview: true,
            })
        );

        window.open(routes.blogPostBySlug('preview'), '_blank');
    };

    const filteredPosts = useMemo(
        () => allPosts.filter((post) => matchesSearch(post, searchTerm)),
        [allPosts, searchTerm]
    );

    const actionHandlers = {
        onPreview: handlePreviewPost,
        onEdit: handleEditPost,
        onDelete: setPostToDelete,
        onTogglePublish: handlePublishToggle,
        onView: handleViewPost,
    };

    const renderCardView = () => (
        <Stack spacing={2} mt={2}>
            {filteredPosts.map((post) => (
                <Card key={post.$id} variant="outlined">
                    <CardContent>
                        <Typography variant="h6" component="div" gutterBottom>
                            {post.title}
                        </Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                {getPostDisplayDate(post)}
                            </Typography>
                            <BlogStatusChip post={post} />
                        </Box>

                        {post.hasDraft && (
                            <Typography variant="body2" color="warning.main" sx={{ mb: 1 }}>
                                Has unsaved changes
                            </Typography>
                        )}

                        {!post.isDraft && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Views: {post.viewCount || 0}
                            </Typography>
                        )}

                        <BlogTags tags={post.tags} />
                    </CardContent>

                    <Divider />

                    <CardActions sx={{ justifyContent: 'flex-end' }}>
                        <BlogPostActions post={post} {...actionHandlers} />
                    </CardActions>
                </Card>
            ))}
        </Stack>
    );

    const renderTableView = () => (
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
                    {filteredPosts.map((post) => (
                        <TableRow key={post.$id}>
                            <TableCell>{post.title}</TableCell>
                            <TableCell>{getPostDisplayDate(post)}</TableCell>
                            <TableCell>
                                <BlogStatusChip post={post} />
                                {post.hasDraft && (
                                    <Typography color="warning.main" fontSize="0.75rem" paddingTop={0.5}>
                                        Has unsaved changes
                                    </Typography>
                                )}
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2">{post.isDraft ? '–' : post.viewCount || 0}</Typography>
                            </TableCell>
                            <TableCell>
                                <BlogTags tags={post.tags} />
                            </TableCell>
                            <TableCell align="right">
                                <Box>
                                    <BlogPostActions post={post} {...actionHandlers} />
                                </Box>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    return (
        <Box>
            <PageHeader
                title="Blogs"
                action={
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => navigate(routes.admin.blogNew)}
                    >
                        New
                    </Button>
                }
            />

            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
                <Box mb={2}>
                    <TextField
                        label="Search blog posts"
                        variant="outlined"
                        size="small"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        sx={{ width: isMobile ? '100%' : '300px' }}
                    />
                </Box>

                {isLoading ? (
                    <Box display="flex" justifyContent="center" my={5}>
                        <CircularProgress />
                    </Box>
                ) : filteredPosts.length === 0 ? (
                    <Box textAlign="center" my={5}>
                        <Typography variant="body1" color="textSecondary">
                            {searchTerm
                                ? 'No blog posts found matching your search'
                                : 'No blog posts yet. Create your first blog post!'}
                        </Typography>
                    </Box>
                ) : isTablet ? (
                    renderCardView()
                ) : (
                    renderTableView()
                )}
            </Paper>

            <ConfirmDialog
                open={Boolean(postToDelete)}
                title="Confirm Delete"
                description={`Are you sure you want to delete ${
                    postToDelete?.isDraft ? 'the draft of ' : ''
                }the blog post "${postToDelete?.title}"? This action cannot be undone.`}
                fullWidth={isMobile}
                onCancel={() => setPostToDelete(null)}
                onConfirm={handleDeleteConfirm}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={SNACKBAR_DURATION_MS}
                onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default BlogManager;
