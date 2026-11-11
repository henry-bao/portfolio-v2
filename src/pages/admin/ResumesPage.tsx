import { useState } from 'react';
import type { ChangeEvent } from 'react';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControlLabel,
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
    ContentCopy as CopyIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Description as FileIcon,
    RadioButtonUnchecked as InactiveIcon,
    Save as SaveIcon,
    Upload as UploadIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { FILE_RULES, acceptAttribute, fileUrl, getErrorMessage, getFieldErrors, validateFile } from '../../api';
import type { Resume } from '../../api';
import { useNotify } from '../../app/notifications/useNotify';
import { routes } from '../../app/routes';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { PageHeader } from '../../components/admin/PageHeader';
import { LoadErrorAlert } from '../../components/admin/QueryStatus';
import { useBreakpoints } from '../../hooks';
import { formatShortDateTime } from '../../lib/dates';
import {
    useDeleteResume,
    useResumes,
    useSetActiveResume,
    useUpdateResumeDetails,
    useUploadResume,
} from '../../queries';

const DESCRIPTION_PLACEHOLDER = 'e.g., Updated with recent project, Fixed formatting issues';

const DescriptionField = ({
    value,
    error,
    onChange,
}: {
    value: string;
    error?: string;
    onChange: (value: string) => void;
}) => (
    <TextField
        fullWidth
        label="Description (optional)"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={DESCRIPTION_PLACEHOLDER}
        multiline
        minRows={2}
        maxRows={10}
        error={Boolean(error)}
        helperText={error}
    />
);

/** The canonical public link, with a button to copy it. */
const PublicLink = () => {
    const notify = useNotify();
    const publicUrl = `${window.location.origin}${routes.resume}`;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(publicUrl);
            notify.success('Link copied');
        } catch {
            notify.info(`Couldn't copy automatically. The link is ${publicUrl}`);
        }
    };

    return (
        <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Public link (always serves the active version):
            </Typography>
            <Typography
                component="a"
                href={routes.resume}
                target="_blank"
                rel="noopener"
                variant="body2"
                sx={{ wordBreak: 'break-all', color: 'primary.light' }}
            >
                {publicUrl}
            </Typography>
            <Button size="small" startIcon={<CopyIcon />} onClick={() => void copy()}>
                Copy
            </Button>
        </Paper>
    );
};

interface UploadDialogProps {
    file: File;
    /** No version exists yet, so this upload is necessarily the public one. */
    isFirstVersion: boolean;
    onClose: () => void;
}

const UploadDialog = ({ file, isFirstVersion, onClose }: UploadDialogProps) => {
    const notify = useNotify();
    const uploadResume = useUploadResume();
    const [description, setDescription] = useState('');
    const [activate, setActivate] = useState(true);

    const handleUpload = () => {
        uploadResume.mutate(
            { file, description, activate: activate || isFirstVersion },
            {
                onSuccess: ({ isActive }) => {
                    notify.success(isActive ? 'Uploaded and set as the public resume' : 'Resume uploaded');
                    onClose();
                },
            }
        );
    };

    return (
        <Dialog open onClose={uploadResume.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Upload New Resume</DialogTitle>
            <DialogContent>
                {uploadResume.error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {getErrorMessage(uploadResume.error)}
                    </Alert>
                )}
                <DialogContentText sx={{ mb: 2 }}>
                    Add a description to help you tell this version apart from the others.
                </DialogContentText>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FileIcon sx={{ mr: 1 }} />
                    <Typography sx={{ wordBreak: 'break-word' }}>{file.name}</Typography>
                </Box>
                <DescriptionField
                    value={description}
                    error={getFieldErrors(uploadResume.error).description}
                    onChange={setDescription}
                />
                <FormControlLabel
                    sx={{ mt: 1 }}
                    control={
                        <Checkbox
                            checked={activate || isFirstVersion}
                            disabled={isFirstVersion || uploadResume.isPending}
                            onChange={(event) => setActivate(event.target.checked)}
                        />
                    }
                    label={isFirstVersion ? 'This will be the public resume' : 'Make this the public resume'}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={uploadResume.isPending}>
                    Cancel
                </Button>
                <Button
                    onClick={handleUpload}
                    color="primary"
                    disabled={uploadResume.isPending}
                    startIcon={uploadResume.isPending ? <CircularProgress size={20} /> : <UploadIcon />}
                >
                    {uploadResume.isPending ? 'Uploading...' : 'Upload'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const EditDetailsDialog = ({ resume, onClose }: { resume: Resume; onClose: () => void }) => {
    const notify = useNotify();
    const updateDetails = useUpdateResumeDetails();
    const [fileName, setFileName] = useState(resume.fileName);
    const [description, setDescription] = useState(resume.description ?? '');
    const fieldErrors = getFieldErrors(updateDetails.error);

    const handleSave = () => {
        updateDetails.mutate(
            { rowId: resume.$id, values: { fileName, description } },
            {
                onSuccess: () => {
                    notify.success('Resume details saved');
                    onClose();
                },
            }
        );
    };

    return (
        <Dialog
            open
            onClose={updateDetails.isPending ? undefined : onClose}
            maxWidth="sm"
            fullWidth
            slotProps={{
                paper: { sx: { overflowX: 'hidden', '& .MuiDialogContent-root': { overflowX: 'hidden' } } },
            }}
        >
            <DialogTitle>Edit Resume Details</DialogTitle>
            <DialogContent>
                {updateDetails.error && !fieldErrors.fileName && !fieldErrors.description && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {getErrorMessage(updateDetails.error)}
                    </Alert>
                )}
                <DialogContentText sx={{ mb: 2 }}>
                    The name is only shown here. Visitors always download the file as the site&apos;s resume.
                </DialogContentText>
                <TextField
                    fullWidth
                    label="File name"
                    value={fileName}
                    onChange={(event) => setFileName(event.target.value)}
                    error={Boolean(fieldErrors.fileName)}
                    helperText={fieldErrors.fileName}
                    sx={{ mb: 2 }}
                />
                <DescriptionField value={description} error={fieldErrors.description} onChange={setDescription} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={updateDetails.isPending}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    color="primary"
                    disabled={updateDetails.isPending}
                    startIcon={updateDetails.isPending ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                    {updateDetails.isPending ? 'Saving...' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const ResumesPage = () => {
    const notify = useNotify();
    const { isMobile, isTablet } = useBreakpoints();
    const resumesQuery = useResumes();
    const setActiveResume = useSetActiveResume();
    const deleteResume = useDeleteResume();

    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [resumeToEdit, setResumeToEdit] = useState<Resume | null>(null);
    const [resumeToDelete, setResumeToDelete] = useState<Resume | null>(null);

    const resumes = resumesQuery.data ?? [];
    const visibleColumnCount = isMobile ? 3 : isTablet ? 4 : 5;
    const iconSize = isMobile ? 'small' : 'medium';
    const compactChipLabelSx = { '& .MuiChip-label': { padding: isTablet ? 0.6 : undefined } };

    const handleFilePick = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        // Clear the input so picking the same file again still opens the dialog.
        event.target.value = '';

        if (!file) {
            return;
        }

        const invalid = validateFile(file, 'pdf');

        if (invalid) {
            notify.error(invalid);
            return;
        }

        setFileToUpload(file);
    };

    const handleSetActive = (resume: Resume) => {
        setActiveResume.mutate(resume.$id, {
            onSuccess: () => notify.success(`"${resume.fileName}" is now the public resume`),
            onError: notify.error,
        });
    };

    const handleDeleteConfirm = () => {
        if (!resumeToDelete) {
            return;
        }

        deleteResume.mutate(resumeToDelete, {
            onSuccess: () => {
                notify.success('Resume deleted');
                setResumeToDelete(null);
            },
            onError: notify.error,
        });
    };

    const deleteDescription = resumeToDelete?.isActive
        ? `"${resumeToDelete.fileName}" is the public resume. If you delete it, the newest remaining version becomes the public resume. This can't be undone.`
        : `Delete "${resumeToDelete?.fileName ?? ''}"? This can't be undone.`;

    const renderRows = () => {
        if (resumesQuery.isPending || resumes.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={visibleColumnCount} align="center">
                        {resumesQuery.isPending ? <CircularProgress /> : 'No resume versions yet. Upload your first resume!'}
                    </TableCell>
                </TableRow>
            );
        }

        return resumes.map((resume) => (
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
                            onClick={() => handleSetActive(resume)}
                            disabled={setActiveResume.isPending}
                            sx={{ cursor: 'pointer', ...compactChipLabelSx }}
                        />
                    )}
                </TableCell>
                <TableCell sx={{ wordBreak: 'break-word' }}>{resume.fileName}</TableCell>
                {!isMobile && <TableCell>{formatShortDateTime(resume.uploadDate)}</TableCell>}
                {!isTablet && <TableCell sx={{ wordBreak: 'break-word' }}>{resume.description || '-'}</TableCell>}
                <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: { xs: 0, sm: 1 }, flexWrap: 'nowrap' }}>
                        <IconButton
                            component="a"
                            color="primary"
                            href={fileUrl(resume.fileId) ?? undefined}
                            disabled={!fileUrl(resume.fileId)}
                            target="_blank"
                            rel="noopener"
                            size={iconSize}
                            title="View this version"
                        >
                            <VisibilityIcon fontSize={iconSize} />
                        </IconButton>
                        <IconButton
                            color="primary"
                            onClick={() => setResumeToEdit(resume)}
                            size={iconSize}
                            title="Edit details"
                        >
                            <EditIcon fontSize={iconSize} />
                        </IconButton>
                        <IconButton
                            color="error"
                            onClick={() => setResumeToDelete(resume)}
                            disabled={deleteResume.isPending}
                            size={iconSize}
                            title="Delete this version"
                        >
                            <DeleteIcon fontSize={iconSize} />
                        </IconButton>
                    </Box>
                </TableCell>
            </TableRow>
        ));
    };

    return (
        <Box>
            <PageHeader
                title="Resumes"
                action={
                    <Button variant="contained" color="primary" startIcon={<AddIcon />} component="label">
                        Upload
                        <input type="file" hidden accept={acceptAttribute('pdf')} onChange={handleFilePick} />
                    </Button>
                }
            />

            <PublicLink />

            {resumesQuery.isError && (
                <LoadErrorAlert error={resumesQuery.error} onRetry={() => void resumesQuery.refetch()} />
            )}

            {!resumesQuery.isError && (
                <Paper sx={{ mb: 1 }}>
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
                            <TableBody>{renderRows()}</TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            <Typography variant="caption" sx={{ display: 'block', mb: 3, color: 'text.secondary' }}>
                {FILE_RULES.pdf.description}
            </Typography>

            {fileToUpload && (
                <UploadDialog
                    file={fileToUpload}
                    isFirstVersion={!resumesQuery.isPending && resumes.length === 0}
                    onClose={() => setFileToUpload(null)}
                />
            )}

            {resumeToEdit && <EditDetailsDialog resume={resumeToEdit} onClose={() => setResumeToEdit(null)} />}

            <ConfirmDialog
                open={Boolean(resumeToDelete)}
                title="Delete Resume Version"
                description={deleteDescription}
                isBusy={deleteResume.isPending}
                fullWidth={isMobile}
                onCancel={() => setResumeToDelete(null)}
                onConfirm={handleDeleteConfirm}
            />
        </Box>
    );
};

export default ResumesPage;
