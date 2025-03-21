import { useState, useEffect } from 'react';
import { Models } from 'appwrite';
import { getProfileData } from './services/appwrite';
import { getFileUrl, getFilePreviewUrl } from './services/fileProxy';

import Footer from './components/layout/Footer';
import Navbar from './components/layout/Navbar';
import About from './components/sections/About';
import Landing from './components/sections/Landing';
import Projects from './components/sections/Projects';

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
            <Navbar />
            <main>
                <Landing />
                <About profile={profile} resumeUrl={resumeUrl} profileImageUrl={profileImageUrl} />
                <Projects />
            </main>
            <Footer resumeUrl={resumeUrl} />
        </>
    );
}

export default Portfolio;
