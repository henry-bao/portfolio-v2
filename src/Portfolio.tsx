import { useState, useEffect } from 'react';
import type { Models } from 'appwrite';
import type { SectionVisibility } from './services/appwrite';
import { getFileUrl, getFilePreviewUrl } from './services/fileProxy';

import Footer from './components/layout/Footer';
import Navbar from './components/layout/Navbar';
import About from './components/sections/About';
import Landing from './components/sections/Landing';
import Projects from './components/sections/Projects';
import Blog from './components/sections/Blog';

import './Portfolio.css';

interface PortfolioProps {
    sectionVisibility: (Models.Document & SectionVisibility) | null;
}

function Portfolio({ sectionVisibility }: PortfolioProps) {
    const [resumeUrl, setResumeUrl] = useState<string | null>(null);
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
    const [profile, setProfile] = useState<Models.Document | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { getProfileData } = await import('./services/appwrite');
                const profileData = await getProfileData();
                setProfile(profileData);

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
            <Navbar sectionVisibility={sectionVisibility} />
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
