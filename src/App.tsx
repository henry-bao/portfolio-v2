import { useState, useEffect } from 'react';
import { Models } from 'appwrite';
import { getProfileData } from './services/appwrite';
import { getFileUrl, getFilePreviewUrl } from './services/fileProxy';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Navbar from './components/layout/Navbar';
import Landing from './components/sections/Landing';
import About from './components/sections/About';
import Projects from './components/sections/Projects';
import Footer from './components/layout/Footer';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/dashboard/ProtectedRoute';
import Login from './components/dashboard/Login';
import DashboardLayout from './components/dashboard/DashboardLayout';
import Overview from './components/dashboard/Overview';
import ProfileEditor from './components/dashboard/ProfileEditor';
import ProjectsList from './components/dashboard/ProjectsList';
import ProjectEditor from './components/dashboard/ProjectEditor';
import './App.css';

function App() {
    const [resumeUrl, setResumeUrl] = useState<string | null>(null);
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
    const [profile, setProfile] = useState<Models.Document | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profileData = await getProfileData();
                setProfile(profileData);

                // Get profile image if available
                if (profileData && profileData.profileImageId) {
                    const imageUrl = getFilePreviewUrl(profileData.profileImageId);
                    setProfileImageUrl(imageUrl);
                }

                // Get resume URL if available
                if (profileData && profileData.resumeFileId) {
                    const fileUrl = getFileUrl(profileData.resumeFileId);
                    setResumeUrl(fileUrl);
                }
            } catch (err) {
                console.error('Error fetching profile for About section:', err);
                // Continue with fallback values
            }
        };

        fetchProfile();
    }, []);

    return (
        <>
            <Router>
                <AuthProvider>
                    <Routes>
                        {/* Public Portfolio Routes */}
                        <Route
                            path="/"
                            element={
                                <>
                                    <Navbar />
                                    <main>
                                        <Landing />
                                        <About
                                            profile={profile}
                                            resumeUrl={resumeUrl}
                                            profileImageUrl={profileImageUrl}
                                        />
                                        <Projects />
                                    </main>
                                    <Footer resumeUrl={resumeUrl} />
                                </>
                            }
                        />

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
