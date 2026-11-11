import { useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, CircularProgress, Divider, Grid, Paper, Skeleton, TextField, Typography } from '@mui/material';
import {
    Delete as DeleteIcon,
    Launch as LaunchIcon,
    Undo as UndoIcon,
    Upload as UploadIcon,
} from '@mui/icons-material';
import { FILE_RULES, acceptAttribute, fileUrl, getErrorMessage, getFieldErrors, validateFile } from '../../api';
import type { Profile } from '../../api';
import { useNotify } from '../../app/notifications/useNotify';
import { routes } from '../../app/routes';
import { ImagePreview } from '../../components/admin/ImagePreview';
import { LoadErrorAlert } from '../../components/admin/QueryStatus';
import { SortableChipList } from '../../components/admin/SortableChipList';
import { StatusAlerts } from '../../components/admin/StatusAlerts';
import { FALLBACK_PROFILE_IMAGE } from '../../config/site';
import { useFileField } from '../../hooks';
import { useActiveResume, useProfile, useSaveProfile } from '../../queries';

type ListField = 'pronouns' | 'education' | 'languages';
type DetailField = 'name' | 'email' | 'linkedin' | 'github';

const listFields: { field: ListField; title: string; inputLabel: string }[] = [
    { field: 'pronouns', title: 'Pronouns', inputLabel: 'Add Pronoun' },
    { field: 'education', title: 'Education', inputLabel: 'Add Education' },
    { field: 'languages', title: 'Languages', inputLabel: 'Add Language' },
];

const emptyEntries: Record<ListField, string> = { pronouns: '', education: '', languages: '' };

const FormSection = ({ title, children }: { title: string; children: ReactNode }) => (
    <Grid size={12}>
        <Typography variant="h6" gutterBottom>
            {title}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {children}
    </Grid>
);

const ResumeSummary = () => {
    const navigate = useNavigate();
    const activeResume = useActiveResume();

    return (
        <>
            <Typography variant="subtitle1" gutterBottom>
                Resume
            </Typography>

            <Box sx={{ mb: 2 }}>
                {activeResume.isPending ? (
                    <Skeleton animation="wave" height={24} width="60%" />
                ) : activeResume.isError ? (
                    <Typography variant="body2" sx={{ color: 'error.main' }}>
                        {getErrorMessage(activeResume.error)}
                    </Typography>
                ) : activeResume.data ? (
                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                        Public version: {activeResume.data.fileName}
                    </Typography>
                ) : (
                    <Typography variant="body2" sx={{ color: 'warning.main' }}>
                        No public resume yet. Upload one on the Resumes page.
                    </Typography>
                )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button variant="outlined" onClick={() => navigate(routes.admin.resumes)}>
                    Manage Resumes
                </Button>
                <Button variant="outlined" startIcon={<LaunchIcon />} href={routes.resume} target="_blank" rel="noopener">
                    Open Public Link
                </Button>
            </Box>
        </>
    );
};

/**
 * The editable form. Mounted only once the profile has loaded, so its state starts from the saved
 * values without an effect copying them in.
 */
const ProfileForm = ({ profile }: { profile: Profile | null }) => {
    const notify = useNotify();
    const saveProfile = useSaveProfile();
    // The version this form was opened from (or last saved as); the save refuses to overwrite newer edits.
    const [baseline, setBaseline] = useState(profile);
    const [details, setDetails] = useState<Record<DetailField, string>>({
        name: profile?.name ?? '',
        email: profile?.email ?? '',
        linkedin: profile?.linkedin ?? '',
        github: profile?.github ?? '',
    });
    const [lists, setLists] = useState<Record<ListField, string[]>>({
        pronouns: profile?.pronouns ?? [],
        education: profile?.education ?? [],
        languages: profile?.languages ?? [],
    });
    const [entries, setEntries] = useState(emptyEntries);
    const photo = useFileField(fileUrl(baseline?.profileImageId ?? null));

    const fieldErrors = getFieldErrors(saveProfile.error);

    const handleDetailChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setDetails((current) => ({ ...current, [name]: value }));
    };

    const handleAddEntry = (field: ListField) => {
        const value = entries[field].trim();
        const isDuplicate = lists[field].some((item) => item.toLowerCase() === value.toLowerCase());

        if (value && !isDuplicate) {
            setLists((current) => ({ ...current, [field]: [...current[field], value] }));
        }

        setEntries((current) => ({ ...current, [field]: '' }));
    };

    const handlePhotoPick = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        // Clear the input so picking the same file again still fires a change event.
        event.target.value = '';

        if (!file) {
            return;
        }

        const invalid = validateFile(file, 'image');

        if (invalid) {
            notify.error(invalid);
            return;
        }

        photo.pick(file);
    };

    const handleSave = () => {
        saveProfile.mutate(
            { current: baseline, values: { ...details, ...lists }, photo: photo.change },
            {
                onSuccess: (saved) => {
                    setBaseline(saved);
                    photo.reset();
                    notify.success(baseline ? 'Profile saved' : 'Profile created');
                },
            }
        );
    };

    const textField = (field: DetailField, label: string, required = false) => (
        <TextField
            fullWidth
            label={label}
            name={field}
            value={details[field]}
            onChange={handleDetailChange}
            margin="normal"
            required={required}
            error={Boolean(fieldErrors[field])}
            helperText={fieldErrors[field]}
        />
    );

    return (
        <>
            <StatusAlerts error={saveProfile.error ? getErrorMessage(saveProfile.error) : undefined} />

            <Paper sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    <FormSection title="Basic Information">
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>{textField('name', 'Name', true)}</Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>{textField('email', 'Email', true)}</Grid>
                        </Grid>
                    </FormSection>

                    {listFields.map(({ field, title, inputLabel }) => (
                        <FormSection title={title} key={field}>
                            <SortableChipList
                                idPrefix={field}
                                items={lists[field]}
                                inputLabel={inputLabel}
                                inputValue={entries[field]}
                                error={fieldErrors[field]}
                                onInputChange={(value) => setEntries((current) => ({ ...current, [field]: value }))}
                                onAdd={() => handleAddEntry(field)}
                                onItemsChange={(items) => setLists((current) => ({ ...current, [field]: items }))}
                            />
                        </FormSection>
                    ))}

                    <FormSection title="Social Links">
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>{textField('linkedin', 'LinkedIn URL')}</Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>{textField('github', 'GitHub URL')}</Grid>
                        </Grid>
                    </FormSection>

                    <FormSection title="Files">
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Profile Image
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <ImagePreview
                                        src={photo.previewUrl ?? FALLBACK_PROFILE_IMAGE}
                                        alt={photo.previewUrl ? 'Profile preview' : 'Default profile image preview'}
                                        maxHeight={200}
                                    />
                                    {!photo.previewUrl && (
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            No profile image set &mdash; the site shows this default.
                                        </Typography>
                                    )}
                                </Box>

                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
                                        {photo.previewUrl ? 'Replace Image' : 'Upload Image'}
                                        <input
                                            type="file"
                                            hidden
                                            accept={acceptAttribute('image')}
                                            onChange={handlePhotoPick}
                                        />
                                    </Button>

                                    {photo.previewUrl && (
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            startIcon={<DeleteIcon />}
                                            onClick={photo.remove}
                                        >
                                            Remove Image
                                        </Button>
                                    )}

                                    {photo.isChanged && (
                                        <Button variant="text" startIcon={<UndoIcon />} onClick={photo.reset}>
                                            Undo
                                        </Button>
                                    )}
                                </Box>
                                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                                    {FILE_RULES.image.description}
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <ResumeSummary />
                            </Grid>
                        </Grid>
                    </FormSection>

                    <Grid size={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSave}
                                disabled={saveProfile.isPending}
                                size="large"
                            >
                                {saveProfile.isPending ? (
                                    <CircularProgress size={24} />
                                ) : baseline ? (
                                    'Save Changes'
                                ) : (
                                    'Create Profile'
                                )}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
        </>
    );
};

const ProfileSkeleton = () => (
    <Paper sx={{ p: 3 }}>
        {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} animation="wave" height={56} width="100%" sx={{ mb: 2 }} />
        ))}
    </Paper>
);

const ProfilePage = () => {
    const profile = useProfile();

    return (
        <Box>
            <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
                Profile
            </Typography>

            {profile.isPending ? (
                <ProfileSkeleton />
            ) : profile.isError ? (
                <LoadErrorAlert error={profile.error} onRetry={() => void profile.refetch()} />
            ) : (
                <ProfileForm profile={profile.data} />
            )}
        </Box>
    );
};

export default ProfilePage;
