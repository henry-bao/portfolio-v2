import { useEffect, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, CircularProgress, Divider, Grid, Paper, Skeleton, TextField, Typography } from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { createProfileData, getProfileData, updateProfileData } from '../../services/profileService';
import {
    ALLOWED_DOCUMENT_TYPES,
    deleteFile,
    getFilePreviewUrl,
    uploadFile,
} from '../../services/storageService';
import { addResumeVersion, getActiveResumeVersion } from '../../services/resumeService';
import type { ProfileData, ProfileDocument } from '../../types';
import { routes } from '../../routes/paths';
import { useImagePreview } from '../../hooks';
import { StatusAlerts } from '../shared';
import { SortableChipList } from './SortableChipList';

type ListField = 'pronouns' | 'education' | 'languages';

const listFieldConfig: { field: ListField; title: string; inputLabel: string }[] = [
    { field: 'pronouns', title: 'Pronouns', inputLabel: 'Add Pronoun' },
    { field: 'education', title: 'Education', inputLabel: 'Add Education' },
    { field: 'languages', title: 'Languages', inputLabel: 'Add Language' },
];

const emptyLists: Record<ListField, string[]> = { pronouns: [], education: [], languages: [] };
const emptyDrafts: Record<ListField, string> = { pronouns: '', education: '', languages: '' };

const FormSection = ({ title, children }: { title: string; children: ReactNode }) => (
    <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
            {title}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {children}
    </Grid>
);

const TextFieldSkeleton = () => <Skeleton animation="wave" height={56} width="100%" sx={{ mb: 2 }} />;

const ProfileEditor = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<ProfileDocument | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [details, setDetails] = useState({ name: '', email: '', linkedin: '', github: '' });
    const [lists, setLists] = useState(emptyLists);
    const [drafts, setDrafts] = useState(emptyDrafts);

    const profileImage = useImagePreview();
    const { setRemoteUrl: setProfileImageRemoteUrl } = profileImage;
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [resumeFileName, setResumeFileName] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profileData = await getProfileData();

                if (!profileData) {
                    return;
                }

                setProfile(profileData);
                setDetails({
                    name: profileData.name || '',
                    email: profileData.email || '',
                    linkedin: profileData.linkedin || '',
                    github: profileData.github || '',
                });
                setLists({
                    pronouns: profileData.pronouns || [],
                    education: profileData.education || [],
                    languages: profileData.languages || [],
                });
                setProfileImageRemoteUrl(
                    profileData.profileImageId ? getFilePreviewUrl(profileData.profileImageId) : null
                );

                const activeResume = await getActiveResumeVersion();
                setResumeFileName(activeResume?.fileName ?? (profileData.resumeFileId ? 'Resume.pdf' : null));
            } catch (error) {
                console.error('Error fetching profile:', error);
                setError('Failed to load profile data');
            } finally {
                setIsLoading(false);
            }
        };

        void fetchProfile();
    }, [setProfileImageRemoteUrl]);

    const handleDetailChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setDetails((current) => ({ ...current, [name]: value }));
    };

    const handleAddListItem = (field: ListField) => {
        const value = drafts[field].trim();

        if (!value) {
            return;
        }

        setLists((current) => ({ ...current, [field]: [...current[field], value] }));
        setDrafts((current) => ({ ...current, [field]: '' }));
    };

    const handleResumeChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            setResumeFile(file);
            setResumeFileName(file.name);
        }
    };

    /** Uploads the picked resume, falling back to a plain file upload if versioning fails. */
    const resolveResumeFileId = async (currentResumeFileId?: string) => {
        if (!resumeFile) {
            return currentResumeFileId ?? (await getActiveResumeVersion())?.fileId;
        }

        try {
            return (await addResumeVersion(resumeFile, 'Uploaded from Profile Editor', true)).fileId;
        } catch (error) {
            console.error('Error adding resume to versioning system:', error);

            if (currentResumeFileId) {
                await deleteFile(currentResumeFileId);
            }

            return (await uploadFile(resumeFile, { allowedTypes: ALLOWED_DOCUMENT_TYPES })).$id;
        }
    };

    const handleSave = async () => {
        if (!details.name.trim() || !details.email.trim()) {
            setError('Name and email are required');
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            let profileImageId = profile?.profileImageId;

            if (profileImage.file) {
                if (profileImageId) {
                    await deleteFile(profileImageId);
                }

                profileImageId = (await uploadFile(profileImage.file)).$id;
            }

            const profileData: ProfileData = {
                ...details,
                ...lists,
                profileImageId,
                resumeFileId: await resolveResumeFileId(profile?.resumeFileId),
            };

            const updatedProfile = profile
                ? await updateProfileData(profile.$id, profileData)
                : await createProfileData(profileData);

            setProfile(updatedProfile as unknown as ProfileDocument);
            setSuccess('Profile updated successfully');
        } catch (error) {
            console.error('Error saving profile:', error);
            setError(`Failed to save profile data: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Box>
            <Typography variant="h4" component="h1" mb={3}>
                Profile
            </Typography>

            <StatusAlerts error={error} success={success} />

            <Paper sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    <FormSection title="Basic Information">
                        <Grid container spacing={2}>
                            {(['name', 'email'] as const).map((field) => (
                                <Grid item xs={12} sm={6} key={field}>
                                    {isLoading ? (
                                        <TextFieldSkeleton />
                                    ) : (
                                        <TextField
                                            fullWidth
                                            label={field === 'name' ? 'Name' : 'Email'}
                                            name={field}
                                            value={details[field]}
                                            onChange={handleDetailChange}
                                            margin="normal"
                                            required
                                        />
                                    )}
                                </Grid>
                            ))}
                        </Grid>
                    </FormSection>

                    {listFieldConfig.map(({ field, title, inputLabel }) => (
                        <FormSection title={title} key={field}>
                            <SortableChipList
                                idPrefix={field}
                                items={lists[field]}
                                inputLabel={inputLabel}
                                inputValue={drafts[field]}
                                isLoading={isLoading}
                                onInputChange={(value) => setDrafts((current) => ({ ...current, [field]: value }))}
                                onAdd={() => handleAddListItem(field)}
                                onItemsChange={(items) => setLists((current) => ({ ...current, [field]: items }))}
                            />
                        </FormSection>
                    ))}

                    <FormSection title="Social Links">
                        <Grid container spacing={2}>
                            {(['linkedin', 'github'] as const).map((field) => (
                                <Grid item xs={12} sm={6} key={field}>
                                    {isLoading ? (
                                        <TextFieldSkeleton />
                                    ) : (
                                        <TextField
                                            fullWidth
                                            label={field === 'linkedin' ? 'LinkedIn URL' : 'GitHub URL'}
                                            name={field}
                                            value={details[field]}
                                            onChange={handleDetailChange}
                                            margin="normal"
                                        />
                                    )}
                                </Grid>
                            ))}
                        </Grid>
                    </FormSection>

                    <FormSection title="Files">
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Profile Image
                                </Typography>

                                {isLoading ? (
                                    <Box mb={2}>
                                        <Skeleton
                                            animation="wave"
                                            variant="rectangular"
                                            height={150}
                                            width="100%"
                                            sx={{ mb: 2 }}
                                        />
                                        <Skeleton animation="wave" height={36} width={120} />
                                    </Box>
                                ) : (
                                    <>
                                        {profileImage.previewUrl && (
                                            <Box mb={2}>
                                                <img
                                                    src={profileImage.previewUrl}
                                                    alt="Profile preview"
                                                    style={{
                                                        maxWidth: '100%',
                                                        maxHeight: '200px',
                                                        display: 'block',
                                                        marginBottom: '10px',
                                                    }}
                                                />
                                            </Box>
                                        )}

                                        <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
                                            Upload Image
                                            <input
                                                type="file"
                                                hidden
                                                accept="image/*"
                                                onChange={(event) => {
                                                    const file = event.target.files?.[0];

                                                    if (file) {
                                                        profileImage.setFile(file);
                                                    }
                                                }}
                                            />
                                        </Button>
                                    </>
                                )}
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Resume
                                </Typography>

                                {isLoading ? (
                                    <Box mb={2}>
                                        <Skeleton animation="wave" height={24} width="60%" sx={{ mb: 2 }} />
                                        <Box display="flex" gap={2}>
                                            <Skeleton animation="wave" height={36} width={120} />
                                            <Skeleton animation="wave" height={36} width={150} />
                                        </Box>
                                    </Box>
                                ) : (
                                    <>
                                        {resumeFileName && (
                                            <Box mb={2}>
                                                <Typography variant="body2">{resumeFileName}</Typography>
                                            </Box>
                                        )}

                                        <Box display="flex" gap={2}>
                                            <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
                                                Upload Resume
                                                <input type="file" hidden accept=".pdf" onChange={handleResumeChange} />
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="primary"
                                                onClick={() => navigate(routes.admin.resumes)}
                                            >
                                                Manage Resume Versions
                                            </Button>
                                        </Box>
                                    </>
                                )}
                            </Grid>
                        </Grid>
                    </FormSection>

                    <Grid item xs={12}>
                        <Box display="flex" justifyContent="flex-end" mt={2}>
                            {isLoading ? (
                                <Skeleton animation="wave" height={36} width={120} />
                            ) : (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    size="large"
                                >
                                    {isSaving ? (
                                        <CircularProgress size={24} />
                                    ) : profile ? (
                                        'Save Changes'
                                    ) : (
                                        'Create Profile'
                                    )}
                                </Button>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default ProfileEditor;
