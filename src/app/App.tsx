import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Analytics } from '@vercel/analytics/react';

import { createQueryClient } from '../queries';
import { theme } from '../theme';
import { ErrorBoundary } from '../components/shared';
import { NotificationsProvider } from './notifications/NotificationsProvider';
import RequireAdmin from './RequireAdmin';
import ScrollToTop from './ScrollToTop';
import { routes } from './routes';

import HomePage from '../pages/HomePage';
import BlogListPage from '../pages/BlogListPage';
import BlogPostPage from '../pages/BlogPostPage';
import ResumePage from '../pages/ResumePage';
import NotFoundPage from '../pages/NotFoundPage';
import LoginPage from '../pages/admin/LoginPage';
import AdminLayout from '../pages/admin/AdminLayout';
import OverviewPage from '../pages/admin/OverviewPage';
import ProfilePage from '../pages/admin/ProfilePage';
import ProjectsPage from '../pages/admin/ProjectsPage';
import ProjectEditorPage from '../pages/admin/ProjectEditorPage';
import ResumesPage from '../pages/admin/ResumesPage';
import BlogPostsPage from '../pages/admin/BlogPostsPage';
import BlogEditorPage from '../pages/admin/BlogEditorPage';

function App() {
    const [queryClient] = useState(createQueryClient);

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Analytics />
                <NotificationsProvider>
                    <BrowserRouter>
                        <ScrollToTop />
                        <ErrorBoundary fallback={<NotFoundPage />}>
                            <Routes>
                                <Route path={routes.home} element={<HomePage />} />
                                <Route path={routes.blogs} element={<BlogListPage />} />
                                <Route path={routes.blogPost} element={<BlogPostPage />} />
                                <Route path={routes.resume} element={<ResumePage />} />
                                <Route path={routes.resumeLegacy} element={<ResumePage />} />

                                <Route path={routes.admin.login} element={<LoginPage />} />
                                <Route path={routes.admin.root} element={<RequireAdmin />}>
                                    <Route element={<AdminLayout />}>
                                        <Route index element={<Navigate to={routes.admin.overview} replace />} />
                                        <Route path="overview" element={<OverviewPage />} />
                                        <Route path="profile" element={<ProfilePage />} />
                                        <Route path="projects" element={<ProjectsPage />} />
                                        <Route path="projects/new" element={<ProjectEditorPage />} />
                                        <Route path="projects/edit/:projectId" element={<ProjectEditorPage />} />
                                        <Route path="resumes" element={<ResumesPage />} />
                                        <Route path="blogs" element={<BlogPostsPage />} />
                                        <Route path="blogs/new" element={<BlogEditorPage />} />
                                        <Route path="blogs/edit/:postId" element={<BlogEditorPage />} />
                                    </Route>
                                </Route>

                                <Route path="*" element={<NotFoundPage />} />
                            </Routes>
                        </ErrorBoundary>
                    </BrowserRouter>
                </NotificationsProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default App;
