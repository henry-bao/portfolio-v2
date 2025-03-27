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
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { Models } from 'appwrite';
import { getBlogPosts, deleteBlogPost, updateBlogPost, BlogPost } from '../../services/appwrite';

const BlogManager = () => {
    const navigate = useNavigate();
    const [blogPosts, setBlogPosts] = useState<(Models.Document & BlogPost)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<(Models.Document & BlogPost) | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error',
    });

    useEffect(() => {
        const fetchBlogPosts = async () => {
            setIsLoading(true);
            try {
                const posts = await getBlogPosts(false); // Get all posts including unpublished
                setBlogPosts(posts);
            } catch (error) {
                console.error('Error fetching blog posts:', error);
                showSnackbar('Failed to load blog posts', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBlogPosts();
    }, []);

    const handleDeleteClick = (post: Models.Document & BlogPost) => {
        setSelectedPost(post);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedPost) return;

        try {
            await deleteBlogPost(selectedPost.$id);
            setBlogPosts((prev) => prev.filter((post) => post.$id !== selectedPost.$id));
            showSnackbar('Blog post deleted successfully', 'success');
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

    const handlePublishToggle = async (post: Models.Document & BlogPost) => {
        try {
            await updateBlogPost(post.$id, {
                ...post,
                published: !post.published,
            });

            setBlogPosts((prev) => prev.map((p) => (p.$id === post.$id ? { ...p, published: !p.published } : p)));

            showSnackbar(`Blog post ${!post.published ? 'published' : 'unpublished'} successfully`, 'success');
        } catch (error) {
            console.error('Error updating blog post:', error);
            showSnackbar('Failed to update blog post', 'error');
        }
    };

    const handleNewPost = () => {
        navigate('/admin/blogs/new');
    };

    const handleEditPost = (post: Models.Document & BlogPost) => {
        navigate(`/admin/blogs/edit/${post.$id}`);
    };

    const handleViewPost = (post: Models.Document & BlogPost) => {
        window.open(`/blogs/${post.slug}`, '_blank');
    };

    const filteredPosts = blogPosts.filter(
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

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Blogs
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <TextField
                        label="Search blog posts"
                        variant="outlined"
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ width: '300px' }}
                    />
                    <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleNewPost}>
                        New Blog Post
                    </Button>
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
                                        <TableCell>{new Date(post.publishedDate).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                color={post.published ? 'success' : 'default'}
                                                label={post.published ? 'Published' : 'Draft'}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{post.viewCount || 0}</Typography>
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
                                                <IconButton
                                                    color={post.published ? 'warning' : 'success'}
                                                    onClick={() => handlePublishToggle(post)}
                                                    size="small"
                                                    title={post.published ? 'Unpublish' : 'Publish'}
                                                >
                                                    {post.published ? (
                                                        <VisibilityOffIcon fontSize="small" />
                                                    ) : (
                                                        <VisibilityIcon fontSize="small" />
                                                    )}
                                                </IconButton>
                                                {post.published && (
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
                )}
            </Paper>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the blog post "{selectedPost?.title}"? This action cannot be
                        undone.
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
