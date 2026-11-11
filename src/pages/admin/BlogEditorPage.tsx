import { useCallback, useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Grid, Paper, Typography } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { blogApi, draftsApi, fileUrl, getErrorMessage, getFieldErrors, isApiError, validateFile } from '../../api';
import type { BlogPost } from '../../api';
import { useNotify } from '../../app/notifications/useNotify';
import { routes } from '../../app/routes';
import { StatusAlerts } from '../../components/admin/StatusAlerts';
import {
    BlogContentEditor,
    BlogEditorSkeleton,
    BlogMetadata,
    ContentImageDialog,
    CoverImageField,
    MediaLibraryDialog,
} from '../../components/admin/blog';
import type { EditorTab } from '../../components/admin/blog';
import {
    emptyFormValues,
    formValuesFromDraft,
    formValuesFromPost,
    hasWrittenAnything,
    isSlugManual,
    sameFormValues,
} from '../../components/admin/blog/blogForm';
import type { BlogFormValues } from '../../components/admin/blog/blogForm';
import { useFileField, useMarkdownEditor } from '../../hooks';
import { formatLocalDateTime } from '../../lib/dates';
import { usePost, useSavePost } from '../../queries';

const AUTOSAVE_DELAY_MS = 1000;

/** /admin/blogs/edit/:postId edits a saved post; /admin/blogs/new[?draft=<id>] writes a new one. */
const BlogEditorPage = () => {
    const { postId } = useParams<{ postId: string }>();
    const [searchParams] = useSearchParams();

    return postId ? (
        <ExistingPostEditor postId={postId} />
    ) : (
        <NewPostEditor requestedDraftId={searchParams.get('draft')} />
    );
};

export default BlogEditorPage;

function ExistingPostEditor({ postId }: { postId: string }) {
    const post = usePost(postId);

    if (post.isPending) {
        return <BlogEditorSkeleton />;
    }

    if (post.isError) {
        return <LoadFailure error={post.error} onRetry={() => void post.refetch()} />;
    }

    return <BlogEditorForm key={postId} initialPost={post.data} draftId={postId} isDraftInUrl />;
}

function NewPostEditor({ requestedDraftId }: { requestedDraftId: string | null }) {
    const [generatedDraftId] = useState(draftsApi.newDraftId);
    // Only accept ids of never-saved drafts here; a saved post's id belongs to its edit page.
    const requested = requestedDraftId && draftsApi.postIdOfDraft(requestedDraftId) === null ? requestedDraftId : null;
    const draftId = requested ?? generatedDraftId;

    return <BlogEditorForm key={draftId} initialPost={null} draftId={draftId} isDraftInUrl={Boolean(requested)} />;
}

function LoadFailure({ error, onRetry }: { error: unknown; onRetry: () => void }) {
    if (isApiError(error, 'not_found')) {
        return (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                    This post doesn't exist
                </Typography>
                <Typography color="textSecondary" sx={{ mb: 3 }}>
                    It may have been deleted.
                </Typography>
                <Button variant="contained" component={RouterLink} to={routes.admin.blogs}>
                    Back to Blog Posts
                </Button>
            </Paper>
        );
    }

    return (
        <Alert
            severity="error"
            action={
                <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={onRetry}>
                    Retry
                </Button>
            }
        >
            {getErrorMessage(error)}
        </Alert>
    );
}

interface BlogEditorFormProps {
    /** `null` when writing a new post. */
    initialPost: BlogPost | null;
    /** Where autosaved drafts go: the post's id, or a `new-…` id for a post that was never saved. */
    draftId: string;
    /** Whether the URL already identifies this draft (so a reload restores it). */
    isDraftInUrl: boolean;
}

function BlogEditorForm({ initialPost, draftId, isDraftInUrl }: BlogEditorFormProps) {
    const navigate = useNavigate();
    const notify = useNotify();
    const save = useSavePost();
    const isNew = initialPost === null;

    const [initialDraft] = useState(() => draftsApi.getDraft(draftId));
    // The version this editor started from. It only changes when this editor saves, so a background
    // refetch can't hide someone else's edits from the conflict check.
    const [savedPost, setSavedPost] = useState(initialPost);
    const [values, setValues] = useState<BlogFormValues>(() =>
        initialDraft ? formValuesFromDraft(initialDraft) : initialPost ? formValuesFromPost(initialPost) : emptyFormValues()
    );
    const [slugIsManual, setSlugIsManual] = useState(() => isSlugManual(initialPost, initialDraft));
    const [draftSavedAt, setDraftSavedAt] = useState(initialDraft?.lastSaved ?? null);
    const [tab, setTab] = useState<EditorTab>('write');
    const [openDialog, setOpenDialog] = useState<'upload' | 'library' | null>(null);
    const cover = useFileField(
        fileUrl(savedPost?.coverImageId ?? null),
        initialDraft?.removeCover ? { type: 'remove' } : undefined
    );

    const autosaveTimer = useRef<number | undefined>(undefined);
    const warnedStorageFull = useRef(false);

    const removeCover = cover.change.type === 'remove';
    const isDirty = savedPost
        ? !sameFormValues(values, formValuesFromPost(savedPost)) || (removeCover && Boolean(savedPost.coverImageId))
        : hasWrittenAnything(values);

    useEffect(() => {
        if (!isDirty) {
            return;
        }

        const timer = window.setTimeout(() => {
            const lastSaved = new Date().toISOString();

            if (!draftsApi.saveDraft({ id: draftId, ...values, removeCover, lastSaved })) {
                if (!warnedStorageFull.current) {
                    warnedStorageFull.current = true;
                    notify.info("Couldn't keep a local draft (browser storage is full or blocked). Save the post to keep your changes.");
                }
                return;
            }

            setDraftSavedAt(lastSaved);

            if (!isDraftInUrl) {
                navigate(routes.admin.blogNewFromDraft(draftId), { replace: true });
            }
        }, AUTOSAVE_DELAY_MS);

        autosaveTimer.current = timer;
        return () => window.clearTimeout(timer);
    }, [draftId, isDirty, isDraftInUrl, navigate, notify, removeCover, values]);

    const update = (changes: Partial<BlogFormValues>) => setValues((current) => ({ ...current, ...changes }));
    const setContent = useCallback((content: string) => setValues((current) => ({ ...current, content })), []);
    const { formatMarkdown, insertTextAtCursor, textFieldRef, trackSelectionChange } = useMarkdownEditor(
        values.content,
        setContent
    );

    const handleTitleChange = (title: string) =>
        setValues((current) => ({ ...current, title, slug: slugIsManual ? current.slug : blogApi.slugify(title) }));

    const handleSlugChange = (slug: string) => {
        // Clearing the slug hands it back to the title.
        setSlugIsManual(slug !== '');
        update({ slug: slug.toLowerCase().replace(/\s+/g, '-') });
    };

    const handleGenerateSlug = () => {
        setSlugIsManual(true);
        setValues((current) => ({ ...current, slug: blogApi.slugify(current.title) }));
    };

    const handleCoverPick = (file: File) => {
        const invalid = validateFile(file, 'image');

        if (invalid) {
            notify.error(invalid);
            return;
        }

        cover.pick(file);
    };

    const handleSave = () => {
        const submitted = values;

        save.mutate(
            { current: savedPost, values: submitted, cover: cover.change },
            {
                onSuccess: (saved) => {
                    if (!saved) {
                        return;
                    }

                    // A pending autosave would otherwise recreate the draft we're about to delete.
                    window.clearTimeout(autosaveTimer.current);
                    draftsApi.deleteDraft(draftId);
                    cover.reset();
                    setDraftSavedAt(null);
                    notify.success(isNew ? 'Post created' : 'Post saved');

                    if (isNew) {
                        navigate(routes.admin.blogEdit(saved.$id), { replace: true });
                        return;
                    }

                    setSavedPost(saved);
                    // Show the saved (trimmed, de-duplicated) values, unless the user kept typing meanwhile.
                    setValues((current) => (sameFormValues(current, submitted) ? formValuesFromPost(saved) : current));
                },
            }
        );
    };

    const handleDiscard = () => {
        window.clearTimeout(autosaveTimer.current);
        draftsApi.deleteDraft(draftId);
        setValues(savedPost ? formValuesFromPost(savedPost) : emptyFormValues());
        setSlugIsManual(Boolean(savedPost));
        cover.reset();
        setDraftSavedAt(null);
        save.reset();
        notify.info('Draft discarded');
    };

    const fieldErrors = getFieldErrors(save.error);

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                {isNew ? 'Create New Blog Post' : 'Edit Blog Post'}
            </Typography>

            <StatusAlerts error={save.error ? getErrorMessage(save.error) : undefined} />

            <Paper sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    <BlogMetadata
                        values={values}
                        errors={fieldErrors}
                        onChange={update}
                        onTitleChange={handleTitleChange}
                        onSlugChange={handleSlugChange}
                        onGenerateSlug={handleGenerateSlug}
                    />

                    <CoverImageField previewUrl={cover.previewUrl} onPick={handleCoverPick} onRemove={cover.remove} />

                    <Grid size={12}>
                        <Typography variant="h6" gutterBottom>
                            Content
                        </Typography>
                        <BlogContentEditor
                            content={values.content}
                            error={fieldErrors.content}
                            tab={tab}
                            inputRef={textFieldRef}
                            onContentChange={setContent}
                            onTabChange={setTab}
                            onFormatText={formatMarkdown}
                            onTrackSelection={trackSelectionChange}
                            onInsertImage={() => setOpenDialog('upload')}
                            onOpenMediaLibrary={() => setOpenDialog('library')}
                        />
                    </Grid>

                    <Grid size={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                            <Box>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate(routes.admin.blogs)}
                                    sx={{ mr: 2 }}
                                    disabled={save.isPending}
                                >
                                    Cancel
                                </Button>
                                <Button variant="contained" onClick={handleSave} disabled={save.isPending} size="large">
                                    {save.isPending ? <CircularProgress size={24} /> : isNew ? 'Create Blog Post' : 'Save Changes'}
                                </Button>
                            </Box>

                            {draftSavedAt && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Draft saved {formatLocalDateTime(draftSavedAt)}
                                    </Typography>
                                    <Button size="small" onClick={handleDiscard} sx={{ ml: 1 }} disabled={save.isPending}>
                                        Discard
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {openDialog === 'upload' && (
                <ContentImageDialog onClose={() => setOpenDialog(null)} onInsert={insertTextAtCursor} />
            )}
            {openDialog === 'library' && (
                <MediaLibraryDialog
                    onClose={() => setOpenDialog(null)}
                    onInsert={insertTextAtCursor}
                    onUploadNew={() => setOpenDialog('upload')}
                />
            )}
        </Box>
    );
}
