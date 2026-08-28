import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Button,
    CircularProgress,
    Collapse,
    Divider,
    FormControlLabel,
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
    Upload as UploadIcon,
} from '@mui/icons-material';
import { createProject, getProject, updateProject } from '../../services/projectService';
import { deleteFile, getFilePreviewUrl, uploadFile } from '../../services/storageService';
import type { ProjectData, ProjectDocument } from '../../types';
import { routes } from '../../routes/paths';
import { useImagePreview } from '../../hooks';
import { StatusAlerts } from '../shared';

const DEFAULT_LINK_TEXT = 'Click here to learn more';
const REDIRECT_AFTER_CREATE_MS = 1500;

const ProjectEditor = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const isNewProject = !projectId;

    const [project, setProject] = useState<ProjectDocument | null>(null);
    const [isLoading, setIsLoading] = useState(!isNewProject);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [title, setTitle] = useState('');
    const [role, setRole] = useState('');
    const [date, setDate] = useState('');
    const [description, setDescription] = useState<string[]>(['']);
    const [isOpen, setIsOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState(DEFAULT_LINK_TEXT);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);

    const logo = useImagePreview();
    const { setRemoteUrl: setLogoRemoteUrl } = logo;
    const redirectTimerRef = useRef<number | null>(null);

    useEffect(() => () => window.clearTimeout(redirectTimerRef.current ?? undefined), []);

    useEffect(() => {
        if (!projectId) {
            return;
        }

        const fetchProject = async () => {
            setIsLoading(true);

            try {
                const projectData = await getProject(projectId);

                setProject(projectData);
                setTitle(projectData.title);
                setRole(projectData.role);
                setDate(projectData.date);
                setDescription(projectData.description?.length ? projectData.description : ['']);
                setIsOpen(projectData.isOpen || false);
                setLinkUrl(projectData.link_url || '');
                setLinkText(projectData.link_text || DEFAULT_LINK_TEXT);
                setLogoRemoteUrl(projectData.logoFileId ? getFilePreviewUrl(projectData.logoFileId) : null);
            } catch (error) {
                console.error('Error fetching project:', error);
                setError('Failed to load project data');
            } finally {
                setIsLoading(false);
            }
        };

        void fetchProject();
    }, [projectId, setLogoRemoteUrl]);

    const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            logo.setFile(file);
        }
    };

    const updateDescriptionItem = (index: number, value: string) => {
        setDescription((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
    };

    const removeDescriptionItem = (index: number) => {
        setDescription((current) =>
            current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : current
        );
    };

    const handleSave = async () => {
        if (!title.trim() || !role.trim() || !date.trim() || description.some((item) => !item.trim())) {
            setError('Please fill in all required fields');
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            let logoFileId = project?.logoFileId;

            if (logo.file) {
                if (logoFileId) {
                    await deleteFile(logoFileId);
                }

                logoFileId = (await uploadFile(logo.file)).$id;
            }

            const projectData: ProjectData = {
                title,
                role,
                date,
                description: description.filter((item) => item.trim() !== ''),
                isOpen,
                logoFileId,
                ...(linkUrl.trim() ? { link_url: linkUrl, link_text: linkText || DEFAULT_LINK_TEXT } : {}),
            };

            const result = isNewProject
                ? await createProject(projectData)
                : await updateProject(projectId, projectData);

            setSuccess(`Project ${isNewProject ? 'created' : 'updated'} successfully`);

            if (isNewProject) {
                redirectTimerRef.current = window.setTimeout(() => {
                    navigate(routes.admin.projectEdit(result.$id));
                }, REDIRECT_AFTER_CREATE_MS);
            } else {
                setProject(result as unknown as ProjectDocument);
            }
        } catch (error) {
            console.error('Error saving project:', error);
            setError(`Failed to ${isNewProject ? 'create' : 'update'} project`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                {isNewProject ? 'Create New Project' : 'Edit Project'}
            </Typography>

            <StatusAlerts error={error} success={success} />

            <Paper sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Basic Information
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Project Title"
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                    margin="normal"
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Your Role"
                                    value={role}
                                    onChange={(event) => setRole(event.target.value)}
                                    margin="normal"
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Date/Period"
                                    value={date}
                                    onChange={(event) => setDate(event.target.value)}
                                    margin="normal"
                                    placeholder="e.g., June 2022 - Present"
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={isOpen}
                                            onChange={(event) => setIsOpen(event.target.checked)}
                                        />
                                    }
                                    label="Show expanded by default"
                                />
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid item xs={12}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
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
                                    onClick={() => setDescription((current) => [...current, ''])}
                                    size="small"
                                >
                                    Add Item
                                </Button>
                            </Box>
                        </Box>
                        <Divider sx={{ mb: 2 }} />

                        <Collapse in={isDescriptionExpanded}>
                            {description.map((item, index) => (
                                <Box key={index} display="flex" alignItems="center" mb={2}>
                                    <TextField
                                        fullWidth
                                        label={`Description Item ${index + 1}`}
                                        value={item}
                                        onChange={(event) => updateDescriptionItem(index, event.target.value)}
                                        margin="normal"
                                        multiline
                                        minRows={2}
                                        maxRows={10}
                                        required
                                    />
                                    {description.length > 1 && (
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
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Project Link (Optional)
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={8}>
                                <TextField
                                    fullWidth
                                    label="Link URL"
                                    value={linkUrl}
                                    onChange={(event) => setLinkUrl(event.target.value)}
                                    margin="normal"
                                    placeholder="https://example.com"
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Link Text"
                                    value={linkText}
                                    onChange={(event) => setLinkText(event.target.value)}
                                    margin="normal"
                                    placeholder={DEFAULT_LINK_TEXT}
                                />
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Project Logo
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        {logo.previewUrl && (
                            <Box mb={2}>
                                <img
                                    src={logo.previewUrl}
                                    alt="Logo preview"
                                    style={{
                                        maxWidth: '200px',
                                        maxHeight: '200px',
                                        display: 'block',
                                        marginBottom: '10px',
                                    }}
                                />
                            </Box>
                        )}

                        <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
                            Upload Logo
                            <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
                        </Button>
                    </Grid>

                    <Grid item xs={12}>
                        <Box display="flex" justifyContent="flex-end" mt={2}>
                            <Button
                                variant="outlined"
                                onClick={() => navigate(routes.admin.projects)}
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
                                ) : isNewProject ? (
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

export default ProjectEditor;
