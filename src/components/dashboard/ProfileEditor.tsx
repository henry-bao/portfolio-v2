import { useState, useEffect, ChangeEvent } from 'react';
import { Box, Typography, TextField, Button, Grid, Paper, CircularProgress, Alert, Chip, Divider } from '@mui/material';
import { Add as AddIcon, Upload as UploadIcon } from '@mui/icons-material';
import {
    getProfileData,
    updateProfileData,
    createProfileData,
    uploadFile,
    deleteFile,
    ProfileData,
} from '../../services/appwrite';
import { getFilePreviewUrl } from '../../services/fileProxy';
import { Models } from 'appwrite';

// Helper function to map Appwrite document to ProfileData
const mapDocumentToProfileData = (doc: Models.Document): ProfileData => {
    return {
        name: doc.name || '',
        email: doc.email || '',
        pronouns: doc.pronouns || [],
        education: doc.education || [],
        languages: doc.languages || [],
        linkedin: doc.linkedin || '',
        github: doc.github || '',
        profileImageId: doc.profileImageId || undefined,
        resumeFileId: doc.resumeFileId || undefined,
    };
};

const ProfileEditor = () => {
    const [profile, setProfile] = useState<Models.Document | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [pronouns, setPronouns] = useState<string[]>([]);
    const [newPronoun, setNewPronoun] = useState('');
    const [education, setEducation] = useState<string[]>([]);
    const [newEducation, setNewEducation] = useState('');
    const [languages, setLanguages] = useState<string[]>([]);
    const [newLanguage, setNewLanguage] = useState('');
    const [linkedin, setLinkedin] = useState('');
    const [github, setGithub] = useState('');

    // File uploads
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [resumeFileName, setResumeFileName] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                const profileData = await getProfileData();

                if (profileData) {
                    setProfile(profileData);

                    // Map Appwrite document fields to our form fields
                    const mappedData = mapDocumentToProfileData(profileData);
                    setName(mappedData.name);
                    setEmail(mappedData.email);
                    setPronouns(mappedData.pronouns || []);
                    setEducation(mappedData.education || []);
                    setLanguages(mappedData.languages || []);
                    setLinkedin(mappedData.linkedin || '');
                    setGithub(mappedData.github || '');

                    // Load image preview if exists
                    if (mappedData.profileImageId) {
                        const imageUrl = getFilePreviewUrl(mappedData.profileImageId);
                        setProfileImagePreview(imageUrl);
                    }

                    // Set resume filename if exists
                    if (mappedData.resumeFileId) {
                        setResumeFileName('Resume.pdf'); // Default name, could be stored in metadata
                    }
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                setError('Failed to load profile data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleProfileImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfileImage(file);
            setProfileImagePreview(URL.createObjectURL(file));
        }
    };

    const handleResumeChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setResumeFile(file);
            setResumeFileName(file.name);
        }
    };

    const handleAddPronoun = () => {
        if (newPronoun.trim() !== '') {
            setPronouns([...pronouns, newPronoun.trim()]);
            setNewPronoun('');
        }
    };

    const handleRemovePronoun = (index: number) => {
        setPronouns(pronouns.filter((_, i) => i !== index));
    };

    const handleAddEducation = () => {
        if (newEducation.trim() !== '') {
            setEducation([...education, newEducation.trim()]);
            setNewEducation('');
        }
    };

    const handleRemoveEducation = (index: number) => {
        setEducation(education.filter((_, i) => i !== index));
    };

    const handleAddLanguage = () => {
        if (newLanguage.trim() !== '') {
            setLanguages([...languages, newLanguage.trim()]);
            setNewLanguage('');
        }
    };

    const handleRemoveLanguage = (index: number) => {
        setLanguages(languages.filter((_, i) => i !== index));
    };

    const handleSave = async () => {

        // Validate required fields
        if (!name.trim() || !email.trim()) {
            setError('Name and email are required');
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            // Get current values from profile document
            const currentProfileImageId = profile?.profileImageId;
            const currentResumeFileId = profile?.resumeFileId;

            let profileImageId = currentProfileImageId;
            let resumeFileId = currentResumeFileId;

            // Upload new profile image if changed
            if (profileImage) {
                // Delete old image if exists
                if (currentProfileImageId) {
                    await deleteFile(currentProfileImageId);
                }

                // Upload new image
                const uploadResult = await uploadFile(profileImage);
                profileImageId = uploadResult.$id;
            }

            // Upload new resume if changed
            if (resumeFile) {
                // Delete old resume if exists
                if (currentResumeFileId) {
                    await deleteFile(currentResumeFileId);
                }

                // Upload new resume
                const uploadResult = await uploadFile(resumeFile);
                resumeFileId = uploadResult.$id;
            }

            // Prepare profile data
            const profileData: ProfileData = {
                name,
                email,
                pronouns,
                education,
                languages,
                linkedin,
                github,
                profileImageId,
                resumeFileId,
            };


            let updatedProfile;
            if (profile) {
                // Update existing profile
                updatedProfile = await updateProfileData(profile.$id, profileData);
            } else {
                // Create new profile
                updatedProfile = await createProfileData(profileData);
            }

            setProfile(updatedProfile);
            setSuccess('Profile updated successfully');
        } catch (error) {
            console.error('Error saving profile:', error);
            setError('Failed to save profile data: ' + (error instanceof Error ? error.message : String(error)));
        } finally {
            setIsSaving(false);
        }
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
            <Typography variant="h4" component="h1" gutterBottom>
                {profile ? 'Edit Profile' : 'Create Profile'}
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}

            <Paper sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    {/* Basic Information */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Basic Information
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    margin="normal"
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    margin="normal"
                                    required
                                />
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Pronouns */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Pronouns
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Box display="flex" alignItems="center" mb={2}>
                            <TextField
                                fullWidth
                                label="Add Pronoun"
                                value={newPronoun}
                                onChange={(e) => setNewPronoun(e.target.value)}
                                margin="normal"
                            />
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleAddPronoun}
                                sx={{ ml: 2, mt: 1 }}
                            >
                                Add
                            </Button>
                        </Box>

                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {pronouns.map((pronoun, index) => (
                                <Chip
                                    key={index}
                                    label={pronoun}
                                    onDelete={() => handleRemovePronoun(index)}
                                    color="primary"
                                    variant="outlined"
                                />
                            ))}
                        </Box>
                    </Grid>

                    {/* Education */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Education
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Box display="flex" alignItems="center" mb={2}>
                            <TextField
                                fullWidth
                                label="Add Education"
                                value={newEducation}
                                onChange={(e) => setNewEducation(e.target.value)}
                                margin="normal"
                            />
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleAddEducation}
                                sx={{ ml: 2, mt: 1 }}
                            >
                                Add
                            </Button>
                        </Box>

                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {education.map((edu, index) => (
                                <Chip
                                    key={index}
                                    label={edu}
                                    onDelete={() => handleRemoveEducation(index)}
                                    color="primary"
                                    variant="outlined"
                                />
                            ))}
                        </Box>
                    </Grid>

                    {/* Languages */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Languages
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Box display="flex" alignItems="center" mb={2}>
                            <TextField
                                fullWidth
                                label="Add Language"
                                value={newLanguage}
                                onChange={(e) => setNewLanguage(e.target.value)}
                                margin="normal"
                            />
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleAddLanguage}
                                sx={{ ml: 2, mt: 1 }}
                            >
                                Add
                            </Button>
                        </Box>

                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {languages.map((language, index) => (
                                <Chip
                                    key={index}
                                    label={language}
                                    onDelete={() => handleRemoveLanguage(index)}
                                    color="primary"
                                    variant="outlined"
                                />
                            ))}
                        </Box>
                    </Grid>

                    {/* Social Links */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Social Links
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="LinkedIn URL"
                                    value={linkedin}
                                    onChange={(e) => setLinkedin(e.target.value)}
                                    margin="normal"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="GitHub URL"
                                    value={github}
                                    onChange={(e) => setGithub(e.target.value)}
                                    margin="normal"
                                />
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* File Uploads */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Files
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={3}>
                            {/* Profile Image */}
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Profile Image
                                </Typography>

                                {profileImagePreview && (
                                    <Box mb={2}>
                                        <img
                                            src={profileImagePreview}
                                            alt="Profile Preview"
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
                                    <input type="file" hidden accept="image/*" onChange={handleProfileImageChange} />
                                </Button>
                            </Grid>

                            {/* Resume */}
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Resume
                                </Typography>

                                {resumeFileName && (
                                    <Box mb={2} display="flex" alignItems="center">
                                        <Typography variant="body2">{resumeFileName}</Typography>
                                    </Box>
                                )}

                                <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
                                    Upload Resume
                                    <input type="file" hidden accept=".pdf" onChange={handleResumeChange} />
                                </Button>
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Save Button */}
                    <Grid item xs={12}>
                        <Box display="flex" justifyContent="flex-end" mt={2}>
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
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default ProfileEditor;
