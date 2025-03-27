import { useState, useEffect, ChangeEvent } from 'react';
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
    TextField,
    Chip,
    useMediaQuery,
    useTheme,
    Stack,
    Card,
    CardContent,
    CardActions,
    Divider,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    CheckCircle as ActiveIcon,
    RadioButtonUnchecked as InactiveIcon,
    Description as FileIcon,
    Upload as UploadIcon,
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Save as SaveIcon,
} from '@mui/icons-material';
import { Models } from 'appwrite';
import { getFileUrl } from '../../services/fileProxy';
import {
    getResumeVersions,
    addResumeVersion,
    setResumeAsActive,
    deleteResumeVersion,
    updateResumeVersion,
    ResumeVersion,
} from '../../services/resumeService';

const ResumeManager = () => {
    const [resumeVersions, setResumeVersions] = useState<(Models.Document & ResumeVersion)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [newResumeFile, setNewResumeFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [resumeToDelete, setResumeToDelete] = useState<{ id: string; fileId: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSettingActive, setIsSettingActive] = useState(false);

    // Edit resume state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [resumeToEdit, setResumeToEdit] = useState<(Models.Document & ResumeVersion) | null>(null);
    const [editFileName, setEditFileName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Responsive design hooks
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        fetchResumeVersions();
    }, []);

    const fetchResumeVersions = async () => {
        setIsLoading(true);
        try {
            const versions = await getResumeVersions();
            setResumeVersions(versions);
        } catch (error) {
            console.error('Error fetching resume versions:', error);
            setError('Failed to load resume versions');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResumeFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                setError('Only PDF files are supported');
                return;
            }
            setNewResumeFile(file);
            setUploadDialogOpen(true);
        }
    };

    const handleUploadCancel = () => {
        setUploadDialogOpen(false);
        setNewResumeFile(null);
        setDescription('');
    };

    const handleUploadConfirm = async () => {
        if (!newResumeFile) return;

        setIsUploading(true);
        setError('');
        setSuccess('');

        try {
            await addResumeVersion(newResumeFile, description);
            setSuccess('Resume uploaded successfully');
            setUploadDialogOpen(false);
            setNewResumeFile(null);
            setDescription('');
            await fetchResumeVersions();
        } catch (error) {
            console.error('Error uploading resume:', error);
            setError('Failed to upload resume');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteClick = (resumeId: string, fileId: string) => {
        setResumeToDelete({ id: resumeId, fileId });
        setDeleteDialogOpen(true);
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setResumeToDelete(null);
    };

    const handleDeleteConfirm = async () => {
        if (!resumeToDelete) return;

        setIsDeleting(true);
        try {
            await deleteResumeVersion(resumeToDelete.id, resumeToDelete.fileId);
            setSuccess('Resume deleted successfully');
            setDeleteDialogOpen(false);
            setResumeToDelete(null);
            await fetchResumeVersions();
        } catch (error) {
            console.error('Error deleting resume:', error);
            setError('Failed to delete resume');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditClick = (resume: Models.Document & ResumeVersion) => {
        setResumeToEdit(resume);
        setEditFileName(resume.fileName);
        setEditDescription(resume.description || '');
        setEditDialogOpen(true);
    };

    const handleEditCancel = () => {
        setEditDialogOpen(false);
        setResumeToEdit(null);
        setEditFileName('');
        setEditDescription('');
    };

    const handleEditConfirm = async () => {
        if (!resumeToEdit) return;

        setIsEditing(true);
        setError('');
        setSuccess('');

        try {
            await updateResumeVersion(resumeToEdit.$id, {
                fileName: editFileName,
                description: editDescription,
            });
            setSuccess('Resume updated successfully');
            setEditDialogOpen(false);
            setResumeToEdit(null);
            setEditFileName('');
            setEditDescription('');
            await fetchResumeVersions();
        } catch (error) {
            console.error('Error updating resume:', error);
            setError('Failed to update resume');
        } finally {
            setIsEditing(false);
        }
    };

    const handleSetActive = async (resumeId: string) => {
        setIsSettingActive(true);
        setError('');
        setSuccess('');

        try {
            await setResumeAsActive(resumeId);
            setSuccess('Resume set as active successfully');
            await fetchResumeVersions();
        } catch (error) {
            console.error('Error setting resume as active:', error);
            setError('Failed to set resume as active');
        } finally {
            setIsSettingActive(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Card view for mobile and tablet
    const renderCardView = () => (
        <Stack spacing={2} mt={2}>
            {resumeVersions.length === 0 ? (
                <Typography color="textSecondary" textAlign="center">
                    No resume versions found. Upload your first resume!
                </Typography>
            ) : (
                resumeVersions.map((resume) => (
                    <Card key={resume.$id} variant="outlined" sx={{ width: '100%', overflow: 'hidden' }}>
                        <CardContent sx={{ overflow: 'hidden', p: { xs: 1.5, sm: 2 } }}>
                            <Box
                                display="flex"
                                alignItems={{ xs: 'flex-start', sm: 'center' }}
                                flexDirection={{ xs: 'column', sm: 'row' }}
                                justifyContent="space-between"
                                mb={2}
                                gap={{ xs: 1, sm: 0 }}
                            >
                                <Tooltip title={resume.fileName} placement="top">
                                    <Typography
                                        variant="h6"
                                        component="div"
                                        sx={{
                                            mr: { sm: 2 },
                                            flex: 1,
                                            textOverflow: 'ellipsis',
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            maxWidth: '100%',
                                        }}
                                    >
                                        {resume.fileName}
                                    </Typography>
                                </Tooltip>

                                {resume.isActive ? (
                                    <Chip icon={<ActiveIcon />} label="Active" color="success" variant="outlined" />
                                ) : (
                                    <Chip
                                        icon={<InactiveIcon />}
                                        label="Set Active"
                                        color="default"
                                        variant="outlined"
                                        onClick={() => handleSetActive(resume.$id)}
                                        disabled={isSettingActive}
                                        sx={{ cursor: 'pointer' }}
                                    />
                                )}
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, wordBreak: 'break-word' }}>
                                <strong>Uploaded:</strong> {formatDate(resume.uploadDate)}
                            </Typography>

                            {resume.description && (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 1, wordBreak: 'break-word' }}
                                >
                                    <strong>Description:</strong> {resume.description}
                                </Typography>
                            )}
                        </CardContent>

                        <Divider />

                        <CardActions sx={{ justifyContent: 'flex-end' }}>
                            <IconButton
                                color="primary"
                                href={getFileUrl(resume.fileId)}
                                target="_blank"
                                size="small"
                                title="View resume"
                            >
                                <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                                color="primary"
                                onClick={() => handleEditClick(resume)}
                                size="small"
                                title="Edit resume details"
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                                color="error"
                                onClick={() => handleDeleteClick(resume.$id, resume.fileId)}
                                disabled={isDeleting}
                                size="small"
                                title="Delete resume"
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </CardActions>
                    </Card>
                ))
            )}
        </Stack>
    );

    // Table view for desktop
    const renderTableView = () => (
        <TableContainer sx={{ overflowX: 'auto' }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ width: { xs: '5%', sm: '15%' } }}>Status</TableCell>
                        <TableCell sx={{ width: { xs: '40%', sm: '35%', lg: '20%' } }}>File Name</TableCell>
                        {!isMobile && <TableCell sx={{ width: { sm: '20%' } }}>Upload Date</TableCell>}
                        {!isTablet && <TableCell sx={{ width: { md: '25%' } }}>Description</TableCell>}
                        <TableCell align="right" sx={{ width: { xs: '15%', sm: '10%' } }}>
                            Actions
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {resumeVersions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={isMobile ? 3 : isTablet ? 4 : 5} align="center">
                                No resume versions found. Upload your first resume!
                            </TableCell>
                        </TableRow>
                    ) : (
                        resumeVersions.map((resume) => (
                            <TableRow key={resume.$id}>
                                <TableCell>
                                    {resume.isActive ? (
                                        <Chip
                                            icon={<ActiveIcon />}
                                            label={isTablet ? '' : 'Active'}
                                            color="success"
                                            variant="outlined"
                                            sx={{
                                                '& .MuiChip-label': {
                                                    padding: isTablet ? 0.6 : undefined,
                                                },
                                            }}
                                        />
                                    ) : (
                                        <Chip
                                            icon={<InactiveIcon />}
                                            label={isTablet ? '' : 'Set Active'}
                                            color="default"
                                            variant="outlined"
                                            onClick={() => handleSetActive(resume.$id)}
                                            disabled={isSettingActive}
                                            sx={{
                                                cursor: 'pointer',
                                                '& .MuiChip-label': {
                                                    padding: isTablet ? 0.6 : undefined,
                                                },
                                            }}
                                        />
                                    )}
                                </TableCell>
                                <TableCell sx={{ wordBreak: 'break-word' }}>
                                    <Tooltip title={resume.fileName} placement="top">
                                        <Typography
                                            sx={{
                                                textOverflow: 'ellipsis',
                                                overflow: 'hidden',
                                                whiteSpace: 'nowrap',
                                                maxWidth: { xs: '120px', sm: '180px', md: '250px' },
                                            }}
                                        >
                                            {resume.fileName}
                                        </Typography>
                                    </Tooltip>
                                </TableCell>
                                {!isMobile && <TableCell>{formatDate(resume.uploadDate)}</TableCell>}
                                {!isTablet && (
                                    <TableCell sx={{ maxWidth: '300px' }}>
                                        <Typography
                                            sx={{
                                                textOverflow: 'ellipsis',
                                                overflow: 'hidden',
                                                whiteSpace: 'nowrap',
                                                maxWidth: '100%',
                                            }}
                                        >
                                            {resume.description || '-'}
                                        </Typography>
                                    </TableCell>
                                )}
                                <TableCell align="right">
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'flex-end',
                                            gap: { xs: 0, sm: 1 },
                                            flexWrap: 'nowrap',
                                        }}
                                    >
                                        <IconButton
                                            color="primary"
                                            href={getFileUrl(resume.fileId)}
                                            target="_blank"
                                            size={isMobile ? 'small' : 'medium'}
                                            title="View resume"
                                        >
                                            <VisibilityIcon fontSize={isMobile ? 'small' : 'medium'} />
                                        </IconButton>
                                        <IconButton
                                            color="primary"
                                            onClick={() => handleEditClick(resume)}
                                            size={isMobile ? 'small' : 'medium'}
                                            title="Edit resume details"
                                        >
                                            <EditIcon fontSize={isMobile ? 'small' : 'medium'} />
                                        </IconButton>
                                        <IconButton
                                            color="error"
                                            onClick={() => handleDeleteClick(resume.$id, resume.fileId)}
                                            disabled={isDeleting}
                                            size={isMobile ? 'small' : 'medium'}
                                        >
                                            <DeleteIcon fontSize={isMobile ? 'small' : 'medium'} />
                                        </IconButton>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );

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
        <Box
            sx={{ px: { xs: 1, sm: 2 }, width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}
        >
            <Box
                display="flex"
                flexDirection={isMobile ? 'column' : 'row'}
                justifyContent="space-between"
                alignItems={isMobile ? 'flex-start' : 'center'}
                mb={3}
                gap={isMobile ? 2 : 0}
                sx={{ maxWidth: '100%' }}
            >
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    Resumes
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    component="label"
                    fullWidth={isMobile}
                >
                    {isMobile ? 'Upload' : 'Upload New Resume'}
                    <input type="file" hidden accept=".pdf" onChange={handleResumeFileChange} />
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    {success}
                </Alert>
            )}

            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3, width: '100%', overflow: 'hidden' }}>
                {/* Card view for mobile/tablet, Table view for desktop */}
                {isTablet ? renderCardView() : renderTableView()}
            </Paper>

            {/* Upload Dialog */}
            <Dialog open={uploadDialogOpen} onClose={handleUploadCancel} fullWidth maxWidth={isMobile ? 'sm' : 'xs'}>
                <DialogTitle>Upload New Resume</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        You are about to upload a new resume version. Please provide a description to help identify this
                        version.
                    </DialogContentText>
                    <Box display="flex" alignItems="center" mb={2} sx={{ overflow: 'hidden' }}>
                        <FileIcon sx={{ mr: 1, flexShrink: 0 }} />
                        <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {newResumeFile?.name}
                        </Typography>
                    </Box>
                    <TextField
                        fullWidth
                        label="Description (optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., Updated with recent project, Fixed formatting issues"
                        multiline
                        minRows={2}
                        maxRows={10}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleUploadCancel} disabled={isUploading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUploadConfirm}
                        color="primary"
                        disabled={isUploading}
                        startIcon={isUploading ? <CircularProgress size={20} /> : <UploadIcon />}
                    >
                        {isUploading ? 'Uploading...' : 'Upload'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                fullWidth={isMobile}
                maxWidth={isMobile ? 'sm' : 'xs'}
            >
                <DialogTitle>Delete Resume Version</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this resume version? This action cannot be undone.
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

            {/* Edit Dialog */}
            <Dialog
                open={editDialogOpen}
                onClose={handleEditCancel}
                maxWidth="sm"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            overflowX: 'hidden',
                            '& .MuiDialogContent-root': {
                                overflowX: 'hidden',
                            },
                        },
                    },
                }}
            >
                <DialogTitle>Edit Resume Details</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Edit the file name and description for this resume version.
                    </DialogContentText>
                    <TextField
                        fullWidth
                        label="File Name"
                        value={editFileName}
                        onChange={(e) => setEditFileName(e.target.value)}
                        sx={{ mb: 2 }}
                        required
                    />
                    <TextField
                        fullWidth
                        label="Description (optional)"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="e.g., Updated with recent project, Fixed formatting issues"
                        multiline
                        minRows={2}
                        maxRows={10}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleEditCancel} disabled={isEditing}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleEditConfirm}
                        color="primary"
                        disabled={isEditing || !editFileName.trim()}
                        startIcon={isEditing ? <CircularProgress size={20} /> : <SaveIcon />}
                    >
                        {isEditing ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ResumeManager;
