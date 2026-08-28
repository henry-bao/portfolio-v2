import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CircularProgress,
    Divider,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    DragIndicator as DragIndicatorIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { deleteProject, getProjects, updateProject } from '../../services/projectService';
import { getFilePreviewUrl } from '../../services/storageService';
import type { ProjectDocument } from '../../types';
import { PLACEHOLDER_IMAGE } from '../../utils/assets';
import { useBreakpoints } from '../../hooks';
import { routes } from '../../routes/paths';
import { ConfirmDialog, PageHeader } from '../shared';

const AVATAR_SIZE_PX = 40;

const dragHandleSx = { cursor: 'grab', color: 'text.secondary', touchAction: 'none' } as const;

interface SortableProjectProps {
    project: ProjectDocument;
    logoUrl?: string;
    onEdit: (id: string) => void;
    onDelete: (project: ProjectDocument) => void;
}

const ProjectActions = ({ project, onEdit, onDelete }: Omit<SortableProjectProps, 'logoUrl'>) => (
    <>
        <IconButton color="primary" onClick={() => onEdit(project.$id)} title="Edit project">
            <EditIcon />
        </IconButton>
        <IconButton color="error" onClick={() => onDelete(project)} title="Delete project">
            <DeleteIcon />
        </IconButton>
    </>
);

/** Shared drag styling for both the row and card representations of a project. */
const useSortableProject = (id: string) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    return {
        setNodeRef,
        dragHandleProps: { ...attributes, ...listeners },
        style: {
            transform: CSS.Transform.toString(transform),
            transition,
            opacity: isDragging ? 0.5 : 1,
            zIndex: isDragging ? 1 : 0,
        },
    };
};

const SortableTableRow = ({
    project,
    logoUrl,
    isMobile,
    isTablet,
    onEdit,
    onDelete,
}: SortableProjectProps & { isMobile: boolean; isTablet: boolean }) => {
    const { setNodeRef, dragHandleProps, style } = useSortableProject(project.$id);

    return (
        <TableRow ref={setNodeRef} style={style}>
            <TableCell padding="none" width="40px">
                <IconButton {...dragHandleProps} size="small" aria-label="Reorder project" sx={dragHandleSx}>
                    <DragIndicatorIcon />
                </IconButton>
            </TableCell>
            <TableCell>
                <Avatar
                    src={logoUrl || PLACEHOLDER_IMAGE}
                    alt={project.title}
                    sx={{ width: AVATAR_SIZE_PX, height: AVATAR_SIZE_PX }}
                />
            </TableCell>
            <TableCell>{project.title}</TableCell>
            {!isMobile && <TableCell>{project.role}</TableCell>}
            {!isTablet && <TableCell>{project.date}</TableCell>}
            <TableCell align="right">
                <ProjectActions project={project} onEdit={onEdit} onDelete={onDelete} />
            </TableCell>
        </TableRow>
    );
};

const SortableCard = ({ project, logoUrl, onEdit, onDelete }: SortableProjectProps) => {
    const { setNodeRef, dragHandleProps, style } = useSortableProject(project.$id);

    return (
        <Card
            ref={setNodeRef}
            style={style}
            variant="outlined"
            sx={{ width: '100%', overflow: 'hidden', touchAction: 'pan-y' }}
        >
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <IconButton
                        {...dragHandleProps}
                        size="small"
                        aria-label="Reorder project"
                        sx={{ ...dragHandleSx, flexShrink: 0 }}
                    >
                        <DragIndicatorIcon />
                    </IconButton>

                    <Avatar
                        src={logoUrl || PLACEHOLDER_IMAGE}
                        alt={project.title}
                        sx={{ width: AVATAR_SIZE_PX, height: AVATAR_SIZE_PX, flexShrink: 0 }}
                    />

                    <Tooltip title={project.title} placement="top">
                        <Typography
                            variant="h6"
                            component="div"
                            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
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
                <ProjectActions project={project} onEdit={onEdit} onDelete={onDelete} />
            </CardActions>
        </Card>
    );
};

const EmptyState = () => <>No projects found. Create your first project!</>;

const ProjectsManager = () => {
    const [projects, setProjects] = useState<ProjectDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [projectToDelete, setProjectToDelete] = useState<ProjectDocument | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
    const { isMobile, isTablet } = useBreakpoints();
    const navigate = useNavigate();

    const logoUrls = useMemo(
        () =>
            Object.fromEntries(
                projects
                    .filter((project) => project.logoFileId)
                    .map((project) => [
                        project.$id,
                        getFilePreviewUrl(project.logoFileId as string, AVATAR_SIZE_PX, AVATAR_SIZE_PX),
                    ])
            ),
        [projects]
    );

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 10, tolerance: 5, delay: 150 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const fetchProjects = useCallback(async () => {
        setIsLoading(true);

        try {
            const projectsList = await getProjects();
            const backfills = projectsList
                .map((project, index) =>
                    project.order === undefined ? updateProject(project.$id, { order: index }) : null
                )
                .filter((update) => update !== null);

            if (backfills.length === 0) {
                setProjects(projectsList);
                return;
            }

            // Older projects predate explicit ordering; persist an order then reload in that order.
            await Promise.all(backfills);
            setProjects(await getProjects());
        } catch (error) {
            console.error('Error fetching projects:', error);
            setError('Failed to load projects');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchProjects();
    }, [fetchProjects]);

    const handleDragEnd = useCallback(
        async (event: DragEndEvent) => {
            const { active, over } = event;

            if (!over || active.id === over.id) {
                return;
            }

            const oldIndex = projects.findIndex((project) => project.$id === active.id);
            const newIndex = projects.findIndex((project) => project.$id === over.id);
            const reorderedProjects = arrayMove(projects, oldIndex, newIndex);

            setIsUpdatingOrder(true);
            setProjects(reorderedProjects);

            try {
                await Promise.all(
                    reorderedProjects.map((project, index) => updateProject(project.$id, { order: index }))
                );
            } catch (error) {
                console.error('Error updating project order:', error);
                setError('Failed to update project order');
                void fetchProjects();
            } finally {
                setIsUpdatingOrder(false);
            }
        },
        [fetchProjects, projects]
    );

    const handleEditProject = (projectId: string) => navigate(routes.admin.projectEdit(projectId));

    const handleDeleteConfirm = async () => {
        if (!projectToDelete) {
            return;
        }

        setIsDeleting(true);

        try {
            await deleteProject(projectToDelete.$id);
            setProjects((current) => current.filter((project) => project.$id !== projectToDelete.$id));
            setProjectToDelete(null);
        } catch (error) {
            console.error('Error deleting project:', error);
            setError('Failed to delete project');
        } finally {
            setIsDeleting(false);
        }
    };

    const sortableIds = projects.map((project) => project.$id);
    const projectRowProps = (project: ProjectDocument) => ({
        key: project.$id,
        project,
        logoUrl: logoUrls[project.$id],
        onEdit: handleEditProject,
        onDelete: setProjectToDelete,
    });

    const renderCardView = () => (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            autoScroll={{ threshold: { x: 0.05, y: 0.05 }, acceleration: 5, interval: 5 }}
        >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                <Stack spacing={2} sx={{ touchAction: 'pan-y', overflowY: 'auto', width: '100%' }}>
                    {isLoading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" py={2}>
                            <CircularProgress />
                        </Box>
                    ) : projects.length === 0 ? (
                        <Typography color="textSecondary" textAlign="center">
                            <EmptyState />
                        </Typography>
                    ) : (
                        projects.map((project) => <SortableCard {...projectRowProps(project)} />)
                    )}
                </Stack>
            </SortableContext>
        </DndContext>
    );

    const renderTableView = () => {
        const visibleColumnCount = isMobile ? 4 : isTablet ? 5 : 6;

        return (
            <TableContainer sx={{ overflowX: 'auto', overflow: 'hidden' }}>
                <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="none" width="40px" />
                            <TableCell width="60px" />
                            <TableCell>Title</TableCell>
                            {!isMobile && <TableCell>Role</TableCell>}
                            {!isTablet && <TableCell>Date</TableCell>}
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody sx={{ position: 'relative', overflow: 'hidden' }}>
                        {isLoading || projects.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={visibleColumnCount} align="center">
                                    {isLoading ? <CircularProgress /> : <EmptyState />}
                                </TableCell>
                            </TableRow>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                                autoScroll={{ threshold: { x: 0, y: 0.2 }, acceleration: 5, interval: 5 }}
                                modifiers={[({ transform }) => ({ ...transform, x: 0 })]}
                            >
                                <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                                    {projects.map((project) => (
                                        <SortableTableRow
                                            {...projectRowProps(project)}
                                            isMobile={isMobile}
                                            isTablet={isTablet}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    return (
        <Box>
            <PageHeader
                title="Projects"
                action={
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => navigate(routes.admin.projectNew)}
                    >
                        Add
                    </Button>
                }
            />

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

            <Paper sx={{ p: { xs: 2, md: 0 }, mb: 3, width: '100%', overflow: 'hidden' }}>
                {isTablet ? renderCardView() : renderTableView()}
            </Paper>

            <ConfirmDialog
                open={Boolean(projectToDelete)}
                title="Delete Project"
                description="Are you sure you want to delete this project? This action cannot be undone."
                isBusy={isDeleting}
                fullWidth={isMobile}
                onCancel={() => setProjectToDelete(null)}
                onConfirm={handleDeleteConfirm}
            />
        </Box>
    );
};

export default ProjectsManager;
