import { useState, useEffect } from 'react';
import { Models } from 'appwrite';
import { getProfileData } from './services/appwrite';
import { getFileUrl, getFilePreviewUrl } from './services/fileProxy';
import { getActiveResumeVersion } from './services/resumeService';

import Footer from './components/layout/Footer';
import Navbar from './components/layout/Navbar';
import About from './components/sections/About';
import Landing from './components/sections/Landing';
import Projects from './components/sections/Projects';
import Blog from './components/sections/Blog';

import './Portfolio.css';

function Portfolio() {
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

                // Try to get active resume from versioning system first
                try {
                    const activeResume = await getActiveResumeVersion();
                    if (activeResume) {
                        const fileUrl = getFileUrl(activeResume.fileId);
                        setResumeUrl(fileUrl);
                    } else if (profileData && profileData.resumeFileId) {
                        // Fallback to profile's resumeFileId if no active resume
                        const fileUrl = getFileUrl(profileData.resumeFileId);
                        setResumeUrl(fileUrl);
                    }
                } catch (error) {
                    console.error('Error fetching active resume:', error);
                    // Fallback to profile's resumeFileId if error
                    if (profileData && profileData.resumeFileId) {
                        const fileUrl = getFileUrl(profileData.resumeFileId);
                        setResumeUrl(fileUrl);
                    }
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
            <Navbar />
            <main>
                <Landing />
                <About profile={profile} resumeUrl={resumeUrl} profileImageUrl={profileImageUrl} />
                <Projects />
                <Blog />
            </main>
            <Footer resumeUrl={resumeUrl} />
        </>
    );
}

export default Portfolio;
