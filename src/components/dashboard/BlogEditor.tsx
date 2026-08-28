import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
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
import { createBlogPost, getBlogPost, getBlogPostBySlug, updateBlogPost } from '../../services/blogService';
import {
    ALLOWED_IMAGE_TYPES,
    deleteContentImage,
    getContentImagePreviewUrl,
    getContentImages,
    updateContentImage,
    uploadContentImage,
} from '../../services/storageService';
import { getBlogDrafts, removeBlogDraft, upsertBlogDraft } from '../../services/blogDraftStorage';
import type { DraftBlogPost } from '../../services/blogDraftStorage';
import { useImagePreview, useMarkdownEditor } from '../../hooks';
import { routes } from '../../routes/paths';
import type { BlogPost, BlogPostDocument } from '../../types';
import { buildSlug } from '../../utils/blog';
import { formatLocalDateTime, getTodayInputDate, toInputDate } from '../../utils/dates';
import { StatusAlerts } from '../shared';
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

const createDraftId = () => `new-${Date.now()}`;

const BlogEditor = () => {
    const { postId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isNewPost = !postId;

    const [post, setPost] = useState<BlogPostDocument | null>(null);
    const [isLoading, setIsLoading] = useState(!isNewPost);
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
    const [publishedDate, setPublishedDate] = useState(getTodayInputDate());
    const [published, setPublished] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    const coverImage = useImagePreview();
    const { setRemoteUrl: setCoverImageRemoteUrl, clear: clearCoverImage } = coverImage;

    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
    const [contentImage, setContentImage] = useState<File | null>(null);
    const [isUploadingContentImage, setIsUploadingContentImage] = useState(false);

    const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
    const [contentImages, setContentImages] = useState<Models.File[]>([]);
    const [loadingImages, setLoadingImages] = useState(false);
    const [selectedLibraryImage, setSelectedLibraryImage] = useState<Models.File | null>(null);
    const [imageMenuAnchorEl, setImageMenuAnchorEl] = useState<HTMLElement | null>(null);
    const [targetImageId, setTargetImageId] = useState<string | null>(null);
    const [imageToEdit, setImageToEdit] = useState<Models.File | null>(null);
    const [newImageFile, setNewImageFile] = useState<File | null>(null);

    /** Id of the locally autosaved draft; `undefined` once it has been saved to the database. */
    const draftIdRef = useRef<string | undefined>(undefined);

    const { formatMarkdown, insertTextAtCursor, textFieldRef, trackSelectionChange } = useMarkdownEditor(
        content,
        setContent
    );

    const applyDraft = useCallback(
        (draft: DraftBlogPost) => {
            draftIdRef.current = draft.id;

            setTitle(draft.title);
            setContent(draft.content);
            setSummary(draft.summary);
            setSlug(draft.slug);
            setPublishedDate(draft.publishedDate ? toInputDate(draft.publishedDate) : getTodayInputDate());
            setPublished(Boolean(draft.published));
            setTags(draft.tags || []);
            setCoverImageRemoteUrl(draft.hasCoverImage && draft.coverImageUrl ? draft.coverImageUrl : null);
            setLastSaved(`Draft last saved: ${formatLocalDateTime(draft.lastSaved)}`);
            setIsDraft(true);
        },
        [setCoverImageRemoteUrl]
    );

    const requestedDraftId = searchParams.get('loadDraft') === 'true' ? searchParams.get('draftId') : null;

    useEffect(() => {
        draftIdRef.current = undefined;

        if (isNewPost) {
            const draft = requestedDraftId
                ? getBlogDrafts().find((storedDraft) => storedDraft.id === requestedDraftId)
                : undefined;

            if (draft) {
                applyDraft(draft);
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
                    applyDraft(existingDraft);

                    if (!existingDraft.coverImageUrl && postData.coverImageId) {
                        setCoverImageRemoteUrl(getContentImagePreviewUrl(postData.coverImageId));
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
                setCoverImageRemoteUrl(
                    postData.coverImageId ? getContentImagePreviewUrl(postData.coverImageId) : null
                );
                setIsDraft(false);
            } catch (error) {
                console.error('Error fetching blog post:', error);
                setError('Failed to load blog post data');
            } finally {
                setIsLoading(false);
            }
        };

        void fetchPost();
    }, [applyDraft, isNewPost, postId, requestedDraftId, setCoverImageRemoteUrl]);

    const coverImagePreview = coverImage.previewUrl;
    const hasUnsavedChanges =
        Boolean(post) &&
        (title !== post?.title ||
            content !== post?.content ||
            summary !== post?.summary ||
            slug !== post?.slug ||
            publishedDate !== toInputDate(post?.publishedDate ?? '') ||
            published !== post?.published ||
            JSON.stringify(tags) !== JSON.stringify(post?.tags || []) ||
            (coverImagePreview === null && Boolean(post?.coverImageId)) ||
            coverImage.file !== null);

    useEffect(() => {
        const hasContentWorthSaving = title.trim() || content.trim() || summary.trim();
        const shouldSaveDraft = isNewPost || hasUnsavedChanges || draftIdRef.current;

        if (!shouldSaveDraft || !hasContentWorthSaving) {
            return;
        }

        const timer = window.setTimeout(() => {
            const draftId = draftIdRef.current ?? postId ?? createDraftId();
            const lastSavedAt = new Date().toISOString();

            draftIdRef.current = draftId;
            upsertBlogDraft({
                id: draftId,
                title,
                content,
                summary,
                slug,
                publishedDate,
                published,
                tags,
                lastSaved: lastSavedAt,
                hasCoverImage: coverImagePreview !== null,
                coverImageId: post?.coverImageId,
                coverImageUrl: coverImagePreview || undefined,
            });

            setLastSaved(`Draft saved: ${formatLocalDateTime(lastSavedAt)}`);
            setIsDraft(true);
        }, AUTOSAVE_DELAY_MS);

        return () => window.clearTimeout(timer);
    }, [
        content,
        coverImagePreview,
        hasUnsavedChanges,
        isNewPost,
        post?.coverImageId,
        postId,
        published,
        publishedDate,
        slug,
        summary,
        tags,
        title,
    ]);

    const removeCurrentDraft = useCallback(() => {
        removeBlogDraft(draftIdRef.current ?? postId);
        draftIdRef.current = undefined;
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

        coverImage.setFile(file);
    };

    const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setTitle(event.target.value);

        if (!slugManuallyEdited) {
            setSlug(buildSlug(event.target.value));
        }
    };

    const handleAddTag = () => {
        const tag = tagInput.trim();

        if (!tag || tags.includes(tag)) {
            return;
        }

        setTags((currentTags) => [...currentTags, tag]);
        setTagInput('');
    };

    const handleDiscardDraft = () => {
        if (post) {
            setTitle(post.title);
            setContent(post.content);
            setSummary(post.summary);
            setSlug(post.slug);
            setPublishedDate(toInputDate(post.publishedDate));
            setPublished(Boolean(post.published));
            setTags(post.tags || []);
            coverImage.setFile(null);
            setCoverImageRemoteUrl(post.coverImageId ? getContentImagePreviewUrl(post.coverImageId) : null);
        } else {
            setTitle('');
            setContent('');
            setSummary('');
            setSlug('');
            setPublishedDate(getTodayInputDate());
            setPublished(false);
            setTags([]);
            clearCoverImage();
        }

        removeCurrentDraft();
        setLastSaved(null);
        setIsDraft(false);
        setSuccess('Draft discarded');
    };

    const validateForm = () => {
        if (!title.trim()) return 'Title is required';
        if (!content.trim()) return 'Content is required';
        if (!summary.trim()) return 'Summary is required';
        if (!slug.trim()) return 'Slug is required';
        if (!publishedDate) return 'Published date is required';
        return null;
    };

    const handleSave = async () => {
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

            if (existingPost && existingPost.$id !== postId) {
                setError('This slug is already used by another blog post. Please choose a different slug.');
                return;
            }

            let coverImageId = post?.coverImageId;

            if (coverImage.file) {
                if (coverImageId) {
                    await deleteContentImage(coverImageId);
                }

                coverImageId = (await uploadContentImage(coverImage.file)).fileId;
            } else if (coverImagePreview === null && coverImageId) {
                await deleteContentImage(coverImageId);
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

            const result = isNewPost ? await createBlogPost(blogData) : await updateBlogPost(postId, blogData);

            removeCurrentDraft();
            setIsDraft(false);
            coverImage.setFile(null);
            setCoverImageRemoteUrl(result.coverImageId ? getContentImagePreviewUrl(result.coverImageId) : null);
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
    };

    const handleOpenImageDialog = () => {
        setContentImage(null);
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

            insertTextAtCursor(`![${contentImage.name.split('.')[0] || 'image'}](${url})`);
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
            void loadContentImages();
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

        insertTextAtCursor(`![${selectedLibraryImage.name.split('.')[0] || 'image'}](${url})`);
        handleCloseMediaLibrary();
    };

    const handleImageMenuOpen = (event: MouseEvent<HTMLElement>, imageId: string) => {
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
            await deleteContentImage(targetImageId);
            await loadContentImages();
            setSuccess('Image deleted successfully');
        } catch (error) {
            console.error('Error deleting image:', error);
            setError('Failed to delete image');
        } finally {
            handleImageMenuClose();
        }
    };

    const handleCloseEditImage = () => {
        setImageToEdit(null);
        setNewImageFile(null);
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

            <StatusAlerts error={error} success={success} />

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
                        onSlugChange={(event) => {
                            setSlug(event.target.value.replace(/\s+/g, '-'));
                            setSlugManuallyEdited(true);
                        }}
                        onSummaryChange={setSummary}
                        onPublishedDateChange={setPublishedDate}
                        onPublishedChange={setPublished}
                        onTagInputChange={setTagInput}
                        onManualSlugGenerate={() => {
                            setSlug(buildSlug(title));
                            setSlugManuallyEdited(true);
                        }}
                        onTagAdd={handleAddTag}
                        onTagRemove={(tagToRemove) =>
                            setTags((currentTags) => currentTags.filter((tag) => tag !== tagToRemove))
                        }
                    />

                    <CoverImageField
                        accept={IMAGE_ACCEPT}
                        coverImagePreview={coverImagePreview}
                        onImageChange={handleCoverImageChange}
                        onRemove={clearCoverImage}
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
                onImageChange={(event) => setContentImage(event.target.files?.[0] ?? null)}
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
                <MenuItem
                    onClick={() => {
                        setImageToEdit(contentImages.find((image) => image.$id === targetImageId) || null);
                        handleImageMenuClose();
                    }}
                >
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
                open={Boolean(imageToEdit)}
                getImageUrl={getContentImagePreviewUrl}
                onClose={handleCloseEditImage}
                onFileChange={(event) => setNewImageFile(event.target.files?.[0] ?? null)}
                onUpdate={handleUpdateImage}
            />
        </Box>
    );
};

export default BlogEditor;
