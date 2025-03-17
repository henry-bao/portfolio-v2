import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    CircularProgress,
    Alert,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Avatar,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { getProjects, deleteProject, ProjectData } from '../../services/appwrite';
import { getFilePreviewUrl } from '../../services/fileProxy';
import { Models } from 'appwrite';

const ProjectsList = () => {
    const [projects, setProjects] = useState<(Models.Document & ProjectData)[]>([]);
    const [projectImages, setProjectImages] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const projectsList = await getProjects();
            setProjects(projectsList);

            // Get image URLs for all projects
            const imageUrls: Record<string, string> = {};
            for (const project of projectsList) {
                if (project.logoFileId) {
                    imageUrls[project.$id] = getFilePreviewUrl(project.logoFileId, 40, 40);
                }
            }
            setProjectImages(imageUrls);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setError('Failed to load projects');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditProject = (projectId: string) => {
        navigate(`/admin/projects/edit/${projectId}`);
    };

    const handleDeleteClick = (projectId: string) => {
        setProjectToDelete(projectId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!projectToDelete) return;

        setIsDeleting(true);
        try {
            await deleteProject(projectToDelete);
            setProjects(projects.filter((project) => project.$id !== projectToDelete));
            setDeleteDialogOpen(false);
            setProjectToDelete(null);
        } catch (error) {
            console.error('Error deleting project:', error);
            setError('Failed to delete project');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setProjectToDelete(null);
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Projects
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/admin/projects/new')}
                >
                    {isMobile ? 'Add' : 'Add Project'}
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell width="60px"></TableCell>
                                <TableCell>Title</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {projects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        No projects found. Create your first project!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                projects.map((project) => (
                                    <TableRow key={project.$id}>
                                        <TableCell>
                                            {projectImages[project.$id] ? (
                                                <Avatar
                                                    src={projectImages[project.$id]}
                                                    alt={project.title}
                                                    sx={{ width: 40, height: 40 }}
                                                />
                                            ) : (
                                                <Avatar
                                                    src="/img/placeholder.svg"
                                                    alt={project.title}
                                                    sx={{ width: 40, height: 40 }}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>{project.title}</TableCell>
                                        <TableCell>{project.role}</TableCell>
                                        <TableCell>{project.date}</TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                color="primary"
                                                onClick={() => window.open('/#projects', '_blank')}
                                                title="View on site"
                                            >
                                                <VisibilityIcon />
                                            </IconButton>
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleEditProject(project.$id)}
                                                title="Edit project"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                onClick={() => handleDeleteClick(project.$id)}
                                                title="Delete project"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
                <DialogTitle>Delete Project</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this project? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        disabled={isDeleting}
                        startIcon={isDeleting ? <CircularProgress size={20} /> : null}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProjectsList;
