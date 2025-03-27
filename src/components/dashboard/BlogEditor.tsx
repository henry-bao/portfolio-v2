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
} from '@mui/material';
import { Upload as UploadIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Models } from 'appwrite';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getBlogPost, createBlogPost, updateBlogPost, uploadFile, deleteFile, BlogPost } from '../../services/appwrite';
import { getFilePreviewUrl } from '../../services/fileProxy';
import './markdown-preview.css';

// Type for draft blog post
interface DraftBlogPost {
    id?: string; // This will be undefined for new drafts, or the postId for existing posts being edited
    title: string;
    content: string;
    summary: string;
    slug: string;
    publishedDate: string;
    tags: string[];
    lastSaved: string;
    published: boolean;
    hasCoverImage: boolean;
    coverImageId?: string; // Store the image ID if it exists
    coverImageUrl?: string; // Store the preview URL for restoring
}

const DRAFTS_STORAGE_KEY = 'blog_drafts';

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
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [isDraft, setIsDraft] = useState(isNewPost);

    // Store latest state in refs to avoid dependency issues
    const stateRef = useRef({
        title: '',
        content: '',
        summary: '',
        slug: '',
        publishedDate: '',
        published: false,
        tags: [] as string[],
        isNewPost,
        postId,
        draftId: undefined as string | undefined,
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

    // Draft saving timer
    const draftSaveTimerRef = useRef<number | null>(null);

    // Update ref when state changes
    useEffect(() => {
        stateRef.current = {
            ...stateRef.current, // Preserve existing properties, especially draftId
            title,
            content,
            summary,
            slug,
            publishedDate,
            published,
            tags,
            isNewPost,
            postId,
        };
    }, [title, content, summary, slug, publishedDate, published, tags, isNewPost, postId]);

    // Check for existing drafts
    useEffect(() => {
        // Initialize the reference object with default values
        stateRef.current = {
            ...stateRef.current,
            title: '',
            content: '',
            summary: '',
            slug: '',
            publishedDate: '',
            published: false,
            tags: [],
            isNewPost,
            postId,
            // Don't reset draftId here, in case it already exists
        };

        if (isNewPost) {
            // Set default values for new post
            setPublishedDate(new Date().toISOString().split('T')[0]);

            // For new posts, we always want to create a fresh editor state
            // We'll only load a draft if specifically requested to do so
            const urlParams = new URLSearchParams(window.location.search);
            const loadDraft = urlParams.get('loadDraft');
            const draftId = urlParams.get('draftId');

            if (loadDraft === 'true' && draftId) {
                // Load a specific draft by ID
                const drafts = getDraftsFromStorage();
                const specificDraft = drafts.find((draft) => draft.id === draftId);

                if (specificDraft) {
                    // Store the draft ID in stateRef FIRST, before any autosave can happen
                    stateRef.current.draftId = specificDraft.id;
                    console.log('Loaded draft ID from URL param:', specificDraft.id);

                    // Populate form with draft data
                    setTitle(specificDraft.title);
                    setContent(specificDraft.content);
                    setSummary(specificDraft.summary);
                    setSlug(specificDraft.slug);
                    if (specificDraft.publishedDate) {
                        setPublishedDate(specificDraft.publishedDate);
                    }
                    setTags(specificDraft.tags || []);
                    // Set published status if available
                    if (specificDraft.published !== undefined) {
                        setPublished(specificDraft.published);
                    }
                    // Restore cover image if it was saved in the draft
                    if (specificDraft.hasCoverImage && specificDraft.coverImageUrl) {
                        setCoverImagePreview(specificDraft.coverImageUrl);
                    }
                    setLastSaved(`Draft last saved: ${new Date(specificDraft.lastSaved).toLocaleString()}`);
                    setIsDraft(true);
                }
            }

            setIsLoading(false);
            return;
        }

        const fetchPost = async () => {
            setIsLoading(true);
            try {
                const postData = await getBlogPost(postId as string);
                setPost(postData);

                // Check for draft version of this post
                const drafts = getDraftsFromStorage();
                // For existing posts, we need to check if there's a draft with the same ID as the post
                const existingDraft = drafts.find((draft) => draft.id === postId);

                if (existingDraft) {
                    // Store the draft ID in stateRef FIRST, before any autosave can happen
                    stateRef.current.draftId = existingDraft.id;
                    console.log('Loaded existing draft ID:', existingDraft.id);

                    // Use draft data
                    setTitle(existingDraft.title);
                    setContent(existingDraft.content);
                    setSummary(existingDraft.summary);
                    setSlug(existingDraft.slug);
                    if (existingDraft.publishedDate) {
                        setPublishedDate(existingDraft.publishedDate.split('T')[0]);
                    } else {
                        setPublishedDate(postData.publishedDate.split('T')[0]);
                    }
                    setTags(existingDraft.tags || []);
                    // Set published status if available
                    if (existingDraft.published !== undefined) {
                        setPublished(existingDraft.published);
                    }
                    // Restore cover image if it was saved in the draft
                    if (existingDraft.hasCoverImage && existingDraft.coverImageUrl) {
                        setCoverImagePreview(existingDraft.coverImageUrl);
                    } else if (postData.coverImageId) {
                        // Fall back to the post's cover image if the draft doesn't have one
                        const imageUrl = getFilePreviewUrl(postData.coverImageId);
                        setCoverImagePreview(imageUrl);
                    }
                    setLastSaved(`Draft last saved: ${new Date(existingDraft.lastSaved).toLocaleString()}`);
                    setIsDraft(true);
                } else {
                    // Populate form fields with database data
                    setTitle(postData.title);
                    setContent(postData.content);
                    setSummary(postData.summary);
                    setSlug(postData.slug);
                    setPublishedDate(postData.publishedDate.split('T')[0]);
                    setPublished(postData.published || false);
                    setIsDraft(false);
                    stateRef.current.draftId = undefined;

                    if (postData.tags) {
                        setTags(postData.tags);
                    }

                    // Load cover image preview if exists
                    if (postData.coverImageId) {
                        const imageUrl = getFilePreviewUrl(postData.coverImageId);
                        setCoverImagePreview(imageUrl);
                    }
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

    // Check if current state differs from the original post
    const hasUnsavedChanges = useCallback(() => {
        if (!post) return false;

        // Check if any of the fields have changed
        return (
            title !== post.title ||
            content !== post.content ||
            summary !== post.summary ||
            slug !== post.slug ||
            publishedDate !== post.publishedDate.split('T')[0] ||
            published !== post.published ||
            JSON.stringify(tags) !== JSON.stringify(post.tags || []) ||
            (coverImagePreview === null && post.coverImageId) ||
            coverImage !== null
        );
    }, [post, title, content, summary, slug, publishedDate, published, tags, coverImagePreview, coverImage]);

    // Updated draft saving logic to track changes to published posts
    useEffect(() => {
        const saveDraftToStorage = (draft: DraftBlogPost) => {
            const drafts = getDraftsFromStorage();

            // CRITICAL FIX: Log the current draftId for debugging
            console.log('Current draftId in stateRef:', stateRef.current.draftId);

            // First determine the correct ID to use for this draft
            let draftId: string;

            // Priority order for draft ID:
            // 1. Use stateRef.current.draftId if it exists (this persists across renders)
            // 2. Use draft.id if it exists (for drafts of existing posts)
            // 3. Generate a new ID if neither exists (for brand new drafts)
            if (stateRef.current.draftId) {
                draftId = stateRef.current.draftId;
                console.log('Using existing draftId from stateRef:', draftId);
            } else if (draft.id) {
                draftId = draft.id;
                console.log('Using draft.id:', draftId);
            } else {
                draftId = `new-${Date.now()}`;
                console.log('Generated new draftId:', draftId);
            }

            // Save the draftId to stateRef for later use
            stateRef.current.draftId = draftId;
            console.log('Updated draftId in stateRef:', stateRef.current.draftId);

            // Find if this draft already exists in localStorage
            const draftIndex = drafts.findIndex((d) => d.id === draftId);
            console.log('Draft exists in storage?', draftIndex >= 0 ? 'Yes' : 'No');

            // Create a draft object with the consistent ID
            const draftToSave = {
                ...draft,
                id: draftId,
            };

            // Update or add the draft
            if (draftIndex >= 0) {
                drafts[draftIndex] = draftToSave;
            } else {
                drafts.push(draftToSave);
            }

            localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
            return draftId;
        };
        // Setup automatic draft saving
        const saveDraft = () => {
            const state = stateRef.current;

            // For debugging
            console.log('AutoSave trigger - current draftId:', state.draftId);

            // Check if we should save as draft
            const shouldSaveDraft = isNewPost || (post && hasUnsavedChanges()) || stateRef.current.draftId;

            if (shouldSaveDraft && (state.title.trim() || state.content.trim() || state.summary.trim())) {
                const draft: DraftBlogPost = {
                    id: state.draftId || state.postId || undefined, // Use draftId if available, otherwise postId
                    title: state.title,
                    content: state.content,
                    summary: state.summary,
                    slug: state.slug,
                    publishedDate: state.publishedDate,
                    tags: state.tags,
                    lastSaved: new Date().toISOString(),
                    published: state.published,
                    hasCoverImage: coverImagePreview !== null,
                    coverImageId: post?.coverImageId, // Save existing image ID
                    coverImageUrl: coverImagePreview || undefined, // Save the current preview URL
                };

                const savedDraftId = saveDraftToStorage(draft);
                console.log('Draft saved with ID:', savedDraftId);

                setLastSaved(`Draft saved: ${new Date().toLocaleString()}`);
                setIsDraft(true);
            }
        };

        // Clear any existing timeout
        if (draftSaveTimerRef.current) {
            window.clearTimeout(draftSaveTimerRef.current);
        }

        // Set new timeout for draft saving (1 seconds after last change)
        draftSaveTimerRef.current = window.setTimeout(saveDraft, 1000);

        return () => {
            if (draftSaveTimerRef.current) {
                window.clearTimeout(draftSaveTimerRef.current);
            }
        };
    }, [
        title,
        content,
        summary,
        slug,
        tags,
        publishedDate,
        published,
        isNewPost,
        post,
        hasUnsavedChanges,
        coverImagePreview,
    ]);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (draftSaveTimerRef.current) {
                window.clearTimeout(draftSaveTimerRef.current);
            }
        };
    }, []);

    // Functions to handle localStorage drafts
    const getDraftsFromStorage = (): DraftBlogPost[] => {
        const draftsJson = localStorage.getItem(DRAFTS_STORAGE_KEY);
        return draftsJson ? JSON.parse(draftsJson) : [];
    };

    const removeDraftFromStorage = useCallback(() => {
        // Only remove the current draft, leave others intact
        const drafts = getDraftsFromStorage();

        // We need to know which ID to use - either the draftId stored in stateRef or the postId
        const currentDraftId = stateRef.current.draftId || postId;
        console.log('Removing draft with ID:', currentDraftId);

        // Filter out only the current draft
        const filteredDrafts = drafts.filter((d) => d.id !== currentDraftId);

        localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(filteredDrafts));

        // Clear the draftId in stateRef after removal
        stateRef.current.draftId = undefined;
    }, [postId]);

    const handleCoverImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setCoverImage(file);
            setCoverImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveCoverImage = () => {
        setCoverImage(null);
        setCoverImagePreview(null);
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

    const handleDiscardDraft = () => {
        // If editing existing post, revert to the database version
        if (!isNewPost && post) {
            setTitle(post.title);
            setContent(post.content);
            setSummary(post.summary);
            setSlug(post.slug);
            setPublishedDate(post.publishedDate.split('T')[0]);
            setPublished(post.published || false);

            if (post.tags) {
                setTags(post.tags);
            } else {
                setTags([]);
            }

            // Load cover image preview if exists
            if (post.coverImageId) {
                const imageUrl = getFilePreviewUrl(post.coverImageId);
                setCoverImagePreview(imageUrl);
            } else {
                setCoverImagePreview(null);
            }
        } else {
            // For new post, clear all fields
            setTitle('');
            setContent('');
            setSummary('');
            setSlug('');
            setPublishedDate(new Date().toISOString().split('T')[0]);
            setPublished(false);
            setTags([]);
            setCoverImagePreview(null);
            setCoverImage(null);
        }

        // Remove draft from storage
        removeDraftFromStorage();
        setLastSaved(null);
        setIsDraft(false);
        setSuccess('Draft discarded');
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
            } else if (coverImagePreview === null && coverImageId) {
                // User removed the cover image
                await deleteFile(coverImageId);
                coverImageId = undefined;
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
                setSuccess('Blog post updated successfully');
            }

            // Remove the draft from localStorage
            if (stateRef.current.draftId) {
                removeDraftFromStorage();
                setIsDraft(false);
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
        title,
        content,
        summary,
        slug,
        publishedDate,
        post?.coverImageId,
        coverImage,
        coverImagePreview,
        published,
        tags,
        isNewPost,
        postId,
        removeDraftFromStorage,
        navigate,
    ]);

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

            {isDraft && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    {lastSaved && (
                        <>
                            {lastSaved}
                            <Button size="small" onClick={handleDiscardDraft} sx={{ ml: 2 }}>
                                Discard Draft
                            </Button>
                        </>
                    )}
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
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={handleRemoveCoverImage}
                                    size="small"
                                >
                                    Remove Image
                                </Button>
                            </Box>
                        )}

                        {!coverImagePreview && (
                            <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
                                Upload Cover Image
                                <input type="file" hidden accept="image/*" onChange={handleCoverImageChange} />
                            </Button>
                        )}
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
