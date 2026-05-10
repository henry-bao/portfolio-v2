import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Button,
    TextField,
    CircularProgress,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Alert,
    Snackbar,
    useTheme,
    useMediaQuery,
    Stack,
    Card,
    CardContent,
    CardActions,
    Divider,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Preview as PreviewIcon,
} from '@mui/icons-material';
import { getBlogPosts, deleteBlogPost, updateBlogPost } from '../../services/appwrite';
import { getBlogDrafts, removeBlogDraft } from '../../services/blogDraftStorage';
import type { DraftBlogPost } from '../../services/blogDraftStorage';
import type { BlogPostDocument } from '../../types';
import { routes } from '../../routes/paths';
import { BLOG_PREVIEW_STORAGE_KEY } from '../../utils/blog';
import { formatBlogDate, formatLocalDateTime } from '../../utils/dates';

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
    const formattedDbPosts = dbPosts.map(mapDatabasePost);
    const draftPosts = drafts.map(mapDraftPost);
    const dbPostIds = new Set(formattedDbPosts.map((post) => post.$id));
    const newDrafts = draftPosts.filter((draft) => isNewDraftId(draft.id));
    const existingPostDrafts = draftPosts.filter((draft) => draft.id && !isNewDraftId(draft.id) && dbPostIds.has(draft.id));
    const draftsByPostId = new Map(existingPostDrafts.map((draft) => [draft.id, draft]));
    const postsWithDrafts = formattedDbPosts.map((post) =>
        draftsByPostId.has(post.$id) ? { ...post, hasDraft: true } : post
    );

    return [...postsWithDrafts, ...newDrafts].sort((a, b) => {
        const getTimestamp = (item: DisplayBlogPost) => {
            if (item.isDraft && item.lastSaved) {
                return new Date(item.lastSaved).getTime();
            }

            if (!item.isDraft && item.hasDraft && draftsByPostId.has(item.$id)) {
                return new Date(draftsByPostId.get(item.$id)?.lastSaved || item.publishedDate).getTime();
            }

            return new Date(item.publishedDate).getTime();
        };

        return getTimestamp(b) - getTimestamp(a);
    });
};

const getPostDisplayDate = (post: DisplayBlogPost) =>
    post.isDraft && post.lastSaved ? `Last edited: ${formatLocalDateTime(post.lastSaved)}` : formatBlogDate(post.publishedDate);

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
    if (post.isDraft && !isNewDraftId(post.id)) {
        return <Chip size="small" color="warning" label="Modified" />;
    }

    if (post.isDraft) {
        return <Chip size="small" color="warning" label="Draft" />;
    }

    if (post.status === 'published') {
        return <Chip size="small" color="success" label="Published" />;
    }

    return <Chip size="small" color="default" label="Unpublished" />;
};

const BlogTags = ({ tags }: { tags?: string[] }) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: '200px' }}>
        {tags?.map((tag, index) => (
            <Chip key={`${tag}-${index}`} label={tag} size="small" sx={{ fontSize: '0.7rem', height: '22px' }} />
        ))}
    </Box>
);

const BlogManager = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    const [allPosts, setAllPosts] = useState<DisplayBlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<DisplayBlogPost | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error',
    });

    const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
        setSnackbar({
            open: true,
            message,
            severity,
        });
    }, []);

    const loadAllPosts = useCallback(async () => {
        setIsLoading(true);

        try {
            const [dbPosts, drafts] = await Promise.all([getBlogPosts(false), Promise.resolve(getBlogDrafts())]);
            setAllPosts(buildDisplayPosts(dbPosts, drafts));
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

    const handleDeleteClick = (post: DisplayBlogPost) => {
        setSelectedPost(post);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedPost) return;

        try {
            if (selectedPost.isDraft) {
                removeBlogDraft(selectedPost.id || selectedPost.$id);
                showSnackbar('Draft deleted successfully', 'success');
            } else {
                await deleteBlogPost(selectedPost.$id);
                showSnackbar('Blog post deleted successfully', 'success');
            }

            setAllPosts((prev) => prev.filter((post) => post.$id !== selectedPost.$id));
        } catch (error) {
            console.error('Error deleting blog post:', error);
            showSnackbar('Failed to delete blog post', 'error');
        } finally {
            setDeleteDialogOpen(false);
            setSelectedPost(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setSelectedPost(null);
    };

    const handlePublishToggle = async (post: DisplayBlogPost) => {
        if (post.isDraft) {
            showSnackbar('Save draft to database before publishing', 'error');
            return;
        }

        try {
            await updateBlogPost(post.$id, {
                published: post.status === 'unpublished',
            });

            setAllPosts((prev) =>
                prev.map((p) =>
                    p.$id === post.$id
                        ? {
                              ...p,
                              status: post.status === 'unpublished' ? 'published' : 'unpublished',
                          }
                        : p
                )
            );

            showSnackbar(
                `Blog post ${post.status === 'unpublished' ? 'published' : 'unpublished'} successfully`,
                'success'
            );
        } catch (error) {
            console.error('Error updating blog post:', error);
            showSnackbar('Failed to update blog post', 'error');
        }
    };

    const handleNewPost = () => {
        navigate(routes.admin.blogNew);
    };

    const handleEditPost = (post: DisplayBlogPost) => {
        if (post.isDraft && post.id) {
            if (isNewDraftId(post.id)) {
                navigate(routes.admin.blogNewWithDraft(post.id));
            } else {
                navigate(routes.admin.blogEdit(post.$id));
            }
        } else if (post.hasDraft) {
            navigate(routes.admin.blogEdit(post.$id));
        } else {
            navigate(routes.admin.blogEdit(post.$id));
        }
    };

    const handleViewPost = (post: DisplayBlogPost) => {
        window.open(routes.blogPostBySlug(post.slug), '_blank');
    };

    const handlePreviewPost = (post: DisplayBlogPost) => {
        if (post.isDraft) {
            const drafts = getBlogDrafts();
            const draftContent = drafts.find((draft) => (post.id && draft.id === post.id) || post.$id === draft.id);

            if (draftContent) {
                sessionStorage.setItem(
                    BLOG_PREVIEW_STORAGE_KEY,
                    JSON.stringify({
                        title: draftContent.title,
                        content: draftContent.content,
                        summary: draftContent.summary,
                        slug: draftContent.slug || 'preview',
                        publishedDate: draftContent.publishedDate || new Date().toISOString(),
                        tags: draftContent.tags || [],
                        viewCount: 0,
                        isPreview: true,
                    })
                );

                window.open(routes.blogPostBySlug('preview'), '_blank');
            } else {
                showSnackbar('Could not find draft content to preview', 'error');
            }
        } else {
            window.open(`${routes.blogPostBySlug(post.slug)}?preview=true`, '_blank');
        }
    };

    const filteredPosts = useMemo(
        () => allPosts.filter((post) => matchesSearch(post, searchTerm)),
        [allPosts, searchTerm]
    );

    const handleCloseSnackbar = () => {
        setSnackbar((prev) => ({
            ...prev,
            open: false,
        }));
    };

    const renderCardView = () => (
        <Stack spacing={2} mt={2}>
            {filteredPosts.map((post) => (
                <Card key={post.$id} variant="outlined">
                    <CardContent>
                        <Typography variant="h6" component="div" gutterBottom>
                            {post.title}
                        </Typography>

                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                mb: 1,
                            }}
                        >
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
                        <IconButton
                            color="secondary"
                            onClick={() => handlePreviewPost(post)}
                            size="small"
                            title="Preview"
                        >
                            <PreviewIcon fontSize="small" />
                        </IconButton>
                        <IconButton color="primary" onClick={() => handleEditPost(post)} size="small" title="Edit">
                            <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDeleteClick(post)} size="small" title="Delete">
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                        {!post.isDraft && (
                            <IconButton
                                color={post.status === 'published' ? 'warning' : 'success'}
                                onClick={() => handlePublishToggle(post)}
                                size="small"
                                title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                            >
                                {post.status === 'published' ? (
                                    <VisibilityOffIcon fontSize="small" />
                                ) : (
                                    <VisibilityIcon fontSize="small" />
                                )}
                            </IconButton>
                        )}
                        {post.status === 'published' && (
                            <IconButton color="info" onClick={() => handleViewPost(post)} size="small" title="View">
                                <VisibilityIcon fontSize="small" />
                            </IconButton>
                        )}
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
                            <TableCell>
                                {getPostDisplayDate(post)}
                            </TableCell>
                            <TableCell>
                                <BlogStatusChip post={post} />
                                {post.hasDraft && (
                                    <Typography color="warning.main" fontSize="0.75rem" paddingTop={0.5}>
                                        Has unsaved changes
                                    </Typography>
                                )}
                            </TableCell>
                            <TableCell>
                                {post.isDraft ? (
                                    <Typography variant="body2">–</Typography>
                                ) : (
                                    <Typography variant="body2">{post.viewCount || 0}</Typography>
                                )}
                            </TableCell>
                            <TableCell>
                                <BlogTags tags={post.tags} />
                            </TableCell>
                            <TableCell align="right">
                                <Box>
                                    <IconButton
                                        color="secondary"
                                        onClick={() => handlePreviewPost(post)}
                                        size="small"
                                        title="Preview"
                                    >
                                        <PreviewIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        color="primary"
                                        onClick={() => handleEditPost(post)}
                                        size="small"
                                        title="Edit"
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        color="error"
                                        onClick={() => handleDeleteClick(post)}
                                        size="small"
                                        title="Delete"
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                    {!post.isDraft && (
                                        <IconButton
                                            color={post.status === 'published' ? 'warning' : 'success'}
                                            onClick={() => handlePublishToggle(post)}
                                            size="small"
                                            title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                                        >
                                            {post.status === 'published' ? (
                                                <VisibilityOffIcon fontSize="small" />
                                            ) : (
                                                <VisibilityIcon fontSize="small" />
                                            )}
                                        </IconButton>
                                    )}
                                    {post.status === 'published' && (
                                        <IconButton
                                            color="info"
                                            onClick={() => handleViewPost(post)}
                                            size="small"
                                            title="View"
                                        >
                                            <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                    )}
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
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    gap: { xs: 2, sm: 0 },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    mb: 3,
                }}
            >
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                    }}
                >
                    Blogs
                </Typography>
                <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleNewPost}>
                    New
                </Button>
            </Box>

            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
                <Box
                    display="flex"
                    flexDirection={isMobile ? 'column' : 'row'}
                    justifyContent="space-between"
                    alignItems={isMobile ? 'stretch' : 'center'}
                    gap={isMobile ? 2 : 0}
                    mb={2}
                >
                    <TextField
                        label="Search blog posts"
                        variant="outlined"
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                ) : (
                    <>{isTablet ? renderCardView() : renderTableView()}</>
                )}
            </Paper>

            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                fullWidth={isMobile}
                maxWidth={isMobile ? 'sm' : 'xs'}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete {selectedPost?.isDraft ? 'the draft of' : ''} the blog post "
                        {selectedPost?.title}"? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} onClose={handleCloseSnackbar}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default BlogManager;
