import { useState, useEffect, ChangeEvent, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    Paper,
    CircularProgress,
    Alert,
    Switch,
    FormControlLabel,
    Divider,
    Chip,
    InputAdornment,
    Tab,
    Tabs,
    Tooltip,
} from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { Models } from 'appwrite';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getBlogPost, createBlogPost, updateBlogPost, uploadFile, deleteFile, BlogPost } from '../../services/appwrite';
import { getFilePreviewUrl } from '../../services/fileProxy';
import './markdown-preview.css';

const BlogEditor = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const isNewPost = !postId;

    const [post, setPost] = useState<(Models.Document & BlogPost) | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editorTab, setEditorTab] = useState(0);
    const [autoSave, setAutoSave] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const autoSaveTimeoutRef = useRef<number | null>(null);

    // Store latest state in refs to avoid dependency issues
    const stateRef = useRef({
        title: '',
        content: '',
        summary: '',
        slug: '',
        publishedDate: '',
        published: false,
        tags: [] as string[],
        autoSave: false,
        isNewPost,
        postId,
    });

    // Form fields
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [summary, setSummary] = useState('');
    const [slug, setSlug] = useState('');
    const [publishedDate, setPublishedDate] = useState('');
    const [published, setPublished] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    // Cover image
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

    // Update ref when state changes
    useEffect(() => {
        stateRef.current = {
            title,
            content,
            summary,
            slug,
            publishedDate,
            published,
            tags,
            autoSave,
            isNewPost,
            postId,
        };
    }, [title, content, summary, slug, publishedDate, published, tags, autoSave, isNewPost, postId]);

    useEffect(() => {
        if (isNewPost) {
            // Set default values for new post
            setPublishedDate(new Date().toISOString().split('T')[0]);
            setIsLoading(false);
            return;
        }

        const fetchPost = async () => {
            setIsLoading(true);
            try {
                const postData = await getBlogPost(postId as string);
                setPost(postData);

                // Populate form fields
                setTitle(postData.title);
                setContent(postData.content);
                setSummary(postData.summary);
                setSlug(postData.slug);
                setPublishedDate(postData.publishedDate.split('T')[0]);
                setPublished(postData.published || false);

                if (postData.tags) {
                    setTags(postData.tags);
                }

                // Load cover image preview if exists
                if (postData.coverImageId) {
                    const imageUrl = getFilePreviewUrl(postData.coverImageId);
                    setCoverImagePreview(imageUrl);
                }
            } catch (error) {
                console.error('Error fetching blog post:', error);
                setError('Failed to load blog post data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPost();
    }, [postId, isNewPost]);

    useEffect(() => {
        // Clear any existing timeout when component unmounts
        return () => {
            if (autoSaveTimeoutRef.current) {
                window.clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, []);

    const handleCoverImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setCoverImage(file);
            setCoverImagePreview(URL.createObjectURL(file));
        }
    };

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setEditorTab(newValue);
    };

    const generateSlug = (titleText: string = title) => {
        // Generate slug from title
        const newSlug = titleText
            .toLowerCase()
            .replace(/[^\w\s]/gi, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with a single one
            .trim();

        return newSlug;
    };

    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTitle(newTitle);

        // Auto-generate slug only if the user hasn't manually edited it
        if (!slugManuallyEdited) {
            setSlug(generateSlug(newTitle));
        }
    };

    const handleSlugChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSlug(e.target.value);
        setSlugManuallyEdited(true);
    };

    const handleManualSlugGenerate = () => {
        setSlug(generateSlug());
        setSlugManuallyEdited(true);
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            handleAddTag();
        }
    };

    const handleToggleAutoSave = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAutoSave(event.target.checked);
    };

    const handleSave = useCallback(async () => {
        // Validate form
        const validateForm = () => {
            if (!title.trim()) return 'Title is required';
            if (!content.trim()) return 'Content is required';
            if (!summary.trim()) return 'Summary is required';
            if (!slug.trim()) return 'Slug is required';
            if (!publishedDate) return 'Published date is required';
            return null;
        };

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            let coverImageId = post?.coverImageId;

            // Upload new cover image if changed
            if (coverImage) {
                // Delete old cover image if exists
                if (coverImageId) {
                    await deleteFile(coverImageId);
                }

                // Upload new cover image
                const uploadResult = await uploadFile(coverImage);
                coverImageId = uploadResult.$id;
            }

            // Prepare blog data
            const blogData: BlogPost = {
                title,
                content,
                summary,
                slug,
                publishedDate: new Date(publishedDate).toISOString(),
                published,
                tags: tags.length > 0 ? tags : undefined,
                coverImageId,
            };

            let result;
            if (isNewPost) {
                // Create new blog post
                result = await createBlogPost(blogData);
                setSuccess('Blog post created successfully');
            } else {
                // Update existing blog post
                result = await updateBlogPost(postId as string, blogData);
                setSuccess(autoSave ? 'Auto-saved' : 'Blog post updated successfully');
                // Set last saved timestamp
                setLastSaved(new Date().toLocaleTimeString());
            }

            if (isNewPost) {
                // Redirect to edit page after creation
                setTimeout(() => {
                    navigate(`/admin/blogs/edit/${result.$id}`);
                }, 1500);
            } else {
                setPost(result as Models.Document & BlogPost);
            }
        } catch (error) {
            console.error('Error saving blog post:', error);
            setError(`Failed to ${isNewPost ? 'create' : 'update'} blog post`);
        } finally {
            setIsSaving(false);
        }
    }, [
        post,
        coverImage,
        title,
        content,
        summary,
        slug,
        publishedDate,
        published,
        tags,
        isNewPost,
        postId,
        autoSave,
        navigate,
    ]);

    useEffect(() => {
        // Auto-save functionality
        if (!autoSave || isNewPost || !postId) return;

        // Clear any existing timeout
        if (autoSaveTimeoutRef.current) {
            window.clearTimeout(autoSaveTimeoutRef.current);
        }

        // Set a new timeout for auto-save (5 seconds after last change)
        autoSaveTimeoutRef.current = window.setTimeout(() => {
            const state = stateRef.current;
            // Only auto-save if there's actual content and a valid slug
            if (state.title.trim() && state.content.trim() && state.slug.trim()) {
                handleSave();
            }
        }, 5000);

        return () => {
            if (autoSaveTimeoutRef.current) {
                window.clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, [title, content, summary, slug, publishedDate, published, tags, autoSave, handleSave, isNewPost, postId]);

    if (isLoading) {
        return (
            <Box
                sx={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                {isNewPost ? 'Create New Blog Post' : 'Edit Blog Post'}
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}

            <Paper sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    {/* Basic Information */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Basic Information
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Title"
                                    value={title}
                                    onChange={handleTitleChange}
                                    margin="normal"
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Slug"
                                    value={slug}
                                    onChange={handleSlugChange}
                                    margin="normal"
                                    required
                                    helperText="Used for the URL"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <Button size="small" onClick={handleManualSlugGenerate}>
                                                    Generate
                                                </Button>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Published Date"
                                    type="date"
                                    value={publishedDate}
                                    onChange={(e) => setPublishedDate(e.target.value)}
                                    margin="normal"
                                    required
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Summary"
                                    value={summary}
                                    onChange={(e) => setSummary(e.target.value)}
                                    margin="normal"
                                    required
                                    multiline
                                    minRows={2}
                                    maxRows={4}
                                    helperText="A brief description for blog preview cards"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch checked={published} onChange={(e) => setPublished(e.target.checked)} />
                                    }
                                    label="Publish this post"
                                />
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Tags */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Tags
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <TextField
                                label="Add Tags"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={handleTagInputKeyPress}
                                variant="outlined"
                                size="small"
                                sx={{ flexGrow: 1 }}
                            />
                            <Button variant="contained" onClick={handleAddTag} disabled={!tagInput.trim()} size="small">
                                Add
                            </Button>
                        </Box>

                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {tags.map((tag, index) => (
                                <Chip
                                    key={index}
                                    label={tag}
                                    onDelete={() => handleRemoveTag(tag)}
                                    color="primary"
                                    variant="outlined"
                                />
                            ))}
                        </Box>
                    </Grid>

                    {/* Cover Image */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Cover Image
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        {coverImagePreview && (
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
                            </Box>
                        )}

                        <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
                            {coverImagePreview ? 'Change Cover Image' : 'Upload Cover Image'}
                            <input type="file" hidden accept="image/*" onChange={handleCoverImageChange} />
                        </Button>
                    </Grid>

                    {/* Content Editor */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Content
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Tabs value={editorTab} onChange={handleTabChange} sx={{ mb: 2 }}>
                            <Tab label="Write" />
                            <Tab label="Preview" />
                        </Tabs>

                        {editorTab === 0 ? (
                            <TextField
                                fullWidth
                                multiline
                                minRows={15}
                                maxRows={30}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                                placeholder="Write your blog post content in Markdown format..."
                                sx={{
                                    '& .MuiInputBase-root': {
                                        fontFamily: 'monospace',
                                        fontSize: '0.9rem',
                                    },
                                }}
                            />
                        ) : (
                            <Paper
                                variant="outlined"
                                sx={{ p: 2, minHeight: '300px', maxHeight: '600px', overflow: 'auto' }}
                            >
                                {content ? (
                                    <div className="markdown-preview">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <Typography color="textSecondary" align="center" py={10}>
                                        No content to preview
                                    </Typography>
                                )}
                            </Paper>
                        )}
                    </Grid>

                    {/* Save Button */}
                    <Grid item xs={12}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                            {!isNewPost && (
                                <Box display="flex" alignItems="center">
                                    <Tooltip title="Automatically saves changes after 5 seconds of inactivity">
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={autoSave}
                                                    onChange={handleToggleAutoSave}
                                                    color="primary"
                                                />
                                            }
                                            label="Auto Save"
                                        />
                                    </Tooltip>
                                    {lastSaved && autoSave && (
                                        <Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>
                                            Last saved at {lastSaved}
                                        </Typography>
                                    )}
                                </Box>
                            )}
                            <Box>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/admin/blogs')}
                                    sx={{ mr: 2 }}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    size="large"
                                >
                                    {isSaving ? (
                                        <CircularProgress size={24} />
                                    ) : isNewPost ? (
                                        'Create Blog Post'
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default BlogEditor;
