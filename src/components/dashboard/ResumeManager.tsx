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
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    CheckCircle as ActiveIcon,
    RadioButtonUnchecked as InactiveIcon,
    Description as FileIcon,
    Upload as UploadIcon,
} from '@mui/icons-material';
import { Models } from 'appwrite';
import { getFileUrl } from '../../services/fileProxy';
import {
    getResumeVersions,
    addResumeVersion,
    setResumeAsActive,
    deleteResumeVersion,
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
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Resume Manager
                </Typography>
                <Button variant="contained" color="primary" startIcon={<AddIcon />} component="label">
                    Upload New Resume
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

            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Status</TableCell>
                                <TableCell>File Name</TableCell>
                                <TableCell>Upload Date</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {resumeVersions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
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
                                                    label="Active"
                                                    color="success"
                                                    variant="outlined"
                                                />
                                            ) : (
                                                <Chip
                                                    icon={<InactiveIcon />}
                                                    label="Inactive"
                                                    color="default"
                                                    variant="outlined"
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center">
                                                <FileIcon sx={{ mr: 1 }} />
                                                {resume.fileName}
                                            </Box>
                                        </TableCell>
                                        <TableCell>{formatDate(resume.uploadDate)}</TableCell>
                                        <TableCell>{resume.description || '-'}</TableCell>
                                        <TableCell align="right">
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                href={getFileUrl(resume.fileId)}
                                                target="_blank"
                                                sx={{ mr: 1 }}
                                            >
                                                View
                                            </Button>
                                            {!resume.isActive && (
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleSetActive(resume.$id)}
                                                    disabled={isSettingActive}
                                                    sx={{ mr: 1 }}
                                                >
                                                    Set Active
                                                </Button>
                                            )}
                                            <IconButton
                                                color="error"
                                                onClick={() => handleDeleteClick(resume.$id, resume.fileId)}
                                                disabled={isDeleting}
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

            {/* Upload Dialog */}
            <Dialog open={uploadDialogOpen} onClose={handleUploadCancel}>
                <DialogTitle>Upload New Resume</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        You are about to upload a new resume version. Please provide a description to help identify this
                        version.
                    </DialogContentText>
                    <Box display="flex" alignItems="center" mb={2}>
                        <FileIcon sx={{ mr: 1 }} />
                        <Typography>{newResumeFile?.name}</Typography>
                    </Box>
                    <TextField
                        fullWidth
                        label="Description (optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., Updated with recent project, Fixed formatting issues"
                        multiline
                        rows={2}
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
            <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
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
        </Box>
    );
};

export default ResumeManager;
