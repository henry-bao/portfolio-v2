import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Grid,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Paper,
    Typography,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import type { Models } from 'appwrite';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    ALLOWED_IMAGE_TYPES,
    createBlogPost,
    deleteFile,
    getBlogPost,
    getBlogPostBySlug,
    getContentImagePreviewUrl,
    getContentImages,
    STORAGE_BLOGS_BUCKET_ID,
    updateBlogPost,
    updateContentImage,
    uploadContentImage,
} from '../../services/appwrite';
import {
    getBlogDrafts,
    removeBlogDraft,
    upsertBlogDraft,
    type DraftBlogPost,
} from '../../services/blogDraftStorage';
import { useMarkdownEditor } from '../../hooks/useMarkdownEditor';
import { useObjectUrl } from '../../hooks/useObjectUrl';
import { routes } from '../../routes/paths';
import type { BlogPost, BlogPostDocument } from '../../types';
import { buildSlug } from '../../utils/blog';
import { formatLocalDateTime, getTodayInputDate, toInputDate } from '../../utils/dates';
import {
    BlogContentEditor,
    BlogEditorSkeleton,
    BlogMetadata,
    ContentImageDialog,
    CoverImageField,
    EditImageDialog,
    MediaLibraryDialog,
} from './blog';
import './markdown-preview.css';

const AUTOSAVE_DELAY_MS = 1000;
const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(',');

interface EditorSnapshot {
    title: string;
    content: string;
    summary: string;
    slug: string;
    publishedDate: string;
    published: boolean;
    tags: string[];
    isNewPost: boolean;
    postId?: string;
    draftId?: string;
}

const createDraftId = () => `new-${Date.now()}`;

const BlogEditor = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const isNewPost = !postId;

    const [post, setPost] = useState<BlogPostDocument | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editorTab, setEditorTab] = useState(0);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [isDraft, setIsDraft] = useState(isNewPost);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [summary, setSummary] = useState('');
    const [slug, setSlug] = useState('');
    const [publishedDate, setPublishedDate] = useState('');
    const [published, setPublished] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
    const coverImageObjectUrl = useObjectUrl(coverImage);
    const displayedCoverImagePreview = coverImageObjectUrl || coverImagePreview;

    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
    const [contentImage, setContentImage] = useState<File | null>(null);
    const [contentImageName, setContentImageName] = useState('');
    const [isUploadingContentImage, setIsUploadingContentImage] = useState(false);

    const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
    const [contentImages, setContentImages] = useState<Models.File[]>([]);
    const [loadingImages, setLoadingImages] = useState(false);
    const [selectedLibraryImage, setSelectedLibraryImage] = useState<Models.File | null>(null);
    const [imageMenuAnchorEl, setImageMenuAnchorEl] = useState<HTMLElement | null>(null);
    const [targetImageId, setTargetImageId] = useState<string | null>(null);
    const [isEditingImage, setIsEditingImage] = useState(false);
    const [imageToEdit, setImageToEdit] = useState<Models.File | null>(null);
    const [newImageFile, setNewImageFile] = useState<File | null>(null);

    const draftSaveTimerRef = useRef<number | null>(null);
    const stateRef = useRef<EditorSnapshot>({
        title: '',
        content: '',
        summary: '',
        slug: '',
        publishedDate: '',
        published: false,
        tags: [],
        isNewPost,
        postId,
    });

    const { formatMarkdown, insertTextAtCursor, textFieldRef, trackSelectionChange } = useMarkdownEditor(
        content,
        setContent
    );

    useEffect(() => {
        stateRef.current = {
            ...stateRef.current,
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
    }, [content, isNewPost, postId, published, publishedDate, slug, summary, tags, title]);

    const populateFormFromDraft = useCallback((draft: DraftBlogPost) => {
        stateRef.current.draftId = draft.id;

        setTitle(draft.title);
        setContent(draft.content);
        setSummary(draft.summary);
        setSlug(draft.slug);
        setPublishedDate(draft.publishedDate ? toInputDate(draft.publishedDate) : getTodayInputDate());
        setPublished(Boolean(draft.published));
        setTags(draft.tags || []);
        setCoverImagePreview(draft.hasCoverImage && draft.coverImageUrl ? draft.coverImageUrl : null);
        setLastSaved(`Draft last saved: ${formatLocalDateTime(draft.lastSaved)}`);
        setIsDraft(true);
    }, []);

    useEffect(() => {
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
        };

        if (isNewPost) {
            setPublishedDate(getTodayInputDate());

            const urlParams = new URLSearchParams(window.location.search);
            const loadDraft = urlParams.get('loadDraft');
            const draftId = urlParams.get('draftId');

            if (loadDraft === 'true' && draftId) {
                const draft = getBlogDrafts().find((storedDraft) => storedDraft.id === draftId);

                if (draft) {
                    populateFormFromDraft(draft);
                }
            }

            setIsLoading(false);
            return;
        }

        const fetchPost = async () => {
            setIsLoading(true);

            try {
                const postData = await getBlogPost(postId);
                const existingDraft = getBlogDrafts().find((draft) => draft.id === postId);

                setPost(postData);

                if (existingDraft) {
                    populateFormFromDraft(existingDraft);

                    if (!existingDraft.coverImageUrl && postData.coverImageId) {
                        setCoverImagePreview(getContentImagePreviewUrl(postData.coverImageId));
                    }

                    return;
                }

                setTitle(postData.title);
                setContent(postData.content);
                setSummary(postData.summary);
                setSlug(postData.slug);
                setPublishedDate(toInputDate(postData.publishedDate));
                setPublished(Boolean(postData.published));
                setTags(postData.tags || []);
                setCoverImagePreview(postData.coverImageId ? getContentImagePreviewUrl(postData.coverImageId) : null);
                setIsDraft(false);
                stateRef.current.draftId = undefined;
            } catch (error) {
                console.error('Error fetching blog post:', error);
                setError('Failed to load blog post data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPost();
    }, [isNewPost, populateFormFromDraft, postId]);

    const hasUnsavedChanges = useCallback(() => {
        if (!post) {
            return false;
        }

        return (
            title !== post.title ||
            content !== post.content ||
            summary !== post.summary ||
            slug !== post.slug ||
            publishedDate !== toInputDate(post.publishedDate) ||
            published !== post.published ||
            JSON.stringify(tags) !== JSON.stringify(post.tags || []) ||
            (displayedCoverImagePreview === null && Boolean(post.coverImageId)) ||
            coverImage !== null
        );
    }, [content, coverImage, displayedCoverImagePreview, post, published, publishedDate, slug, summary, tags, title]);

    const saveDraftToStorage = useCallback(
        (draft: DraftBlogPost) => {
            const draftId = stateRef.current.draftId || draft.id || createDraftId();
            const draftToSave = { ...draft, id: draftId };

            stateRef.current.draftId = draftId;
            upsertBlogDraft(draftToSave);

            return draftId;
        },
        []
    );

    useEffect(() => {
        if (draftSaveTimerRef.current) {
            window.clearTimeout(draftSaveTimerRef.current);
        }

        draftSaveTimerRef.current = window.setTimeout(() => {
            const state = stateRef.current;
            const hasContentWorthSaving = state.title.trim() || state.content.trim() || state.summary.trim();
            const shouldSaveDraft = isNewPost || (post && hasUnsavedChanges()) || state.draftId;

            if (!shouldSaveDraft || !hasContentWorthSaving) {
                return;
            }

            saveDraftToStorage({
                id: state.draftId || state.postId,
                title: state.title,
                content: state.content,
                summary: state.summary,
                slug: state.slug,
                publishedDate: state.publishedDate,
                tags: state.tags,
                lastSaved: new Date().toISOString(),
                published: state.published,
                hasCoverImage: displayedCoverImagePreview !== null,
                coverImageId: post?.coverImageId,
                coverImageUrl: displayedCoverImagePreview || undefined,
            });

            setLastSaved(`Draft saved: ${formatLocalDateTime(new Date().toISOString())}`);
            setIsDraft(true);
        }, AUTOSAVE_DELAY_MS);

        return () => {
            if (draftSaveTimerRef.current) {
                window.clearTimeout(draftSaveTimerRef.current);
            }
        };
    }, [displayedCoverImagePreview, hasUnsavedChanges, isNewPost, post, saveDraftToStorage]);

    const removeCurrentDraft = useCallback(() => {
        const currentDraftId = stateRef.current.draftId || postId;
        removeBlogDraft(currentDraftId);
        stateRef.current.draftId = undefined;
    }, [postId]);

    const handleCoverImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setError(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
            return;
        }

        setCoverImage(file);
    };

    const handleRemoveCoverImage = () => {
        setCoverImage(null);
        setCoverImagePreview(null);
    };

    const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const newTitle = event.target.value;
        setTitle(newTitle);

        if (!slugManuallyEdited) {
            setSlug(buildSlug(newTitle));
        }
    };

    const handleSlugChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSlug(event.target.value.replace(/\s+/g, '-'));
        setSlugManuallyEdited(true);
    };

    const handleManualSlugGenerate = () => {
        setSlug(buildSlug(title));
        setSlugManuallyEdited(true);
    };

    const handleAddTag = () => {
        const tag = tagInput.trim();

        if (!tag || tags.includes(tag)) {
            return;
        }

        setTags((currentTags) => [...currentTags, tag]);
        setTagInput('');
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags((currentTags) => currentTags.filter((tag) => tag !== tagToRemove));
    };

    const handleDiscardDraft = () => {
        if (!isNewPost && post) {
            setTitle(post.title);
            setContent(post.content);
            setSummary(post.summary);
            setSlug(post.slug);
            setPublishedDate(toInputDate(post.publishedDate));
            setPublished(Boolean(post.published));
            setTags(post.tags || []);
            setCoverImage(null);
            setCoverImagePreview(post.coverImageId ? getContentImagePreviewUrl(post.coverImageId) : null);
        } else {
            setTitle('');
            setContent('');
            setSummary('');
            setSlug('');
            setPublishedDate(getTodayInputDate());
            setPublished(false);
            setTags([]);
            setCoverImage(null);
            setCoverImagePreview(null);
        }

        removeCurrentDraft();
        setLastSaved(null);
        setIsDraft(false);
        setSuccess('Draft discarded');
    };

    const validateForm = useCallback(() => {
        if (!title.trim()) return 'Title is required';
        if (!content.trim()) return 'Content is required';
        if (!summary.trim()) return 'Summary is required';
        if (!slug.trim()) return 'Slug is required';
        if (!publishedDate) return 'Published date is required';
        return null;
    }, [content, publishedDate, slug, summary, title]);

    const handleSave = useCallback(async () => {
        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const existingPost = await getBlogPostBySlug(slug);

            if (isNewPost && existingPost) {
                setError('A blog post with this slug already exists. Please choose a different slug.');
                return;
            }

            if (!isNewPost && existingPost && existingPost.$id !== postId) {
                setError('This slug is already used by another blog post. Please choose a different slug.');
                return;
            }

            let coverImageId = post?.coverImageId;

            if (coverImage) {
                if (coverImageId) {
                    await deleteFile(coverImageId, STORAGE_BLOGS_BUCKET_ID);
                }

                const uploadResult = await uploadContentImage(coverImage);
                coverImageId = uploadResult.fileId;
            } else if (displayedCoverImagePreview === null && coverImageId) {
                await deleteFile(coverImageId, STORAGE_BLOGS_BUCKET_ID);
                coverImageId = undefined;
            }

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

            const result = isNewPost
                ? await createBlogPost(blogData)
                : await updateBlogPost(postId as string, blogData);

            removeCurrentDraft();
            setIsDraft(false);
            setCoverImage(null);
            setCoverImagePreview(result.coverImageId ? getContentImagePreviewUrl(result.coverImageId) : null);
            setSuccess(`Blog post ${isNewPost ? 'created' : 'updated'} successfully`);

            if (isNewPost) {
                navigate(routes.admin.blogEdit(result.$id));
            } else {
                setPost(result as unknown as BlogPostDocument);
            }
        } catch (error) {
            console.error('Error saving blog post:', error);
            setError(`Failed to ${isNewPost ? 'create' : 'update'} blog post`);
        } finally {
            setIsSaving(false);
        }
    }, [
        content,
        coverImage,
        displayedCoverImagePreview,
        isNewPost,
        navigate,
        post?.coverImageId,
        postId,
        published,
        publishedDate,
        removeCurrentDraft,
        slug,
        summary,
        tags,
        title,
        validateForm,
    ]);

    const handleContentImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setContentImage(file);
        setContentImageName(file.name);
    };

    const handleOpenImageDialog = () => {
        setContentImage(null);
        setContentImageName('');
        setIsMediaLibraryOpen(false);
        setIsImageDialogOpen(true);
    };

    const handleInsertContentImage = async () => {
        if (!contentImage) {
            return;
        }

        setIsUploadingContentImage(true);

        try {
            const { url } = await uploadContentImage(contentImage);
            const altText = contentImageName.split('.')[0] || 'image';

            insertTextAtCursor(`![${altText}](${url})`);
            setIsImageDialogOpen(false);
            setSuccess('Image uploaded successfully');
        } catch (error) {
            console.error('Error uploading content image:', error);
            setError(error instanceof Error ? error.message : 'Failed to upload image');
        } finally {
            setIsUploadingContentImage(false);
        }
    };

    const loadContentImages = useCallback(async () => {
        setLoadingImages(true);

        try {
            setContentImages(await getContentImages());
        } catch (error) {
            console.error('Error loading images:', error);
            setError('Failed to load media library');
        } finally {
            setLoadingImages(false);
        }
    }, []);

    useEffect(() => {
        if (isMediaLibraryOpen) {
            loadContentImages();
        }
    }, [isMediaLibraryOpen, loadContentImages]);

    const handleCloseMediaLibrary = () => {
        setIsMediaLibraryOpen(false);
        setSelectedLibraryImage(null);
    };

    const handleInsertLibraryImage = () => {
        if (!selectedLibraryImage) {
            return;
        }

        const url = getContentImagePreviewUrl(selectedLibraryImage.$id);
        const altText = selectedLibraryImage.name.split('.')[0] || 'image';

        insertTextAtCursor(`![${altText}](${url})`);
        handleCloseMediaLibrary();
    };

    const handleImageMenuOpen = (event: React.MouseEvent<HTMLElement>, imageId: string) => {
        setImageMenuAnchorEl(event.currentTarget);
        setTargetImageId(imageId);
    };

    const handleImageMenuClose = () => {
        setImageMenuAnchorEl(null);
        setTargetImageId(null);
    };

    const handleDeleteImage = async () => {
        if (!targetImageId) {
            return;
        }

        try {
            await deleteFile(targetImageId, STORAGE_BLOGS_BUCKET_ID);
            await loadContentImages();
            setSuccess('Image deleted successfully');
        } catch (error) {
            console.error('Error deleting image:', error);
            setError('Failed to delete image');
        } finally {
            handleImageMenuClose();
        }
    };

    const handleOpenEditImage = () => {
        if (!targetImageId) {
            return;
        }

        setImageToEdit(contentImages.find((image) => image.$id === targetImageId) || null);
        setIsEditingImage(true);
        handleImageMenuClose();
    };

    const handleCloseEditImage = () => {
        setIsEditingImage(false);
        setImageToEdit(null);
        setNewImageFile(null);
    };

    const handleNewImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            setNewImageFile(file);
        }
    };

    const handleUpdateImage = async () => {
        if (!imageToEdit || !newImageFile) {
            return;
        }

        try {
            await updateContentImage(imageToEdit.$id, newImageFile);
            await loadContentImages();
            setSuccess('Image updated successfully');
            handleCloseEditImage();
        } catch (error) {
            console.error('Error updating image:', error);
            setError(error instanceof Error ? error.message : 'Failed to update image');
        }
    };

    const renderMarkdownPreview = () =>
        content ? (
            <div className="markdown-preview">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
        ) : (
            <Typography color="textSecondary" align="center" py={10}>
                No content to preview
            </Typography>
        );

    if (isLoading) {
        return <BlogEditorSkeleton />;
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
                    <BlogMetadata
                        title={title}
                        slug={slug}
                        summary={summary}
                        publishedDate={publishedDate}
                        published={published}
                        tags={tags}
                        tagInput={tagInput}
                        onTitleChange={handleTitleChange}
                        onSlugChange={handleSlugChange}
                        onSummaryChange={setSummary}
                        onPublishedDateChange={setPublishedDate}
                        onPublishedChange={setPublished}
                        onTagInputChange={setTagInput}
                        onManualSlugGenerate={handleManualSlugGenerate}
                        onTagAdd={handleAddTag}
                        onTagRemove={handleRemoveTag}
                    />

                    <CoverImageField
                        accept={IMAGE_ACCEPT}
                        coverImagePreview={displayedCoverImagePreview}
                        onImageChange={handleCoverImageChange}
                        onRemove={handleRemoveCoverImage}
                    />

                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Content
                        </Typography>
                        <BlogContentEditor
                            content={content}
                            editorTab={editorTab}
                            inputRef={textFieldRef}
                            onContentChange={setContent}
                            onFormatText={formatMarkdown}
                            onInsertImage={handleOpenImageDialog}
                            onOpenMediaLibrary={() => setIsMediaLibraryOpen(true)}
                            onTabChange={(_event, newValue) => setEditorTab(newValue)}
                            onTrackSelection={trackSelectionChange}
                            renderMarkdownPreview={renderMarkdownPreview}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                            <Box>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate(routes.admin.blogs)}
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

                            {isDraft && lastSaved && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">
                                        {lastSaved}
                                    </Typography>
                                    <Button size="small" onClick={handleDiscardDraft} sx={{ ml: 1 }}>
                                        Discard
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            <ContentImageDialog
                accept={IMAGE_ACCEPT}
                image={contentImage}
                isUploading={isUploadingContentImage}
                open={isImageDialogOpen}
                onClose={() => setIsImageDialogOpen(false)}
                onImageChange={handleContentImageChange}
                onInsert={handleInsertContentImage}
            />

            <MediaLibraryDialog
                images={contentImages}
                loading={loadingImages}
                open={isMediaLibraryOpen}
                selectedImage={selectedLibraryImage}
                getImageUrl={getContentImagePreviewUrl}
                onClose={handleCloseMediaLibrary}
                onImageMenuOpen={handleImageMenuOpen}
                onInsert={handleInsertLibraryImage}
                onOpenUploadDialog={handleOpenImageDialog}
                onSelectImage={setSelectedLibraryImage}
            />

            <Menu anchorEl={imageMenuAnchorEl} open={Boolean(imageMenuAnchorEl)} onClose={handleImageMenuClose}>
                <MenuItem onClick={handleOpenEditImage}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Edit</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleDeleteImage}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>

            <EditImageDialog
                accept={IMAGE_ACCEPT}
                imageToEdit={imageToEdit}
                newImageFile={newImageFile}
                open={isEditingImage}
                getImageUrl={getContentImagePreviewUrl}
                onClose={handleCloseEditImage}
                onFileChange={handleNewImageSelect}
                onUpdate={handleUpdateImage}
            />
        </Box>
    );
};

export default BlogEditor;
