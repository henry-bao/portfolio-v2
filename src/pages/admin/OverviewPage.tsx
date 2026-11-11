import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
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
    Refresh as RefreshIcon,
    Settings as SettingsIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { getErrorMessage } from '../../api';
import type { SiteSection } from '../../api';
import { useNotify } from '../../app/notifications/useNotify';
import { routes } from '../../app/routes';
import { useAllPosts, useProfile, useProjects, useResumes, useSiteSettings, useUpdateSiteSettings } from '../../queries';

const visibilityToggles: { section: SiteSection; label: string }[] = [
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

/** The slice of a query result a card needs to show its own loading and error states. */
interface CardQuery {
    isPending: boolean;
    isError: boolean;
    error: unknown;
    refetch: () => unknown;
}

const RetryAlert = ({ query }: { query: CardQuery }) => (
    <Alert
        severity="error"
        action={
            <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={() => void query.refetch()}>
                Retry
            </Button>
        }
    >
        {getErrorMessage(query.error)}
    </Alert>
);

interface StatCardProps {
    icon: ReactNode;
    title: string;
    query: CardQuery;
    skeletonLines?: number;
    children: ReactNode;
}

/** One summary card. Each card loads, and fails, independently of the others. */
const StatCard = ({ icon, title, query, skeletonLines = 1, children }: StatCardProps) => (
    <Card sx={{ flex: 1, display: 'flex' }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <SectionTitle icon={icon} title={title} />
            {query.isPending ? (
                <>
                    {Array.from({ length: skeletonLines }, (_, index) => (
                        <Skeleton key={index} animation="wave" height={24} width="70%" sx={{ mb: 1 }} />
                    ))}
                    <Skeleton animation="wave" height={36} width="40%" />
                </>
            ) : query.isError ? (
                <RetryAlert query={query} />
            ) : (
                children
            )}
        </CardContent>
    </Card>
);

const ManageButton = ({ label = 'Manage', icon = <AddIcon />, to }: { label?: string; icon?: ReactNode; to: string }) => {
    const navigate = useNavigate();

    return (
        <Button variant="contained" startIcon={icon} onClick={() => navigate(to)} sx={{ alignSelf: 'flex-start' }}>
            {label}
        </Button>
    );
};

const SectionVisibilityCard = () => {
    const theme = useTheme();
    const notify = useNotify();
    const settings = useSiteSettings();
    const updateSettings = useUpdateSiteSettings();

    const handleToggle = (section: SiteSection) => {
        if (!settings.data) {
            return;
        }

        const visible = !settings.data[section];
        updateSettings.mutate({ [section]: visible }, { onError: notify.error });
    };

    return (
        <Card>
            <CardContent>
                <SectionTitle icon={<SettingsIcon />} title="Section Visibility" />

                {settings.isPending ? (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                        {visibilityToggles.map(({ section }) => (
                            <Skeleton key={section} animation="wave" height={48} />
                        ))}
                    </Box>
                ) : settings.isError ? (
                    <RetryAlert query={settings} />
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
                                            checked={settings.data[section]}
                                            onChange={() => handleToggle(section)}
                                            disabled={updateSettings.isPending}
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
    );
};

const ProfileCard = () => {
    const profile = useProfile();

    return (
        <StatCard icon={<PersonIcon />} title="Profile" query={profile} skeletonLines={2}>
            {profile.data ? (
                <>
                    <Typography variant="body1" sx={{ mb: 1, wordBreak: 'break-word' }}>
                        Name: {profile.data.name}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, wordBreak: 'break-word' }}>
                        Email: {profile.data.email}
                    </Typography>
                    <ManageButton label="Edit" icon={<EditIcon />} to={routes.admin.profile} />
                </>
            ) : (
                <>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                        No profile yet. The site shows built-in details until you create one.
                    </Typography>
                    <ManageButton label="Create" to={routes.admin.profile} />
                </>
            )}
        </StatCard>
    );
};

const ProjectsCard = () => {
    const projects = useProjects();

    return (
        <StatCard icon={<CodeIcon />} title="Projects" query={projects}>
            <Typography variant="body1" sx={{ mb: 2 }}>
                Total Projects: {projects.data?.length ?? 0}
            </Typography>
            <ManageButton to={routes.admin.projects} />
        </StatCard>
    );
};

const BlogsCard = () => {
    const posts = useAllPosts();
    const all = posts.data ?? [];

    return (
        <StatCard icon={<ArticleIcon />} title="Blogs" query={posts} skeletonLines={2}>
            <Typography variant="body1" sx={{ mb: 1 }}>
                Total Posts: {all.length}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Published: {all.filter((post) => post.published).length}
            </Typography>
            <ManageButton to={routes.admin.blogs} />
        </StatCard>
    );
};

const ResumesCard = () => {
    const resumes = useResumes();
    const all = resumes.data ?? [];
    const active = all.find((resume) => resume.isActive);

    return (
        <StatCard icon={<DescriptionIcon />} title="Resumes" query={resumes} skeletonLines={2}>
            <Typography variant="body1" sx={{ mb: 1 }}>
                Total Resumes: {all.length}
            </Typography>
            <Typography variant="body2" sx={{ color: active ? 'text.secondary' : 'warning.main', mb: 2, wordBreak: 'break-word' }}>
                {active ? `Public: ${active.fileName}` : 'No public resume'}
            </Typography>
            <ManageButton to={routes.admin.resumes} />
        </StatCard>
    );
};

const QuickActions = () => {
    const navigate = useNavigate();

    return (
        <Paper sx={{ p: 2 }}>
            <SectionTitle icon={<VisibilityIcon />} title="Quick Actions" />
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(routes.admin.profile)}>
                    Update Profile
                </Button>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => navigate(routes.admin.projectNew)}>
                    Add New Project
                </Button>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => navigate(routes.admin.blogNew)}>
                    Create Blog Post
                </Button>
                <Button variant="outlined" startIcon={<LaunchIcon />} href={routes.home} target="_blank" rel="noopener">
                    View Portfolio
                </Button>
            </Box>
        </Paper>
    );
};

const OverviewPage = () => (
    <Box>
        <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
            Overview
        </Typography>

        <Stack spacing={4}>
            <SectionVisibilityCard />

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    justifyContent: 'space-between',
                    alignItems: 'stretch',
                    gap: 3,
                }}
            >
                <ProfileCard />
                <ProjectsCard />
                <BlogsCard />
                <ResumesCard />
            </Box>

            <QuickActions />
        </Stack>
    </Box>
);

export default OverviewPage;
