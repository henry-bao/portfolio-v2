import { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, CircularProgress, Button, Paper } from '@mui/material';
import { getProfileData, getProjects, ProfileData, ProjectData } from '../../services/appwrite';
import { Models } from 'appwrite';
import { useNavigate } from 'react-router-dom';

const Overview = () => {
    const [profileData, setProfileData] = useState<(Models.Document & ProfileData) | null>(null);
    const [projects, setProjects] = useState<(Models.Document & ProjectData)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const profile = await getProfileData();
                const projectsList = await getProjects();

                setProfileData(profile);
                setProjects(projectsList);
            } catch (error) {
                console.error('Error fetching overview data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

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
                Overview
            </Typography>

            <Grid container spacing={3}>
                {/* Profile Summary Card */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Profile
                            </Typography>
                            {profileData ? (
                                <>
                                    <Typography variant="body1">Name: {profileData.name}</Typography>
                                    <Typography variant="body1">Email: {profileData.email}</Typography>
                                    <Box mt={2}>
                                        <Button variant="contained" onClick={() => navigate('/admin/profile')}>
                                            Edit Profile
                                        </Button>
                                    </Box>
                                </>
                            ) : (
                                <Typography variant="body1" color="text.secondary">
                                    No profile data found. Create your profile to get started.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Projects Summary Card */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Projects
                            </Typography>
                            <Typography variant="body1">Total Projects: {projects.length}</Typography>
                            <Box mt={2}>
                                <Button variant="contained" onClick={() => navigate('/admin/projects')}>
                                    Manage Projects
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Quick Actions */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3, mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Quick Actions
                        </Typography>
                        <Box display="flex" gap={2} flexWrap="wrap">
                            <Button variant="outlined" onClick={() => navigate('/admin/profile')}>
                                Update Profile
                            </Button>
                            <Button variant="outlined" onClick={() => navigate('/admin/projects/new')}>
                                Add New Project
                            </Button>
                            <Button variant="outlined" onClick={() => window.open('/', '_blank')}>
                                View Portfolio
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Overview;
