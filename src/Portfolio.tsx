import { Models } from 'appwrite';
import { SectionVisibility } from './services/appwrite';
import { useProfileData } from './hooks/useAppwriteData';
import { getFileUrl } from './services/fileProxy';

import Footer from './components/layout/Footer';
import Navbar from './components/layout/Navbar';
import About from './components/sections/About';
import Landing from './components/sections/Landing';
import Projects from './components/sections/Projects';
import Blog from './components/sections/Blog';

import './Portfolio.css';

interface PortfolioProps {
    sectionVisibility: (Models.Document & SectionVisibility) | null;
    sectionVisibilityStatus: 'loading' | 'ready' | 'fallback';
}

function Portfolio({ sectionVisibility, sectionVisibilityStatus }: PortfolioProps) {
    const { data: profile, loading: profileLoading } = useProfileData();

    const resumeUrl = profile?.resumeFileId ? getFileUrl(profile.resumeFileId) : null;
    const isSectionVisible = (section: keyof SectionVisibility) => {
        if (sectionVisibilityStatus === 'loading') {
            return false;
        }

        return sectionVisibility ? sectionVisibility[section] : sectionVisibilityStatus === 'fallback';
    };

    return (
        <>
            <Navbar sectionVisibility={sectionVisibility} sectionVisibilityStatus={sectionVisibilityStatus} />
            <main>
                <Landing />
                {isSectionVisible('about') && <About loading={profileLoading} profile={profile} />}
                {isSectionVisible('projects') && <Projects />}
                {isSectionVisible('blogs') && <Blog />}
            </main>
            <Footer resumeUrl={resumeUrl} isResumeLoading={profileLoading} />
        </>
    );
}

export default Portfolio;
