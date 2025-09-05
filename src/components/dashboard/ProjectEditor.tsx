import { useState, useEffect, ChangeEvent } from 'react';
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
    IconButton,
    Collapse,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Upload as UploadIcon,
    Add as AddIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { getProject, createProject, updateProject, uploadFile, deleteFile, ProjectData } from '../../services/appwrite';
import type { ProjectDocument } from '../../types';
import { getFilePreviewUrl } from '../../services/fileProxy';
import { Models } from 'appwrite';

const ProjectEditor = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const isNewProject = !projectId;

    const [project, setProject] = useState<(Models.Document & ProjectData) | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form fields
    const [title, setTitle] = useState('');
    const [role, setRole] = useState('');
    const [date, setDate] = useState('');
    const [description, setDescription] = useState<string[]>(['']);
    const [isOpen, setIsOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('Click here to learn more');

    // Logo upload
    const [logo, setLogo] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);

    useEffect(() => {
        if (isNewProject) {
            setIsLoading(false);
            return;
        }

        const fetchProject = async () => {
            setIsLoading(true);
            try {
                const projectData = await getProject(projectId as string);
                setProject(projectData);

                // Populate form fields
                setTitle(projectData.title);
                setRole(projectData.role);
                setDate(projectData.date);
                setDescription(projectData.description || ['']);
                setIsOpen(projectData.isOpen || false);

                if (projectData.link_url) setLinkUrl(projectData.link_url);
                if (projectData.link_text) setLinkText(projectData.link_text);

                // Load logo preview if exists
                if (projectData.logoFileId) {
                    const logoUrl = getFilePreviewUrl(projectData.logoFileId);
                    setLogoPreview(logoUrl);
                }
            } catch (error) {
                console.error('Error fetching project:', error);
                setError('Failed to load project data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProject();
    }, [projectId, isNewProject]);

    const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogo(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleDescriptionChange = (index: number, value: string) => {
        const newDescription = [...description];
        newDescription[index] = value;
        setDescription(newDescription);
    };

    const handleAddDescriptionItem = () => {
        setDescription([...description, '']);
    };

    const handleRemoveDescriptionItem = (index: number) => {
        if (description.length > 1) {
            const newDescription = [...description];
            newDescription.splice(index, 1);
            setDescription(newDescription);
        }
    };

    const handleSave = async () => {
        // Validate form
        if (!title.trim() || !role.trim() || !date.trim() || description.some((item) => !item.trim())) {
            setError('Please fill in all required fields');
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            let logoFileId = project?.logoFileId;

            // Upload new logo if changed
            if (logo) {
                // Delete old logo if exists
                if (logoFileId) {
                    await deleteFile(logoFileId);
                }

                // Upload new logo
                const uploadResult = await uploadFile(logo);
                logoFileId = uploadResult.$id;
            }

            // Prepare project data
            const projectData: ProjectData = {
                title,
                role,
                date,
                description: description.filter((item) => item.trim() !== ''),
                isOpen,
                logoFileId,
            };

            // Add link if provided
            if (linkUrl.trim()) {
                projectData.link_url = linkUrl;
                projectData.link_text = linkText || 'Click here to learn more';
            }

            let result;
            if (isNewProject) {
                // Create new project
                result = await createProject(projectData);
            } else {
                // Update existing project
                result = await updateProject(projectId as string, projectData);
            }

            setSuccess(`Project ${isNewProject ? 'created' : 'updated'} successfully`);

            if (isNewProject) {
                // Redirect to edit page after creation
                setTimeout(() => {
                    navigate(`/admin/projects/edit/${result.$id}`);
                }, 1500);
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
                {isNewProject ? 'Create New Project' : 'Edit Project'}
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
                                    label="Project Title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    margin="normal"
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Your Role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    margin="normal"
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Date/Period"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    margin="normal"
                                    placeholder="e.g., June 2022 - Present"
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={<Switch checked={isOpen} onChange={(e) => setIsOpen(e.target.checked)} />}
                                    label="Show expanded by default"
                                />
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Project Description */}
                    <Grid item xs={12}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6" gutterBottom>
                                Project Description
                            </Typography>
                            <Box>
                                <IconButton
                                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                    size="small"
                                >
                                    {isDescriptionExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                                <Button startIcon={<AddIcon />} onClick={handleAddDescriptionItem} size="small">
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
                                        onChange={(e) => handleDescriptionChange(index, e.target.value)}
                                        margin="normal"
                                        multiline
                                        minRows={2}
                                        maxRows={10}
                                        required
                                    />
                                    {description.length > 1 && (
                                        <IconButton
                                            color="error"
                                            onClick={() => handleRemoveDescriptionItem(index)}
                                            sx={{ ml: 1 }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    )}
                                </Box>
                            ))}
                        </Collapse>
                    </Grid>

                    {/* Project Link */}
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
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    margin="normal"
                                    placeholder="https://example.com"
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Link Text"
                                    value={linkText}
                                    onChange={(e) => setLinkText(e.target.value)}
                                    margin="normal"
                                    placeholder="Click here to learn more"
                                />
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Project Logo */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Project Logo
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        {logoPreview && (
                            <Box mb={2}>
                                <img
                                    src={logoPreview}
                                    alt="Logo Preview"
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

                    {/* Save Button */}
                    <Grid item xs={12}>
                        <Box display="flex" justifyContent="flex-end" mt={2}>
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/admin/projects')}
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
