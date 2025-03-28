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
    Card,
    CardContent,
    CardActions,
    Divider,
    Stack,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import { getProjects, deleteProject, updateProject, ProjectData } from '../../services/appwrite';
import { getFilePreviewUrl } from '../../services/fileProxy';
import { Models } from 'appwrite';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Table Row component
interface SortableTableRowProps {
    id: string;
    project: Models.Document & ProjectData;
    projectImages: Record<string, string>;
    isMobile: boolean;
    isTablet: boolean;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

const SortableTableRow = ({
    id,
    project,
    projectImages,
    isMobile,
    isTablet,
    onEdit,
    onDelete,
}: SortableTableRowProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1 : 0,
    };

    return (
        <TableRow ref={setNodeRef} style={style}>
            <TableCell padding="none" width="40px">
                <IconButton
                    {...attributes}
                    {...listeners}
                    size="small"
                    sx={{
                        cursor: 'grab',
                        color: 'text.secondary',
                        touchAction: 'none',
                    }}
                >
                    <DragIndicatorIcon />
                </IconButton>
            </TableCell>
            <TableCell>
                {projectImages[project.$id] ? (
                    <Avatar src={projectImages[project.$id]} alt={project.title} sx={{ width: 40, height: 40 }} />
                ) : (
                    <Avatar src="/img/placeholder.svg" alt={project.title} sx={{ width: 40, height: 40 }} />
                )}
            </TableCell>
            <TableCell>{project.title}</TableCell>
            {!isMobile && (
                <>
                    <TableCell>{project.role}</TableCell>
                </>
            )}
            {!isTablet && (
                <>
                    <TableCell>{project.date}</TableCell>
                </>
            )}
            <TableCell align="right">
                <IconButton color="primary" onClick={() => onEdit(project.$id)} title="Edit project">
                    <EditIcon />
                </IconButton>
                <IconButton color="error" onClick={() => onDelete(project.$id)} title="Delete project">
                    <DeleteIcon />
                </IconButton>
            </TableCell>
        </TableRow>
    );
};

// Sortable Card component for mobile/tablet view
interface SortableCardProps {
    id: string;
    project: Models.Document & ProjectData;
    projectImages: Record<string, string>;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

const SortableCard = ({ id, project, projectImages, onEdit, onDelete }: SortableCardProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1 : 0,
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            variant="outlined"
            sx={{
                width: '100%',
                overflow: 'hidden',
                touchAction: 'pan-y', // Allow vertical touch scrolling
            }}
        >
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                    {/* Only the drag handle has touchAction: 'none' */}
                    <IconButton
                        {...attributes}
                        {...listeners}
                        size="small"
                        sx={{
                            cursor: 'grab',
                            color: 'text.secondary',
                            touchAction: 'none', // Disable touch scrolling only on the drag handle
                            flexShrink: 0,
                        }}
                    >
                        <DragIndicatorIcon />
                    </IconButton>

                    {projectImages[project.$id] ? (
                        <Avatar
                            src={projectImages[project.$id]}
                            alt={project.title}
                            sx={{ width: 40, height: 40, flexShrink: 0 }}
                        />
                    ) : (
                        <Avatar
                            src="/img/placeholder.svg"
                            alt={project.title}
                            sx={{ width: 40, height: 40, flexShrink: 0 }}
                        />
                    )}

                    <Tooltip title={project.title} placement="top">
                        <Typography
                            variant="h6"
                            component="div"
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {project.title}
                        </Typography>
                    </Tooltip>
                </Box>

                <Box sx={{ pl: 6 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, wordBreak: 'break-word' }}>
                        <strong>Role:</strong> {project.role}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                        <strong>Date:</strong> {project.date}
                    </Typography>
                </Box>
            </CardContent>

            <Divider />

            <CardActions sx={{ justifyContent: 'flex-end' }}>
                <IconButton color="primary" onClick={() => onEdit(project.$id)} title="Edit project">
                    <EditIcon />
                </IconButton>
                <IconButton color="error" onClick={() => onDelete(project.$id)} title="Delete project">
                    <DeleteIcon />
                </IconButton>
            </CardActions>
        </Card>
    );
};

const ProjectsManager = () => {
    const [projects, setProjects] = useState<(Models.Document & ProjectData)[]>([]);
    const [projectImages, setProjectImages] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();

    // Set up sensors for drag and drop with improved touch handling
    const sensors = useSensors(
        useSensor(PointerSensor, {
            // Increased distance for touch devices to differentiate between dragging and scrolling
            activationConstraint: {
                distance: 10, // Increase this value to require more movement before drag starts
                tolerance: 5, // Add tolerance to help with touch precision
                delay: 150, // Short delay to help determine user intent
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const projectsList = await getProjects();

            // Check if any projects are missing the order property
            const hasUnorderedProjects = projectsList.some((project) => project.order === undefined);

            if (hasUnorderedProjects) {
                // Initialize order for projects that don't have it
                const projectsWithOrder = [...projectsList].map((project, index) => ({
                    ...project,
                    order: project.order !== undefined ? project.order : index,
                }));

                // Update the order in the database for projects that don't have it
                const updatePromises = projectsWithOrder
                    .filter(
                        (project) =>
                            project.order !== undefined &&
                            projectsList.find((p) => p.$id === project.$id)?.order === undefined
                    )
                    .map((project) => updateProject(project.$id, { order: project.order }));

                if (updatePromises.length > 0) {
                    await Promise.all(updatePromises);
                    // Refetch projects after updating orders
                    const updatedProjectsList = await getProjects();
                    setProjects(updatedProjectsList);
                } else {
                    setProjects(projectsWithOrder);
                }
            } else {
                setProjects(projectsList);
            }

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

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        setIsUpdatingOrder(true);
        try {
            // Find the indices of the dragged item and the drop target
            const oldIndex = projects.findIndex((project) => project.$id === active.id);
            const newIndex = projects.findIndex((project) => project.$id === over.id);

            // Update the projects array with the new order
            const updatedProjects = arrayMove(projects, oldIndex, newIndex);
            setProjects(updatedProjects);

            // Update the order property for each project
            const updatePromises = updatedProjects.map((project, index) =>
                updateProject(project.$id, { order: index })
            );

            await Promise.all(updatePromises);
        } catch (error) {
            console.error('Error updating project order:', error);
            setError('Failed to update project order');
            // Revert to original order by refetching
            fetchProjects();
        } finally {
            setIsUpdatingOrder(false);
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

    // Card view for mobile and tablet
    const renderCardView = () => (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            // Improved configuration for touch devices
            autoScroll={{
                threshold: {
                    x: 0.05,
                    y: 0.05,
                },
                acceleration: 5,
                interval: 5,
            }}
        >
            <SortableContext items={projects.map((project) => project.$id)} strategy={verticalListSortingStrategy}>
                <Stack
                    spacing={2}
                    sx={{
                        touchAction: 'pan-y', // Enable vertical scrolling on touch
                        overflowY: 'auto',
                        width: '100%',
                    }}
                >
                    {isLoading ? (
                        <Box>
                            <CircularProgress />
                        </Box>
                    ) : projects.length === 0 ? (
                        <Typography color="textSecondary" textAlign="center">
                            No projects found. Create your first project!
                        </Typography>
                    ) : (
                        projects.map((project) => (
                            <SortableCard
                                key={project.$id}
                                id={project.$id}
                                project={project}
                                projectImages={projectImages}
                                onEdit={handleEditProject}
                                onDelete={handleDeleteClick}
                            />
                        ))
                    )}
                </Stack>
            </SortableContext>
        </DndContext>
    );

    // Table view for desktop
    const renderTableView = () => (
        <TableContainer
            sx={{
                overflowX: 'auto',
                overflow: 'hidden',
            }}
        >
            <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
                <TableHead>
                    <TableRow>
                        <TableCell padding="none" width="40px"></TableCell>
                        <TableCell width="60px"></TableCell>
                        <TableCell>Title</TableCell>
                        {!isMobile && (
                            <>
                                <TableCell>Role</TableCell>
                            </>
                        )}
                        {!isTablet && (
                            <>
                                <TableCell>Date</TableCell>
                            </>
                        )}
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody sx={{ position: 'relative', overflow: 'hidden' }}>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={isMobile ? 4 : isTablet ? 5 : 6} align="center">
                                <CircularProgress />
                            </TableCell>
                        </TableRow>
                    ) : projects.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={isMobile ? 4 : isTablet ? 5 : 6} align="center">
                                No projects found. Create your first project!
                            </TableCell>
                        </TableRow>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                            // Add configuration to prevent out-of-bounds issues
                            autoScroll={{
                                threshold: {
                                    x: 0, // Disable horizontal scrolling
                                    y: 0.2, // Reduce vertical scroll sensitivity
                                },
                                acceleration: 5, // Slower acceleration
                                interval: 5, // More frequent but smaller scrolls
                            }}
                            // Use a custom modifier to restrict movement to vertical axis only
                            modifiers={[
                                ({ transform }) => ({
                                    ...transform,
                                    x: 0, // Lock horizontal movement
                                }),
                            ]}
                        >
                            <SortableContext
                                items={projects.map((project) => project.$id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {projects.map((project) => (
                                    <SortableTableRow
                                        key={project.$id}
                                        id={project.$id}
                                        project={project}
                                        projectImages={projectImages}
                                        isMobile={isMobile}
                                        isTablet={isTablet}
                                        onEdit={handleEditProject}
                                        onDelete={handleDeleteClick}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );

    return (
        <Box>
            <Box
                display="flex"
                flexDirection="row"
                justifyContent="space-between"
                alignItems={isMobile ? 'flex-start' : 'center'}
                mb={3}
                gap={isMobile ? 2 : 0}
            >
                <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
                    Projects
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/admin/projects/new')}
                >
                    Add
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {isUpdatingOrder && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    Updating project order...
                </Alert>
            )}

            <Paper sx={{ p: { xs: 2, sm:0 }, mb: 3, width: '100%', overflow: 'hidden' }}>
                {/* Card view for mobile/tablet, Table view for desktop */}
                {isTablet ? renderCardView() : renderTableView()}
            </Paper>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                fullWidth={isMobile}
                maxWidth={isMobile ? 'sm' : 'xs'}
            >
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

export default ProjectsManager;
