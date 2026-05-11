import { useEffect, useRef, useState } from 'react';
import { useProfileData } from './hooks/useAppwriteData';
import { getFileUrl } from './services/fileProxy';
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

type FooterMode = 'entering' | 'fixed' | 'exiting' | 'normal';
const MOBILE_FOOTER_QUERY = '(max-width: 768px)';

const getInitialFooterMode = (): FooterMode => {
    if (typeof window !== 'undefined' && window.matchMedia(MOBILE_FOOTER_QUERY).matches) {
        return 'normal';
    }

    return 'fixed';
};

function Portfolio({ sectionVisibility, sectionVisibilityStatus }: PortfolioProps) {
    const { data: profile, loading: profileLoading } = useProfileData();
    const isPageContentLoading = sectionVisibilityStatus === 'loading';
    const [footerMode, setFooterMode] = useState<FooterMode>(getInitialFooterMode);
    const footerReleaseTimeout = useRef<number | null>(null);

    const resumeUrl = profile?.resumeFileId ? getFileUrl(profile.resumeFileId) : null;
    const footerClassName =
        footerMode !== 'normal'
            ? classNames(
                  'footer--fixed-loading',
                  footerMode === 'entering' && 'footer--fixed-loading-enter',
                  footerMode === 'exiting' && 'footer--fixed-loading-exit'
              )
        : undefined;

    useEffect(() => {
        return () => {
            if (footerReleaseTimeout.current) {
                window.clearTimeout(footerReleaseTimeout.current);
            }
        };
    }, []);

    useEffect(() => {
        const clearFooterReleaseTimeout = () => {
            if (footerReleaseTimeout.current) {
                window.clearTimeout(footerReleaseTimeout.current);
                footerReleaseTimeout.current = null;
            }
        };

        if (!isPageContentLoading || window.matchMedia(MOBILE_FOOTER_QUERY).matches) {
            return;
        }

        clearFooterReleaseTimeout();
        setFooterMode('fixed');
    }, [isPageContentLoading]);

    useEffect(() => {
        if (isPageContentLoading) {
            return;
        }

        const mobileFooterMedia = window.matchMedia(MOBILE_FOOTER_QUERY);

        const clearFooterReleaseTimeout = () => {
            if (footerReleaseTimeout.current) {
                window.clearTimeout(footerReleaseTimeout.current);
                footerReleaseTimeout.current = null;
            }
        };

        const useNormalFooterOnMobile = () => {
            if (!mobileFooterMedia.matches) {
                return false;
            }

            clearFooterReleaseTimeout();
            setFooterMode('normal');
            return true;
        };

        const showFooterAtHero = () => {
            setFooterMode((currentMode) => {
                if (currentMode === 'fixed' || currentMode === 'entering') {
                    return currentMode;
                }

                clearFooterReleaseTimeout();
                footerReleaseTimeout.current = window.setTimeout(() => {
                    setFooterMode('fixed');
                    footerReleaseTimeout.current = null;
                }, 280);

                return 'entering';
            });
        };

        const moveFooterToPageBottom = () => {
            setFooterMode((currentMode) => {
                if (currentMode !== 'fixed') {
                    return currentMode;
                }

                clearFooterReleaseTimeout();
                footerReleaseTimeout.current = window.setTimeout(() => {
                    setFooterMode('normal');
                    footerReleaseTimeout.current = null;
                }, 360);

                return 'exiting';
            });
        };

        const syncFooterPlacement = () => {
            if (useNormalFooterOnMobile()) {
                return;
            }

            if (window.scrollY <= 1) {
                showFooterAtHero();
                return;
            }

            moveFooterToPageBottom();
        };

        syncFooterPlacement();
        window.addEventListener('scroll', syncFooterPlacement, { passive: true });
        mobileFooterMedia.addEventListener('change', syncFooterPlacement);

        return () => {
            window.removeEventListener('scroll', syncFooterPlacement);
            mobileFooterMedia.removeEventListener('change', syncFooterPlacement);
        };
    }, [isPageContentLoading]);

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
            <Footer
                className={footerClassName}
                resumeUrl={resumeUrl}
                isResumeLoading={profileLoading}
            />
        </>
    );
}

export default Portfolio;
