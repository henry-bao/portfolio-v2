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

function App() {
    return (
        <>
            <Router>
                <AuthProvider>
                    <Routes>
                        {/* Public Portfolio Routes */}
                        <Route path="/" element={<Portfolio />} />

                        <Route path="/admin/login" element={<Login />} />

                        <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />

                        <Route path="/admin" element={<ProtectedRoute />}>
                            <Route element={<DashboardLayout />}>
                                <Route path="overview" element={<Overview />} />
                                <Route path="profile" element={<ProfileEditor />} />
                                <Route path="projects" element={<ProjectsList />} />
                                <Route path="projects/new" element={<ProjectEditor />} />
                                <Route path="projects/edit/:projectId" element={<ProjectEditor />} />
                            </Route>
                        </Route>
                    </Routes>
                </AuthProvider>
            </Router>
            <Analytics />
        </>
    );
}

export default App;
