import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';

import { AuthProvider } from './context/AuthProvider';
import { getSectionVisibility, sendPing } from './services/appwrite';
import type { SectionVisibilityDocument } from './types';
import Portfolio from './Portfolio';
import ProtectedRoute from './components/dashboard/ProtectedRoute';
import Login from './components/dashboard/Login';
import DashboardLayout from './components/dashboard/DashboardLayout';
import Overview from './components/dashboard/Overview';
import ProfileEditor from './components/dashboard/ProfileEditor';
import ProjectsManager from './components/dashboard/ProjectsManager';
import ProjectEditor from './components/dashboard/ProjectEditor';
import ResumeManager from './components/dashboard/ResumeManager';
import BlogManager from './components/dashboard/BlogManager';
import BlogEditor from './components/dashboard/BlogEditor';
import BlogPost from './components/blog/BlogPost';
import BlogList from './components/blog/BlogList';
import NotFound from './components/NotFound';
import ResumeRedirect from './components/ResumeRedirect';
import PageChangeListener from './components/shared/PageChangeListener';
import { routes } from './routes/paths';

export type SectionVisibilityStatus = 'loading' | 'ready' | 'fallback';

function App() {
    const [sectionVisibility, setSectionVisibility] = useState<SectionVisibilityDocument | null>(null);
    const [sectionVisibilityStatus, setSectionVisibilityStatus] = useState<SectionVisibilityStatus>('loading');

    const fetchSectionVisibility = useCallback(async () => {
        try {
            const visibility = await getSectionVisibility();

            if (visibility) {
                setSectionVisibility(visibility);
                setSectionVisibilityStatus('ready');
                return;
            }

            setSectionVisibilityStatus((currentStatus) => (currentStatus === 'ready' ? currentStatus : 'fallback'));
        } catch (error) {
            console.error('Error fetching section visibility:', error);
            setSectionVisibilityStatus((currentStatus) => (currentStatus === 'ready' ? currentStatus : 'fallback'));
        }
    }, []);

    useEffect(() => {
        const checkConnectivity = async () => {
            try {
                await sendPing();
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
                    <Routes>
                        {/* Public Portfolio Routes */}
                        <Route
                            path={routes.home}
                            element={
                                <Portfolio
                                    sectionVisibility={sectionVisibility}
                                    sectionVisibilityStatus={sectionVisibilityStatus}
                                />
                            }
                        />

                        {/* Blog routes - always available to prevent redirecting to NotFound */}
                        <Route
                            path={routes.blogs}
                            element={
                                <BlogList
                                    sectionVisibility={sectionVisibility}
                                    sectionVisibilityStatus={sectionVisibilityStatus}
                                />
                            }
                        />
                        <Route
                            path={routes.blogPost}
                            element={
                                <BlogPost
                                    sectionVisibility={sectionVisibility}
                                    sectionVisibilityStatus={sectionVisibilityStatus}
                                />
                            }
                        />

                        <Route path={routes.admin.login} element={<Login />} />

                        <Route path={routes.admin.root} element={<Navigate to={routes.admin.overview} replace />} />

                        <Route path={routes.admin.root} element={<ProtectedRoute />}>
                            <Route element={<DashboardLayout />}>
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
                        <Route path={routes.resumeRedirect} element={<ResumeRedirect />} />
                        {/* 404 Not Found Route */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </AuthProvider>
            </Router>
        </>
    );
}

export default App;
