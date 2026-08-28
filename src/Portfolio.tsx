import { useFooterMode, useProfileData } from './hooks';
import { getFileUrl } from './services/storageService';
import type { SectionVisibility, SectionVisibilityDocument, SectionVisibilityStatus } from './types';
import { classNames } from './utils/classNames';
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
    const footerMode = useFooterMode(sectionVisibilityStatus === 'loading');

    const resumeUrl = profile?.resumeFileId ? getFileUrl(profile.resumeFileId) : null;
    const footerClassName =
        footerMode === 'normal'
            ? undefined
            : classNames(
                  'footer--fixed-loading',
                  footerMode === 'entering' && 'footer--fixed-loading-enter',
                  footerMode === 'exiting' && 'footer--fixed-loading-exit'
              );

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
            <Footer className={footerClassName} resumeUrl={resumeUrl} isResumeLoading={profileLoading} />
        </>
    );
}

export default Portfolio;
