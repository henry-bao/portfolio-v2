import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Models } from 'appwrite';

import { AuthProvider } from './context/AuthContext';
import { getSectionVisibility, SectionVisibility, sendPing } from './services/appwrite';
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

function App() {
    const [sectionVisibility, setSectionVisibility] = useState<(Models.Document & SectionVisibility) | null>(null);

    useEffect(() => {
        const checkConnectivity = async () => {
            try {
                await sendPing();
                console.log('Connected to Appwrite successfully');
            } catch (error) {
                console.error('Error connecting to Appwrite:', error);
            }
        };
        const fetchSectionVisibility = async () => {
            try {
                const visibility = await getSectionVisibility();
                setSectionVisibility(visibility);
            } catch (error) {
                console.error('Error fetching section visibility:', error);
            }
        };
        checkConnectivity();
        fetchSectionVisibility();
    }, []);

    return (
        <>
            <Router>
                <AuthProvider>
                    <Routes>
                        {/* Public Portfolio Routes */}
                        <Route path="/" element={<Portfolio sectionVisibility={sectionVisibility} />} />

                        {/* Blog routes - always available to prevent redirecting to NotFound */}
                        <Route path="/blogs" element={<BlogList sectionVisibility={sectionVisibility} />} />
                        <Route path="/blogs/:slug" element={<BlogPost sectionVisibility={sectionVisibility} />} />

                        <Route path="/admin/login" element={<Login />} />

                        <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />

                        <Route path="/admin" element={<ProtectedRoute />}>
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
                        <Route path="/resume-redirect" element={<ResumeRedirect />} />
                        {/* 404 Not Found Route */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </AuthProvider>
            </Router>
        </>
    );
}

export default App;
