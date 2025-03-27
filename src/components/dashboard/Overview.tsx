import { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, Button, Paper, Stack, Divider } from '@mui/material';
import { getProfileData, getProjects, ProfileData, ProjectData } from '../../services/appwrite';
import { Models } from 'appwrite';
import { useNavigate } from 'react-router-dom';
import { getResumeVersions, ResumeVersion } from '../../services/resumeService';
import { getBlogPosts, BlogPost } from '../../services/appwrite';

const Overview = () => {
    const [profileData, setProfileData] = useState<(Models.Document & ProfileData) | null>(null);
    const [projects, setProjects] = useState<(Models.Document & ProjectData)[]>([]);
    const [resumes, setResumes] = useState<(Models.Document & ResumeVersion)[]>([]);
    const [blogPosts, setBlogPosts] = useState<(Models.Document & BlogPost)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const profile = await getProfileData();
                const projectsList = await getProjects();
                const resumeList = await getResumeVersions();
                const blogs = await getBlogPosts(false); // Get all blogs including unpublished

                setProfileData(profile);
                setProjects(projectsList);
                setResumes(resumeList);
                setBlogPosts(blogs);
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
        <>
            <Typography variant="h4" component="h1" gutterBottom>
                Overview
            </Typography>

            <Box>
                <Stack spacing={3}>
                    {/* Top Cards Section - Flexbox layout */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 3,
                        }}
                    >
                        {/* Profile Summary Card */}
                        <Card
                            sx={{
                                flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 12px)' },
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <CardContent sx={{ flexGrow: 1 }}>
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

                        {/* Projects Summary Card */}
                        <Card
                            sx={{
                                flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 12px)' },
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <CardContent sx={{ flexGrow: 1 }}>
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

                        {/* Blog Posts Card */}
                        <Card
                            sx={{
                                flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 12px)' },
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="h6" gutterBottom>
                                    Blogs
                                </Typography>
                                <Typography variant="body1">Total Posts: {blogPosts.length}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Published: {blogPosts.filter((post) => post.published).length}
                                </Typography>
                                <Box mt={2}>
                                    <Button variant="contained" onClick={() => navigate('/admin/blogs')}>
                                        Manage Blogs
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Resumes Card */}
                        <Card
                            sx={{
                                flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 12px)' },
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="h6" gutterBottom>
                                    Resumes
                                </Typography>
                                <Typography variant="body1">Total Resumes: {resumes.length}</Typography>
                                <Box mt={2}>
                                    <Button variant="contained" onClick={() => navigate('/admin/resumes')}>
                                        Manage Resumes
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>

                    {/* Quick Actions Section */}
                    <Paper
                        elevation={1}
                        sx={{
                            p: 3,
                            borderRadius: 2,
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            Quick Actions
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 2,
                                flexWrap: 'wrap',
                                justifyContent: 'flex-start',
                            }}
                        >
                            <Button variant="outlined" onClick={() => navigate('/admin/profile')}>
                                Update Profile
                            </Button>
                            <Button variant="outlined" onClick={() => navigate('/admin/projects/new')}>
                                Add New Project
                            </Button>
                            <Button variant="outlined" onClick={() => navigate('/admin/blogs/new')}>
                                Create Blog Post
                            </Button>
                            <Button variant="outlined" onClick={() => window.open('/', '_blank')}>
                                View Portfolio
                            </Button>
                        </Box>
                    </Paper>
                </Stack>
            </Box>
        </>
    );
};

export default Overview;
