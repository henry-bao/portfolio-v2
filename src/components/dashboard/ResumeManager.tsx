import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import {
    CheckCircle as ActiveIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Description as FileIcon,
    RadioButtonUnchecked as InactiveIcon,
    Save as SaveIcon,
    Upload as UploadIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { getFileUrl } from '../../services/storageService';
import {
    addResumeVersion,
    deleteResumeVersion,
    getResumeVersions,
    setResumeAsActive,
    updateResumeVersion,
} from '../../services/resumeService';
import type { ResumeVersionDocument } from '../../services/resumeService';
import { useBreakpoints } from '../../hooks';
import { formatShortDateTime } from '../../utils/dates';
import { ConfirmDialog, PageHeader, StatusAlerts } from '../shared';

const DESCRIPTION_PLACEHOLDER = 'e.g., Updated with recent project, Fixed formatting issues';

const DescriptionField = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <TextField
        fullWidth
        label="Description (optional)"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={DESCRIPTION_PLACEHOLDER}
        multiline
        minRows={2}
        maxRows={10}
    />
);

const ResumeManager = () => {
    const [resumeVersions, setResumeVersions] = useState<ResumeVersionDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [newResumeFile, setNewResumeFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const [resumeToDelete, setResumeToDelete] = useState<ResumeVersionDocument | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSettingActive, setIsSettingActive] = useState(false);

    const [resumeToEdit, setResumeToEdit] = useState<ResumeVersionDocument | null>(null);
    const [editDescription, setEditDescription] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const { isMobile, isTablet } = useBreakpoints();
    const visibleColumnCount = isMobile ? 3 : isTablet ? 4 : 5;

    const fetchResumeVersions = useCallback(async () => {
        setIsLoading(true);

        try {
            setResumeVersions(await getResumeVersions());
        } catch (error) {
            console.error('Error fetching resume versions:', error);
            setError('Failed to load resume versions');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchResumeVersions();
    }, [fetchResumeVersions]);

    const handleResumeFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (file.type !== 'application/pdf') {
            setError('Only PDF files are supported');
            return;
        }

        setNewResumeFile(file);
        setUploadDialogOpen(true);
    };

    const handleUploadCancel = () => {
        setUploadDialogOpen(false);
        setNewResumeFile(null);
        setDescription('');
    };

    const handleUploadConfirm = async () => {
        if (!newResumeFile) {
            return;
        }

        setIsUploading(true);
        setError('');
        setSuccess('');

        try {
            await addResumeVersion(newResumeFile, description);
            setSuccess('Resume uploaded successfully');
            handleUploadCancel();
            await fetchResumeVersions();
        } catch (error) {
            console.error('Error uploading resume:', error);
            setError('Failed to upload resume');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!resumeToDelete) {
            return;
        }

        setIsDeleting(true);

        try {
            await deleteResumeVersion(resumeToDelete.$id, resumeToDelete.fileId);
            setSuccess('Resume deleted successfully');
            setResumeToDelete(null);
            await fetchResumeVersions();
        } catch (error) {
            console.error('Error deleting resume:', error);
            setError('Failed to delete resume');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditClick = (resume: ResumeVersionDocument) => {
        setResumeToEdit(resume);
        setEditDescription(resume.description || '');
    };

    const handleEditCancel = () => {
        setResumeToEdit(null);
        setEditDescription('');
    };

    const handleEditConfirm = async () => {
        if (!resumeToEdit) {
            return;
        }

        setIsEditing(true);
        setError('');
        setSuccess('');

        try {
            await updateResumeVersion(resumeToEdit.$id, { description: editDescription });
            setSuccess('Resume updated successfully');
            handleEditCancel();
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

    const iconSize = isMobile ? 'small' : 'medium';
    const compactChipLabelSx = { '& .MuiChip-label': { padding: isTablet ? 0.6 : undefined } };

    return (
        <Box>
            <PageHeader
                title="Resumes"
                action={
                    <Button variant="contained" color="primary" startIcon={<AddIcon />} component="label">
                        Upload
                        <input type="file" hidden accept=".pdf" onChange={handleResumeFileChange} />
                    </Button>
                }
            />

            <StatusAlerts error={error} success={success} />

            <Paper sx={{ mb: 3 }}>
                <TableContainer sx={{ overflowX: 'auto', overflow: 'hidden' }}>
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
                            {isLoading || resumeVersions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={visibleColumnCount} align="center">
                                        {isLoading ? (
                                            <CircularProgress />
                                        ) : (
                                            'No resume versions found. Upload your first resume!'
                                        )}
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
                                                    sx={compactChipLabelSx}
                                                />
                                            ) : (
                                                <Chip
                                                    icon={<InactiveIcon />}
                                                    label={isTablet ? '' : 'Set Active'}
                                                    color="default"
                                                    variant="outlined"
                                                    onClick={() => handleSetActive(resume.$id)}
                                                    disabled={isSettingActive}
                                                    sx={{ cursor: 'pointer', ...compactChipLabelSx }}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ wordBreak: 'break-word' }}>{resume.fileName}</TableCell>
                                        {!isMobile && <TableCell>{formatShortDateTime(resume.uploadDate)}</TableCell>}
                                        {!isTablet && <TableCell>{resume.description || '-'}</TableCell>}
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
                                                    size={iconSize}
                                                    title="View resume"
                                                >
                                                    <VisibilityIcon fontSize={iconSize} />
                                                </IconButton>
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handleEditClick(resume)}
                                                    size={iconSize}
                                                    title="Edit resume details"
                                                >
                                                    <EditIcon fontSize={iconSize} />
                                                </IconButton>
                                                <IconButton
                                                    color="error"
                                                    onClick={() => setResumeToDelete(resume)}
                                                    disabled={isDeleting}
                                                    size={iconSize}
                                                    title="Delete resume"
                                                >
                                                    <DeleteIcon fontSize={iconSize} />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

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
                    <DescriptionField value={description} onChange={setDescription} />
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

            <ConfirmDialog
                open={Boolean(resumeToDelete)}
                title="Delete Resume Version"
                description="Are you sure you want to delete this resume version? This action cannot be undone."
                isBusy={isDeleting}
                onCancel={() => setResumeToDelete(null)}
                onConfirm={handleDeleteConfirm}
            />

            <Dialog
                open={Boolean(resumeToEdit)}
                onClose={handleEditCancel}
                maxWidth="sm"
                fullWidth
                slotProps={{
                    paper: {
                        sx: { overflowX: 'hidden', '& .MuiDialogContent-root': { overflowX: 'hidden' } },
                    },
                }}
            >
                <DialogTitle>Edit Resume Details</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Edit the file description for this resume version.
                    </DialogContentText>
                    <DescriptionField value={editDescription} onChange={setEditDescription} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleEditCancel} disabled={isEditing}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleEditConfirm}
                        color="primary"
                        disabled={isEditing}
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
