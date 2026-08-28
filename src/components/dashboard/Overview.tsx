import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    FormControlLabel,
    Paper,
    Skeleton,
    Stack,
    Switch,
    Typography,
    alpha,
    useTheme,
} from '@mui/material';
import {
    Add as AddIcon,
    Article as ArticleIcon,
    Code as CodeIcon,
    Description as DescriptionIcon,
    Edit as EditIcon,
    Launch as LaunchIcon,
    Person as PersonIcon,
    Settings as SettingsIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { getBlogPosts } from '../../services/blogService';
import { getProfileData } from '../../services/profileService';
import { getProjects } from '../../services/projectService';
import { getResumeVersions } from '../../services/resumeService';
import { getSectionVisibility, updateSectionVisibility } from '../../services/visibilityService';
import type {
    BlogPostDocument,
    ProfileDocument,
    ProjectDocument,
    SectionVisibility,
    SectionVisibilityDocument,
} from '../../types';
import type { ResumeVersionDocument } from '../../services/resumeService';
import { routes } from '../../routes/paths';

const visibilityToggles: { section: keyof SectionVisibility; label: string }[] = [
    { section: 'about', label: 'About Section' },
    { section: 'projects', label: 'Projects Section' },
    { section: 'blogs', label: 'Blogs Section' },
];

const SectionTitle = ({ icon, title }: { icon: ReactNode; title: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ mr: 1, color: 'primary.main', display: 'flex' }}>{icon}</Box>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
            {title}
        </Typography>
    </Box>
);

interface StatCardProps {
    icon: ReactNode;
    title: string;
    isLoading: boolean;
    skeletonLines?: number;
    children: ReactNode;
}

const StatCard = ({ icon, title, isLoading, skeletonLines = 1, children }: StatCardProps) => (
    <Card sx={{ flex: 1, display: 'flex' }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <SectionTitle icon={icon} title={title} />
            {isLoading ? (
                <>
                    {Array.from({ length: skeletonLines }, (_, index) => (
                        <Skeleton key={index} animation="wave" height={24} width="70%" sx={{ mb: 1 }} />
                    ))}
                    <Skeleton animation="wave" height={36} width="40%" />
                </>
            ) : (
                children
            )}
        </CardContent>
    </Card>
);

const Overview = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<ProfileDocument | null>(null);
    const [projects, setProjects] = useState<ProjectDocument[]>([]);
    const [resumes, setResumes] = useState<ResumeVersionDocument[]>([]);
    const [blogPosts, setBlogPosts] = useState<BlogPostDocument[]>([]);
    const [sectionVisibility, setSectionVisibility] = useState<SectionVisibilityDocument | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchOverviewData = async () => {
            // Every card loads independently; one failing request should not blank the page.
            const [profileResult, projectsResult, resumesResult, blogsResult, visibilityResult] =
                await Promise.allSettled([
                    getProfileData(),
                    getProjects(),
                    getResumeVersions(),
                    getBlogPosts(false),
                    getSectionVisibility(),
                ]);

            if (!isMounted) {
                return;
            }

            const apply = <T,>(result: PromiseSettledResult<T>, label: string, setValue: (value: T) => void) => {
                if (result.status === 'fulfilled') {
                    setValue(result.value);
                } else {
                    console.error(`Error fetching ${label}:`, result.reason);
                }
            };

            apply(profileResult, 'profile data', setProfile);
            apply(projectsResult, 'projects', setProjects);
            apply(resumesResult, 'resumes', setResumes);
            apply(blogsResult, 'blog posts', setBlogPosts);
            apply(visibilityResult, 'section visibility', setSectionVisibility);
            setIsLoading(false);
        };

        void fetchOverviewData();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleVisibilityToggle = async (section: keyof SectionVisibility) => {
        if (!sectionVisibility) {
            return;
        }

        const nextValue = !sectionVisibility[section];

        try {
            await updateSectionVisibility(sectionVisibility.$id, { [section]: nextValue });
            setSectionVisibility({ ...sectionVisibility, [section]: nextValue });
        } catch (error) {
            console.error('Error updating section visibility:', error);
        }
    };

    return (
        <Box>
            <Typography variant="h4" component="h1" mb={3}>
                Overview
            </Typography>

            <Stack spacing={4}>
                <Card>
                    <CardContent>
                        <SectionTitle icon={<SettingsIcon />} title="Section Visibility" />

                        {isLoading ? (
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                                    gap: 2,
                                }}
                            >
                                {visibilityToggles.map(({ section }) => (
                                    <Skeleton key={section} animation="wave" height={48} />
                                ))}
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    justifyContent: 'space-around',
                                    gap: 2,
                                }}
                            >
                                {visibilityToggles.map(({ section, label }) => (
                                    <Paper
                                        key={section}
                                        sx={{ p: 2, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, flex: 1 }}
                                    >
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={sectionVisibility?.[section] ?? true}
                                                    onChange={() => handleVisibilityToggle(section)}
                                                    color="primary"
                                                />
                                            }
                                            label={
                                                <Typography variant="subtitle2" sx={{ fontSize: 20 }}>
                                                    {label}
                                                </Typography>
                                            }
                                            sx={{ m: 0, justifyContent: 'space-between' }}
                                        />
                                    </Paper>
                                ))}
                            </Box>
                        )}
                    </CardContent>
                </Card>

                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        justifyContent: 'space-between',
                        alignItems: 'stretch',
                        gap: 3,
                    }}
                >
                    <StatCard icon={<PersonIcon />} title="Profile" isLoading={isLoading} skeletonLines={2}>
                        {profile ? (
                            <>
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                    Name: {profile.name}
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 2 }}>
                                    Email: {profile.email}
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<EditIcon />}
                                    onClick={() => navigate(routes.admin.profile)}
                                >
                                    Edit
                                </Button>
                            </>
                        ) : (
                            <Typography variant="body1" color="text.secondary">
                                No profile data found. Create your profile to get started.
                            </Typography>
                        )}
                    </StatCard>

                    <StatCard icon={<CodeIcon />} title="Projects" isLoading={isLoading}>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Total Projects: {projects.length}
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate(routes.admin.projects)}
                        >
                            Manage
                        </Button>
                    </StatCard>

                    <StatCard icon={<ArticleIcon />} title="Blogs" isLoading={isLoading} skeletonLines={2}>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            Total Posts: {blogPosts.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Published: {blogPosts.filter((post) => post.published).length}
                        </Typography>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate(routes.admin.blogs)}>
                            Manage
                        </Button>
                    </StatCard>

                    <StatCard icon={<DescriptionIcon />} title="Resumes" isLoading={isLoading}>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Total Resumes: {resumes.length}
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate(routes.admin.resumes)}
                        >
                            Manage
                        </Button>
                    </StatCard>
                </Box>

                <Paper sx={{ p: 2 }}>
                    <SectionTitle icon={<VisibilityIcon />} title="Quick Actions" />
                    <Divider sx={{ mb: 3 }} />
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                        <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => navigate(routes.admin.profile)}
                        >
                            Update Profile
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => navigate(routes.admin.projectNew)}
                        >
                            Add New Project
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => navigate(routes.admin.blogNew)}
                        >
                            Create Blog Post
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<LaunchIcon />}
                            onClick={() => window.open(routes.home, '_blank')}
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
