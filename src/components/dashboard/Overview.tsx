import { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Paper,
    Stack,
    Divider,
    Skeleton,
    Switch,
    FormControlLabel,
    useTheme,
    alpha,
} from '@mui/material';
import {
    getProfileData,
    getProjects,
    ProfileData,
    ProjectData,
    getSectionVisibility,
    updateSectionVisibility,
    SectionVisibility,
} from '../../services/appwrite';
import { Models } from 'appwrite';
import { useNavigate } from 'react-router-dom';
import { getResumeVersions, ResumeVersion } from '../../services/resumeService';
import { getBlogPosts, BlogPost } from '../../services/appwrite';
import {
    Visibility as VisibilityIcon,
    Person as PersonIcon,
    Code as CodeIcon,
    Article as ArticleIcon,
    Description as DescriptionIcon,
    Edit as EditIcon,
    Add as AddIcon,
    Launch as LaunchIcon,
    Settings as SettingsIcon,
} from '@mui/icons-material';

const Overview = () => {
    const theme = useTheme();
    const [profileData, setProfileData] = useState<(Models.Document & ProfileData) | null>(null);
    const [projects, setProjects] = useState<(Models.Document & ProjectData)[]>([]);
    const [resumes, setResumes] = useState<(Models.Document & ResumeVersion)[]>([]);
    const [blogPosts, setBlogPosts] = useState<(Models.Document & BlogPost)[]>([]);
    const [sectionVisibility, setSectionVisibility] = useState<(Models.Document & SectionVisibility) | null>(null);
    const [loading, setLoading] = useState({
        profile: true,
        projects: true,
        resumes: true,
        blogs: true,
        visibility: true,
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profile = await getProfileData();
                setProfileData(profile);
            } catch (error) {
                console.error('Error fetching profile data:', error);
            } finally {
                setLoading((prev) => ({ ...prev, profile: false }));
            }
        };

        const fetchProjects = async () => {
            try {
                const projectsList = await getProjects();
                setProjects(projectsList);
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading((prev) => ({ ...prev, projects: false }));
            }
        };

        const fetchResumes = async () => {
            try {
                const resumeList = await getResumeVersions();
                setResumes(resumeList);
            } catch (error) {
                console.error('Error fetching resumes:', error);
            } finally {
                setLoading((prev) => ({ ...prev, resumes: false }));
            }
        };

        const fetchBlogs = async () => {
            try {
                const blogs = await getBlogPosts(false);
                setBlogPosts(blogs);
            } catch (error) {
                console.error('Error fetching blog posts:', error);
            } finally {
                setLoading((prev) => ({ ...prev, blogs: false }));
            }
        };

        const fetchSectionVisibility = async () => {
            try {
                const visibility = await getSectionVisibility();
                setSectionVisibility(visibility);
            } catch (error) {
                console.error('Error fetching section visibility:', error);
            } finally {
                setLoading((prev) => ({ ...prev, visibility: false }));
            }
        };

        fetchProfile();
        fetchProjects();
        fetchResumes();
        fetchBlogs();
        fetchSectionVisibility();
    }, []);

    const handleVisibilityToggle = async (section: keyof SectionVisibility) => {
        if (!sectionVisibility) return;

        try {
            const newVisibility = {
                ...sectionVisibility,
                [section]: !sectionVisibility[section],
            };
            await updateSectionVisibility(sectionVisibility.$id, { [section]: newVisibility[section] });
            setSectionVisibility(newVisibility);
        } catch (error) {
            console.error('Error updating section visibility:', error);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Overview
                </Typography>
            </Box>

            <Stack spacing={4}>
                {/* Section Visibility Controls */}
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                Section Visibility
                            </Typography>
                        </Box>
                        {loading.visibility ? (
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                                    gap: 2,
                                }}
                            >
                                <Skeleton animation="wave" height={48} />
                                <Skeleton animation="wave" height={48} />
                                <Skeleton animation="wave" height={48} />
                                <Skeleton animation="wave" height={48} />
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                                    gap: 2,
                                }}
                            >
                                <Paper
                                    sx={{
                                        p: 2,

                                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                    }}
                                >
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={sectionVisibility?.about ?? true}
                                                onChange={() => handleVisibilityToggle('about')}
                                                color="primary"
                                            />
                                        }
                                        label={
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'flex-end',
                                                }}
                                            >
                                                <Typography variant="subtitle2" sx={{ fontSize: 20 }}>
                                                    About Section
                                                </Typography>
                                            </Box>
                                        }
                                        sx={{ m: 0, width: '100%', justifyContent: 'space-between' }}
                                    />
                                </Paper>

                                <Paper
                                    sx={{
                                        p: 2,

                                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                    }}
                                >
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={sectionVisibility?.projects ?? true}
                                                onChange={() => handleVisibilityToggle('projects')}
                                                color="primary"
                                            />
                                        }
                                        label={
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'flex-end',
                                                }}
                                            >
                                                <Typography variant="subtitle2" sx={{ fontSize: 20 }}>
                                                    Projects Section
                                                </Typography>
                                            </Box>
                                        }
                                        sx={{ m: 0, width: '100%', justifyContent: 'space-between' }}
                                    />
                                </Paper>

                                <Paper
                                    sx={{
                                        p: 2,

                                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                    }}
                                >
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={sectionVisibility?.blogs ?? true}
                                                onChange={() => handleVisibilityToggle('blogs')}
                                                color="primary"
                                            />
                                        }
                                        label={
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'flex-end',
                                                }}
                                            >
                                                <Typography variant="subtitle2" sx={{ fontSize: 20 }}>
                                                    Blogs Section
                                                </Typography>
                                            </Box>
                                        }
                                        sx={{ m: 0, width: '100%', justifyContent: 'space-between' }}
                                    />
                                </Paper>

                                <Paper
                                    sx={{
                                        p: 2,

                                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                    }}
                                >
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={sectionVisibility?.resumes ?? true}
                                                onChange={() => handleVisibilityToggle('resumes')}
                                                color="primary"
                                            />
                                        }
                                        label={
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'flex-end',
                                                }}
                                            >
                                                <Typography variant="subtitle2" sx={{ fontSize: 20 }}>
                                                    Resumes Section
                                                </Typography>
                                            </Box>
                                        }
                                        sx={{ m: 0, width: '100%', justifyContent: 'space-between' }}
                                    />
                                </Paper>
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {/* Stats Cards Section */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(4, 1fr)',
                        },
                        gap: 3,
                    }}
                >
                    {/* Profile Summary Card */}
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                    Profile
                                </Typography>
                            </Box>
                            {loading.profile ? (
                                <>
                                    <Skeleton animation="wave" height={24} width="60%" sx={{ mb: 1 }} />
                                    <Skeleton animation="wave" height={24} width="80%" sx={{ mb: 2 }} />
                                    <Skeleton animation="wave" height={36} width="40%" />
                                </>
                            ) : profileData ? (
                                <>
                                    <Typography variant="body1" sx={{ mb: 1 }}>
                                        Name: {profileData.name}
                                    </Typography>
                                    <Typography variant="body1" sx={{ mb: 2 }}>
                                        Email: {profileData.email}
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<EditIcon />}
                                        onClick={() => navigate('/admin/profile')}
                                    >
                                        Edit Profile
                                    </Button>
                                </>
                            ) : (
                                <Typography variant="body1" color="text.secondary">
                                    No profile data found. Create your profile to get started.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>

                    {/* Projects Summary Card */}
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <CodeIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                    Projects
                                </Typography>
                            </Box>
                            {loading.projects ? (
                                <>
                                    <Skeleton animation="wave" height={24} width="70%" sx={{ mb: 2 }} />
                                    <Skeleton animation="wave" height={36} width="40%" />
                                </>
                            ) : (
                                <>
                                    <Typography variant="body1" sx={{ mb: 2 }}>
                                        Total Projects: {projects.length}
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => navigate('/admin/projects')}
                                    >
                                        Manage Projects
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Blog Posts Card */}
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <ArticleIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                    Blogs
                                </Typography>
                            </Box>
                            {loading.blogs ? (
                                <>
                                    <Skeleton animation="wave" height={24} width="60%" sx={{ mb: 1 }} />
                                    <Skeleton animation="wave" height={24} width="40%" sx={{ mb: 2 }} />
                                    <Skeleton animation="wave" height={36} width="40%" />
                                </>
                            ) : (
                                <>
                                    <Typography variant="body1" sx={{ mb: 1 }}>
                                        Total Posts: {blogPosts.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Published: {blogPosts.filter((post) => post.published).length}
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => navigate('/admin/blogs')}
                                    >
                                        Manage Blogs
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Resumes Card */}
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                    Resumes
                                </Typography>
                            </Box>
                            {loading.resumes ? (
                                <>
                                    <Skeleton animation="wave" height={24} width="70%" sx={{ mb: 2 }} />
                                    <Skeleton animation="wave" height={36} width="40%" />
                                </>
                            ) : (
                                <>
                                    <Typography variant="body1" sx={{ mb: 2 }}>
                                        Total Resumes: {resumes.length}
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => navigate('/admin/resumes')}
                                    >
                                        Manage Resumes
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </Box>

                {/* Quick Actions Section */}
                <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <VisibilityIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 500 }}>
                            Quick Actions
                        </Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 2,
                            flexWrap: 'wrap',
                            justifyContent: 'flex-start',
                        }}
                    >
                        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate('/admin/profile')}>
                            Update Profile
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/admin/projects/new')}
                        >
                            Add New Project
                        </Button>
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => navigate('/admin/blogs/new')}>
                            Create Blog Post
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<LaunchIcon />}
                            onClick={() => window.open('/', '_blank')}
                        >
                            View Portfolio
                        </Button>
                    </Box>
                </Paper>
            </Stack>
        </Box>
    );
};

export default Overview;
