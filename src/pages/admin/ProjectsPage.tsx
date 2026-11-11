import { useState } from 'react';
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
import { fileUrl } from '../../api';
import type { Project } from '../../api';
import { useNotify } from '../../app/notifications/useNotify';
import { routes } from '../../app/routes';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { PageHeader } from '../../components/admin/PageHeader';
import { LoadErrorAlert, PageSpinner } from '../../components/admin/QueryStatus';
import { PLACEHOLDER_IMAGE } from '../../config/site';
import { useBreakpoints } from '../../hooks';
import { useDeleteProject, useProjects, useReorderProjects } from '../../queries';

const AVATAR_SIZE_PX = 40;

const dragHandleSx = { cursor: 'grab', color: 'text.secondary', touchAction: 'none' } as const;

interface ProjectItemProps {
    project: Project;
    /** Reordering is paused while the previous order is still saving. */
    dragDisabled: boolean;
    onEdit: (project: Project) => void;
    onDelete: (project: Project) => void;
}

const ProjectLogo = ({ project }: { project: Project }) => (
    <Avatar
        src={fileUrl(project.logoFileId) ?? PLACEHOLDER_IMAGE}
        alt={project.title}
        sx={{ width: AVATAR_SIZE_PX, height: AVATAR_SIZE_PX, flexShrink: 0 }}
    />
);

const ProjectActions = ({ project, onEdit, onDelete }: Pick<ProjectItemProps, 'project' | 'onEdit' | 'onDelete'>) => (
    <>
        <IconButton color="primary" onClick={() => onEdit(project)} title="Edit project">
            <EditIcon />
        </IconButton>
        <IconButton color="error" onClick={() => onDelete(project)} title="Delete project">
            <DeleteIcon />
        </IconButton>
    </>
);

/** Shared drag styling for both the row and card representations of a project. */
const useSortableProject = (id: string, disabled: boolean) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });

    return {
        setNodeRef,
        dragHandleProps: { ...attributes, ...listeners, disabled },
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
    dragDisabled,
    isMobile,
    isTablet,
    onEdit,
    onDelete,
}: ProjectItemProps & { isMobile: boolean; isTablet: boolean }) => {
    const { setNodeRef, dragHandleProps, style } = useSortableProject(project.$id, dragDisabled);

    return (
        <TableRow ref={setNodeRef} style={style}>
            <TableCell padding="none" width="40px">
                <IconButton {...dragHandleProps} size="small" aria-label="Reorder project" sx={dragHandleSx}>
                    <DragIndicatorIcon />
                </IconButton>
            </TableCell>
            <TableCell>
                <ProjectLogo project={project} />
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

const SortableCard = ({ project, dragDisabled, onEdit, onDelete }: ProjectItemProps) => {
    const { setNodeRef, dragHandleProps, style } = useSortableProject(project.$id, dragDisabled);

    return (
        <Card
            ref={setNodeRef}
            style={style}
            variant="outlined"
            sx={{ width: '100%', overflow: 'hidden', touchAction: 'pan-y' }}
        >
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <IconButton
                        {...dragHandleProps}
                        size="small"
                        aria-label="Reorder project"
                        sx={{ ...dragHandleSx, flexShrink: 0 }}
                    >
                        <DragIndicatorIcon />
                    </IconButton>

                    <ProjectLogo project={project} />

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
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1, wordBreak: 'break-word' }}>
                        <strong>Role:</strong> {project.role}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', wordBreak: 'break-word' }}>
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

const EMPTY_MESSAGE = 'No projects yet. Add your first project!';

const ProjectsPage = () => {
    const navigate = useNavigate();
    const notify = useNotify();
    const { isMobile, isTablet } = useBreakpoints();
    const projectsQuery = useProjects();
    const reorderProjects = useReorderProjects();
    const deleteProject = useDeleteProject();
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

    const projects = projectsQuery.data ?? [];
    const sortableIds = projects.map((project) => project.$id);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 10, tolerance: 5, delay: 150 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id || reorderProjects.isPending) {
            return;
        }

        const oldIndex = sortableIds.indexOf(String(active.id));
        const newIndex = sortableIds.indexOf(String(over.id));

        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        reorderProjects.mutate(arrayMove(projects, oldIndex, newIndex), { onError: notify.error });
    };

    const handleDeleteConfirm = () => {
        if (!projectToDelete) {
            return;
        }

        deleteProject.mutate(projectToDelete, {
            onSuccess: () => {
                notify.success(`Deleted "${projectToDelete.title}"`);
                setProjectToDelete(null);
            },
            onError: notify.error,
        });
    };

    const itemProps = (project: Project) => ({
        project,
        dragDisabled: reorderProjects.isPending,
        onEdit: (item: Project) => navigate(routes.admin.projectEdit(item.$id)),
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
                    {projects.length === 0 ? (
                        <Typography color="textSecondary" sx={{ textAlign: 'center' }}>
                            {EMPTY_MESSAGE}
                        </Typography>
                    ) : (
                        projects.map((project) => <SortableCard key={project.$id} {...itemProps(project)} />)
                    )}
                </Stack>
            </SortableContext>
        </DndContext>
    );

    const renderTableView = () => (
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
                    {projects.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={isMobile ? 4 : isTablet ? 5 : 6} align="center">
                                {EMPTY_MESSAGE}
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
                                        key={project.$id}
                                        {...itemProps(project)}
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

            {reorderProjects.isPending && (
                <Alert severity="info" icon={<CircularProgress size={20} />} sx={{ mb: 3 }}>
                    Saving the new order...
                </Alert>
            )}

            {projectsQuery.isPending ? (
                <PageSpinner />
            ) : projectsQuery.isError ? (
                <LoadErrorAlert error={projectsQuery.error} onRetry={() => void projectsQuery.refetch()} />
            ) : (
                <Paper sx={{ p: { xs: 2, md: 0 }, mb: 3, width: '100%', overflow: 'hidden' }}>
                    {isTablet ? renderCardView() : renderTableView()}
                </Paper>
            )}

            <ConfirmDialog
                open={Boolean(projectToDelete)}
                title="Delete Project"
                description={`Delete "${projectToDelete?.title ?? ''}" and its logo? This can't be undone.`}
                isBusy={deleteProject.isPending}
                fullWidth={isMobile}
                onCancel={() => setProjectToDelete(null)}
                onConfirm={handleDeleteConfirm}
            />
        </Box>
    );
};

export default ProjectsPage;
