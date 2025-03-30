import { useState, useEffect } from 'react';
import { Models } from 'appwrite';
import { getProfileData, getSectionVisibility, SectionVisibility } from './services/appwrite';
import { getFileUrl, getFilePreviewUrl } from './services/fileProxy';

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
    const [sectionVisibility, setSectionVisibility] = useState<(Models.Document & SectionVisibility) | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileData, visibilityData] = await Promise.all([getProfileData(), getSectionVisibility()]);

                setProfile(profileData);
                setSectionVisibility(visibilityData);

                if (profileData?.profileImageId) {
                    setProfileImageUrl(getFilePreviewUrl(profileData.profileImageId));
                }

                if (profileData?.resumeFileId) {
                    setResumeUrl(getFileUrl(profileData.resumeFileId));
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    return (
        <>
            <Navbar />
            <main>
                <Landing />
                {(!sectionVisibility || sectionVisibility.about) && (
                    <About profile={profile} resumeUrl={resumeUrl} profileImageUrl={profileImageUrl} />
                )}
                {(!sectionVisibility || sectionVisibility.projects) && <Projects />}
                {(!sectionVisibility || sectionVisibility.blogs) && <Blog />}
            </main>
            <Footer resumeUrl={resumeUrl} />
        </>
    );
}

export default Portfolio;
