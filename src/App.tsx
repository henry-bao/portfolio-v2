import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import type { Models } from 'appwrite';

import { AuthProvider } from './context/AuthContext';
import type { SectionVisibility } from './services/appwrite';
import Portfolio from './Portfolio';
import NotFound from './components/NotFound';
import ResumeRedirect from './components/ResumeRedirect';
import PageChangeListener from './components/shared/PageChangeListener';

// Lazy-load all admin and blog routes to keep the public landing bundle lean
const BlogList = lazy(() => import('./components/blog/BlogList'));
const BlogPost = lazy(() => import('./components/blog/BlogPost'));

const Login = lazy(() => import('./components/dashboard/Login'));
const ProtectedRoute = lazy(() => import('./components/dashboard/ProtectedRoute'));
const DashboardLayout = lazy(() => import('./components/dashboard/DashboardLayout'));
const AdminThemeProvider = lazy(() => import('./components/dashboard/AdminThemeProvider'));
const Overview = lazy(() => import('./components/dashboard/Overview'));
const ProfileEditor = lazy(() => import('./components/dashboard/ProfileEditor'));
const ProjectsManager = lazy(() => import('./components/dashboard/ProjectsManager'));
const ProjectEditor = lazy(() => import('./components/dashboard/ProjectEditor'));
const ResumeManager = lazy(() => import('./components/dashboard/ResumeManager'));
const BlogManager = lazy(() => import('./components/dashboard/BlogManager'));
const BlogEditor = lazy(() => import('./components/dashboard/BlogEditor'));

function App() {
    const [sectionVisibility, setSectionVisibility] = useState<(Models.Document & SectionVisibility) | null>(null);

    const fetchSectionVisibility = useCallback(async () => {
        try {
            const { getSectionVisibility } = await import('./services/appwrite');
            const visibility = await getSectionVisibility();
            setSectionVisibility(visibility);
        } catch (error) {
            console.error('Error fetching section visibility:', error);
        }
    }, []);

    useEffect(() => {
        const checkConnectivity = async () => {
            try {
                const { sendPing } = await import('./services/appwrite');
                await sendPing();
                console.log('Connected to Appwrite successfully');
            } catch (error) {
                console.error('Error connecting to Appwrite:', error);
            }
        };

        checkConnectivity();
        fetchSectionVisibility();
    }, [fetchSectionVisibility]);

    return (
        <>
            <Router>
                <AuthProvider>
                    <PageChangeListener onPageChange={fetchSectionVisibility} />
                    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading...</div>}>
                        <Routes>
                            {/* Public Portfolio Routes */}
                            <Route path="/" element={<Portfolio sectionVisibility={sectionVisibility} />} />

                            {/* Blog routes - lazy loaded */}
                            <Route path="/blogs" element={<BlogList sectionVisibility={sectionVisibility} />} />
                            <Route path="/blogs/:slug" element={<BlogPost sectionVisibility={sectionVisibility} />} />

                            {/* Admin routes - lazy loaded */}
                            <Route path="/admin/login" element={<Login />} />
                            <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
                            <Route path="/admin" element={<ProtectedRoute />}>
                                <Route element={<AdminThemeProvider><DashboardLayout /></AdminThemeProvider>}>
                                    <Route path="overview" element={<Overview />} />
                                    <Route path="profile" element={<ProfileEditor />} />
                                    <Route path="projects" element={<ProjectsManager />} />
                                    <Route path="projects/new" element={<ProjectEditor />} />
                                    <Route path="projects/edit/:projectId" element={<ProjectEditor />} />
                                    <Route path="resumes" element={<ResumeManager />} />
                                    <Route path="blogs" element={<BlogManager />} />
                                    <Route path="blogs/new" element={<BlogEditor />} />
                                    <Route path="blogs/edit/:postId" element={<BlogEditor />} />
                                </Route>
                            </Route>
                            <Route path="/resume-redirect" element={<ResumeRedirect />} />
                            {/* 404 Not Found Route */}
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </Suspense>
                </AuthProvider>
            </Router>
        </>
    );
}

export default App;
