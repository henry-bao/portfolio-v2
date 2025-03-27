import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';

import { AuthProvider } from './context/AuthContext';
import Portfolio from './Portfolio';
import ProtectedRoute from './components/dashboard/ProtectedRoute';
import Login from './components/dashboard/Login';
import DashboardLayout from './components/dashboard/DashboardLayout';
import Overview from './components/dashboard/Overview';
import ProfileEditor from './components/dashboard/ProfileEditor';
import ProjectsList from './components/dashboard/ProjectsList';
import ProjectEditor from './components/dashboard/ProjectEditor';
import ResumeManager from './components/dashboard/ResumeManager';
import BlogManager from './components/dashboard/BlogManager';
import BlogEditor from './components/dashboard/BlogEditor';
import BlogPost from './components/blog/BlogPost';
import BlogList from './components/blog/BlogList';
import NotFound from './components/NotFound';

function App() {
    return (
        <>
            <Router>
                <AuthProvider>
                    <Routes>
                        {/* Public Portfolio Routes */}
                        <Route path="/" element={<Portfolio />} />
                        <Route path="/blogs" element={<BlogList />} />
                        <Route path="/blogs/:slug" element={<BlogPost />} />

                        <Route path="/admin/login" element={<Login />} />

                        <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />

                        <Route path="/admin" element={<ProtectedRoute />}>
                            <Route element={<DashboardLayout />}>
                                <Route path="overview" element={<Overview />} />
                                <Route path="profile" element={<ProfileEditor />} />
                                <Route path="projects" element={<ProjectsList />} />
                                <Route path="projects/new" element={<ProjectEditor />} />
                                <Route path="projects/edit/:projectId" element={<ProjectEditor />} />
                                <Route path="resumes" element={<ResumeManager />} />
                                <Route path="blogs" element={<BlogManager />} />
                                <Route path="blogs/new" element={<BlogEditor />} />
                                <Route path="blogs/edit/:postId" element={<BlogEditor />} />
                            </Route>
                        </Route>

                        {/* 404 Not Found Route */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </AuthProvider>
            </Router>
            <Analytics />
        </>
    );
}

export default App;
