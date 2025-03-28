import { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import { getBlogPosts, deleteBlogPost, updateBlogPost } from '../../services/appwrite';

// Interface for drafts stored in localStorage
interface DraftBlogPost {
    id?: string;
    title: string;
    content: string;
    summary: string;
    slug: string;
    publishedDate: string;
    tags: string[];
    lastSaved: string;
}

// Combined type for displaying both database posts and drafts
interface DisplayBlogPost {
    $id: string;
    id?: string; // Used for drafts that correspond to existing posts
    title: string;
    summary: string;
    slug: string;
    publishedDate: string;
    tags?: string[];
    viewCount?: number;
    status: 'published' | 'unpublished' | 'draft';
    isDraft: boolean;
    hasDraft?: boolean; // Indicates if a published post has a draft version
    lastSaved?: string;
}

const DRAFTS_STORAGE_KEY = 'blog_drafts';

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

    useEffect(() => {
        const loadAllPosts = async () => {
            setIsLoading(true);
            try {
                // Load posts from database
                const dbPosts = await getBlogPosts(false); // Get all posts including unpublished

                // Load drafts from localStorage
                const draftsJson = localStorage.getItem(DRAFTS_STORAGE_KEY);
                const drafts: DraftBlogPost[] = draftsJson ? JSON.parse(draftsJson) : [];

                // Format database posts for display
                const formattedDbPosts: DisplayBlogPost[] = dbPosts.map((post) => ({
                    $id: post.$id,
                    title: post.title,
                    summary: post.summary,
                    slug: post.slug,
                    publishedDate: post.publishedDate,
                    tags: post.tags,
                    viewCount: post.viewCount,
                    status: post.published ? 'published' : 'unpublished',
                    isDraft: false,
                }));

                // Format drafts for display
                const draftPosts: DisplayBlogPost[] = drafts.map((draft) => ({
                    $id: draft.id || `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    id: draft.id,
                    title: draft.title || 'Untitled Draft',
                    summary: draft.summary || '',
                    slug: draft.slug || '',
                    publishedDate: draft.publishedDate || new Date().toISOString(),
                    tags: draft.tags,
                    status: 'draft',
                    isDraft: true,
                    lastSaved: draft.lastSaved,
                }));

                // Merge database posts and drafts
                // For drafts of existing posts, we want to show both the published version and the draft
                const dbPostIds = new Set(formattedDbPosts.map((post) => post.$id));

                // First filter out purely new drafts (those with 'new-' prefix)
                const newDrafts = draftPosts.filter((draft) => draft.id?.startsWith('new-'));

                // Then find drafts for existing posts
                const existingPostDrafts = draftPosts.filter(
                    (draft) => draft.id && !draft.id.startsWith('new-') && dbPostIds.has(draft.id)
                );

                // Create a modified version of existing posts to show their draft status
                const postsWithDrafts = formattedDbPosts.map((post) => {
                    const hasDraft = existingPostDrafts.some((draft) => draft.id === post.$id);
                    return hasDraft ? { ...post, hasDraft: true } : post;
                });

                // Combine all posts: published/unpublished without drafts, published/unpublished with drafts, and new drafts
                const combinedPosts = [...postsWithDrafts, ...newDrafts];

                // Sort by last modified date
                combinedPosts.sort((a, b) => {
                    const draftsMap = new Map(existingPostDrafts.map((d) => [d.id, d]));

                    // For posts with drafts, use the draft's last saved time
                    const getDateForItem = (item: DisplayBlogPost) => {
                        if (item.isDraft && item.lastSaved) {
                            return new Date(item.lastSaved).getTime();
                        } else if (!item.isDraft && item.hasDraft && item.$id && draftsMap.has(item.$id)) {
                            return new Date(draftsMap.get(item.$id)?.lastSaved || item.publishedDate).getTime();
                        }
                        return new Date(item.publishedDate).getTime();
                    };

                    return getDateForItem(b) - getDateForItem(a);
                });

                setAllPosts(combinedPosts);
            } catch (error) {
                console.error('Error fetching blog posts:', error);
                showSnackbar('Failed to load blog posts', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        loadAllPosts();
    }, []);

    const handleDeleteClick = (post: DisplayBlogPost) => {
        setSelectedPost(post);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedPost) return;

        try {
            if (selectedPost.isDraft) {
                // Delete from localStorage
                const draftsJson = localStorage.getItem(DRAFTS_STORAGE_KEY);
                const drafts: DraftBlogPost[] = draftsJson ? JSON.parse(draftsJson) : [];
                const updatedDrafts = drafts.filter(
                    (draft) => (draft.id && draft.id !== selectedPost.$id) || (!draft.id && !selectedPost.id)
                );
                localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(updatedDrafts));

                showSnackbar('Draft deleted successfully', 'success');
            } else {
                // Delete from database
                await deleteBlogPost(selectedPost.$id);
                showSnackbar('Blog post deleted successfully', 'success');
            }

            // Remove from UI
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
            // Can't publish a draft directly
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
        // Instead of clearing drafts, just navigate to new post page
        // We'll handle this in the BlogEditor component
        navigate('/admin/blogs/new');
    };

    const handleEditPost = (post: DisplayBlogPost) => {
        if (post.isDraft && post.id) {
            if (post.id.startsWith('new-')) {
                // This is a new draft, navigate to new post page with query parameter
                navigate(`/admin/blogs/new?loadDraft=true&draftId=${post.id}`);
            } else {
                // This is a draft of an existing post
                navigate(`/admin/blogs/edit/${post.$id}`);
            }
        } else if (post.hasDraft) {
            // This is a published post with unsaved changes (draft)
            // Navigate to its edit page - the draft will be loaded automatically
            navigate(`/admin/blogs/edit/${post.$id}`);
        } else {
            // Regular database post without draft
            navigate(`/admin/blogs/edit/${post.$id}`);
        }
    };

    const handleViewPost = (post: DisplayBlogPost) => {
        window.open(`/blogs/${post.slug}`, '_blank');
    };

    const filteredPosts = allPosts.filter(
        (post) =>
            post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (post.tags && post.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbar({
            open: true,
            message,
            severity,
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar((prev) => ({
            ...prev,
            open: false,
        }));
    };

    const getStatusChip = (post: DisplayBlogPost) => {
        if (post.isDraft && !post.id?.startsWith('new-')) {
            // This is a draft of an existing post
            return <Chip size="small" color="warning" label="Modified" />;
        } else if (post.isDraft) {
            // This is a new draft
            return <Chip size="small" color="warning" label="Draft" />;
        } else if (post.status === 'published') {
            return <Chip size="small" color="success" label="Published" />;
        } else {
            return <Chip size="small" color="default" label="Unpublished" />;
        }
    };

    // Card view for mobile and tablet
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
                                {post.isDraft && post.lastSaved
                                    ? `Last edited: ${new Date(post.lastSaved).toLocaleString()}`
                                    : new Date(post.publishedDate).toLocaleString('en-US', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric',
                                          timeZone: 'UTC',
                                      })}
                            </Typography>

                            {getStatusChip(post)}
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

                        {post.isDraft && post.lastSaved && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Last edited: {new Date(post.lastSaved).toLocaleString()}
                            </Typography>
                        )}

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                            {post.tags &&
                                post.tags.map((tag, index) => (
                                    <Chip
                                        key={index}
                                        label={tag}
                                        size="small"
                                        sx={{
                                            fontSize: '0.7rem',
                                            height: '22px',
                                        }}
                                    />
                                ))}
                        </Box>
                    </CardContent>

                    <Divider />

                    <CardActions sx={{ justifyContent: 'flex-end' }}>
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

    // Table view for desktop
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
                                {post.isDraft && post.lastSaved
                                    ? `Last edited: ${new Date(post.lastSaved).toLocaleString()}`
                                    : new Date(post.publishedDate).toLocaleString('en-US', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric',
                                          timeZone: 'UTC',
                                      })}
                            </TableCell>
                            <TableCell>
                                {getStatusChip(post)}
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
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 0.5,
                                        maxWidth: '200px',
                                    }}
                                >
                                    {post.tags &&
                                        post.tags.map((tag, index) => (
                                            <Chip
                                                key={index}
                                                label={tag}
                                                size="small"
                                                sx={{
                                                    fontSize: '0.7rem',
                                                    height: '22px',
                                                }}
                                            />
                                        ))}
                                </Box>
                            </TableCell>
                            <TableCell align="right">
                                <Box>
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
                <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
                    Blogs
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleNewPost}
                >
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
                    <>
                        {/* Card view for mobile/tablet, Table view for desktop */}
                        {isTablet ? renderCardView() : renderTableView()}
                    </>
                )}
            </Paper>

            {/* Delete Confirmation Dialog */}
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

            {/* Snackbar for notifications */}
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
