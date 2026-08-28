import { useProfileData } from './hooks';
import { getFileUrl } from './services/storageService';
import type { SectionVisibility, SectionVisibilityDocument, SectionVisibilityStatus } from './types';
import { isSectionVisible } from './utils/sectionVisibility';

import Footer from './components/layout/Footer';
import Navbar from './components/layout/Navbar';
import About from './components/sections/About';
import Landing from './components/sections/Landing';
import Projects from './components/sections/Projects';
import Blog from './components/sections/Blog';

import './Portfolio.css';

interface PortfolioProps {
    sectionVisibility: SectionVisibilityDocument | null;
    sectionVisibilityStatus: SectionVisibilityStatus;
}

function Portfolio({ sectionVisibility, sectionVisibilityStatus }: PortfolioProps) {
    const { data: profile, loading: profileLoading } = useProfileData();

    const resumeUrl = profile?.resumeFileId ? getFileUrl(profile.resumeFileId) : null;

    const canShowSection = (section: keyof SectionVisibility) =>
        isSectionVisible(sectionVisibility, sectionVisibilityStatus, section);

    return (
        <>
            <Navbar sectionVisibility={sectionVisibility} sectionVisibilityStatus={sectionVisibilityStatus} />
            <main>
                <Landing />
                {canShowSection('about') && <About loading={profileLoading} profile={profile} />}
                {canShowSection('projects') && <Projects />}
                {canShowSection('blogs') && <Blog />}
            </main>
            <Footer resumeUrl={resumeUrl} isResumeLoading={profileLoading} />
        </>
    );
}

export default Portfolio;
