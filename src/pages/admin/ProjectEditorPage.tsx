import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Button,
    CircularProgress,
    Collapse,
    Divider,
    FormControlLabel,
    FormHelperText,
    Grid,
    IconButton,
    Paper,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    ExpandLess as ExpandLessIcon,
    ExpandMore as ExpandMoreIcon,
    Undo as UndoIcon,
    Upload as UploadIcon,
} from '@mui/icons-material';
import { FILE_RULES, acceptAttribute, fileUrl, getErrorMessage, getFieldErrors, projectsApi, validateFile } from '../../api';
import type { Project } from '../../api';
import { useNotify } from '../../app/notifications/useNotify';
import { routes } from '../../app/routes';
import { ImagePreview } from '../../components/admin/ImagePreview';
import { LoadErrorAlert, PageSpinner } from '../../components/admin/QueryStatus';
import { StatusAlerts } from '../../components/admin/StatusAlerts';
import { useFileField } from '../../hooks';
import { useProject, useSaveProject } from '../../queries';

interface FormValues {
    title: string;
    role: string;
    date: string;
    isOpen: boolean;
    description: string[];
    link_url: string;
    link_text: string;
}

const toFormValues = (project: Project | null): FormValues => ({
    title: project?.title ?? '',
    role: project?.role ?? '',
    date: project?.date ?? '',
    isOpen: project?.isOpen ?? false,
    description: project?.description.length ? [...project.description] : [''],
    link_url: project?.link_url ?? '',
    link_text: project?.link_text ?? '',
});

const SectionHeading = ({ children }: { children: string }) => (
    <>
        <Typography variant="h6" gutterBottom>
            {children}
        </Typography>
        <Divider sx={{ mb: 2 }} />
    </>
);

/** Mounted once the project (if any) is loaded, so the fields start from it without an effect. */
const ProjectForm = ({ project }: { project: Project | null }) => {
    const navigate = useNavigate();
    const notify = useNotify();
    const saveProject = useSaveProject();
    // The version this form was opened from (or last saved as); the save refuses to overwrite newer edits.
    const [baseline, setBaseline] = useState(project);
    const [values, setValues] = useState(() => toFormValues(project));
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);
    const logo = useFileField(fileUrl(baseline?.logoFileId ?? null));

    const isNew = !baseline;
    const fieldErrors = getFieldErrors(saveProject.error);

    const setField = <Key extends keyof FormValues>(key: Key, value: FormValues[Key]) =>
        setValues((current) => ({ ...current, [key]: value }));

    const updateDescriptionItem = (index: number, value: string) =>
        setField(
            'description',
            values.description.map((item, itemIndex) => (itemIndex === index ? value : item))
        );

    const removeDescriptionItem = (index: number) =>
        setField(
            'description',
            values.description.filter((_, itemIndex) => itemIndex !== index)
        );

    const handleLogoPick = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        const invalid = validateFile(file, 'image');

        if (invalid) {
            notify.error(invalid);
            return;
        }

        logo.pick(file);
    };

    const handleSave = () => {
        saveProject.mutate(
            { current: baseline, values, logo: logo.change },
            {
                onSuccess: (saved) => {
                    setBaseline(saved);
                    logo.reset();
                    notify.success(isNew ? 'Project created' : 'Project saved');

                    if (isNew) {
                        navigate(routes.admin.projectEdit(saved.$id), { replace: true });
                    }
                },
            }
        );
    };

    const textField = (key: 'title' | 'role' | 'date' | 'link_url' | 'link_text', label: string, extra = {}) => (
        <TextField
            fullWidth
            label={label}
            value={values[key]}
            onChange={(event) => setField(key, event.target.value)}
            margin="normal"
            error={Boolean(fieldErrors[key])}
            helperText={fieldErrors[key]}
            {...extra}
        />
    );

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                {isNew ? 'Create New Project' : 'Edit Project'}
            </Typography>

            <StatusAlerts error={saveProject.error ? getErrorMessage(saveProject.error) : undefined} />

            <Paper sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    <Grid size={12}>
                        <SectionHeading>Basic Information</SectionHeading>
                        <Grid container spacing={2}>
                            <Grid size={12}>{textField('title', 'Project Title', { required: true })}</Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>{textField('role', 'Your Role', { required: true })}</Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                {textField('date', 'Date/Period', { required: true, placeholder: 'e.g., June 2022 - Present' })}
                            </Grid>
                            <Grid size={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={values.isOpen}
                                            onChange={(event) => setField('isOpen', event.target.checked)}
                                        />
                                    }
                                    label="Show expanded by default"
                                />
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid size={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" gutterBottom>
                                Project Description
                            </Typography>
                            <Box>
                                <IconButton
                                    onClick={() => setIsDescriptionExpanded((current) => !current)}
                                    aria-label={isDescriptionExpanded ? 'Collapse description' : 'Expand description'}
                                    size="small"
                                >
                                    {isDescriptionExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                                <Button
                                    startIcon={<AddIcon />}
                                    onClick={() => setField('description', [...values.description, ''])}
                                    size="small"
                                >
                                    Add Item
                                </Button>
                            </Box>
                        </Box>
                        <Divider sx={{ mb: 2 }} />

                        <Collapse in={isDescriptionExpanded}>
                            {values.description.map((item, index) => (
                                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <TextField
                                        fullWidth
                                        label={`Description Item ${index + 1}`}
                                        value={item}
                                        onChange={(event) => updateDescriptionItem(index, event.target.value)}
                                        margin="normal"
                                        multiline
                                        minRows={2}
                                        maxRows={10}
                                    />
                                    {values.description.length > 1 && (
                                        <IconButton
                                            color="error"
                                            onClick={() => removeDescriptionItem(index)}
                                            aria-label={`Remove description item ${index + 1}`}
                                            sx={{ ml: 1 }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    )}
                                </Box>
                            ))}
                        </Collapse>
                        {fieldErrors.description && <FormHelperText error>{fieldErrors.description}</FormHelperText>}
                    </Grid>

                    <Grid size={12}>
                        <SectionHeading>Project Link (Optional)</SectionHeading>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 8 }}>
                                {textField('link_url', 'Link URL', { placeholder: 'https://example.com' })}
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                {textField('link_text', 'Link Text', { placeholder: projectsApi.DEFAULT_LINK_TEXT })}
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid size={12}>
                        <SectionHeading>Project Logo</SectionHeading>

                        {logo.previewUrl && (
                            <Box sx={{ mb: 2 }}>
                                <ImagePreview src={logo.previewUrl} alt="Logo preview" maxWidth={200} maxHeight={200} />
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
                                {logo.previewUrl ? 'Replace Logo' : 'Upload Logo'}
                                <input type="file" hidden accept={acceptAttribute('image')} onChange={handleLogoPick} />
                            </Button>
                            {logo.previewUrl && (
                                <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={logo.remove}>
                                    Remove Logo
                                </Button>
                            )}
                            {logo.isChanged && (
                                <Button variant="text" startIcon={<UndoIcon />} onClick={logo.reset}>
                                    Undo
                                </Button>
                            )}
                        </Box>
                        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                            {FILE_RULES.image.description}
                        </Typography>
                    </Grid>

                    <Grid size={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={() => navigate(routes.admin.projects)}
                                sx={{ mr: 2 }}
                                disabled={saveProject.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSave}
                                disabled={saveProject.isPending}
                                size="large"
                            >
                                {saveProject.isPending ? (
                                    <CircularProgress size={24} />
                                ) : isNew ? (
                                    'Create Project'
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

const ProjectEditorPage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const projectQuery = useProject(projectId);

    // A new project has nothing to load (the query is disabled and would report "pending" forever).
    if (!projectId) {
        return <ProjectForm key="new" project={null} />;
    }

    if (projectQuery.isPending) {
        return <PageSpinner />;
    }

    if (projectQuery.isError) {
        return (
            <LoadErrorAlert
                error={projectQuery.error}
                onRetry={() => void projectQuery.refetch()}
                notFoundMessage="This project doesn't exist. It may have been deleted."
                action={
                    <Button color="inherit" size="small" onClick={() => navigate(routes.admin.projects)}>
                        Back to projects
                    </Button>
                }
            />
        );
    }

    return <ProjectForm key={projectId} project={projectQuery.data} />;
};

export default ProjectEditorPage;
