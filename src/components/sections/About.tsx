import { useMemo } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { getFilePreviewUrl } from '../../services/fileProxy';
import type { ProfileDocument } from '../../types';
import {
    fallbackProfileImage,
    fallbackResumeUrl,
    mapProfileDocumentToDisplayData,
} from '../../utils/profile';
import { ImageWithFallback } from '../shared';
import './About.css';

interface AboutProps {
    loading: boolean;
    profile: ProfileDocument | null;
}

const renderTokenList = (items: string[], separator = '&&') =>
    items.map((item, index) => (
        <span key={`${item}-${index}`}>
            <span className="r-string-color"> "{item}"</span>
            {index < items.length - 1 && <span style={{ color: '#59597f' }}>&nbsp;{separator}</span>}
        </span>
    ));

const renderEmail = (email: string) =>
    email.split(/([@.])/).map((part, index) =>
        part === '@' || part === '.' ? (
            <span key={`${part}-${index}`} style={{ color: '#59597f' }}>
                {part}
            </span>
        ) : (
            <span key={`${part}-${index}`}>{part}</span>
        )
    );

const About = ({ loading, profile }: AboutProps) => {
    const { displayData, resumeUrl, profileImageUrl } = useMemo(() => {
        const data = mapProfileDocumentToDisplayData(profile);
        const resume = profile?.resumeFileId ? getFilePreviewUrl(profile.resumeFileId) : fallbackResumeUrl;
        const profileImage = profile?.profileImageId ? getFilePreviewUrl(profile.profileImageId) : null;

        return {
            displayData: data,
            resumeUrl: resume,
            profileImageUrl: profileImage,
        };
    }, [profile]);

    if (loading) {
        return (
            <section id="about" className="about-css">
                <div className="about">
                    <h1 className="sec-title">About Me</h1>
                    <Box className="about-loading" aria-label="Loading profile">
                        <CircularProgress />
                    </Box>
                </div>
            </section>
        );
    }

    return (
        <section id="about" className="about-css">
            <div className="about">
                <h1 className="sec-title">About Me</h1>
                <div className="about-container">
                    <div className="my-pic-container">
                        <ImageWithFallback
                            className="my-pic"
                            src={profileImageUrl}
                            fallbackSrc={fallbackProfileImage}
                            alt="A picture of me (Henry Bao) in black and white"
                        />
                    </div>
                    <ul className="about-list">
                        <li>
                            name <span className="r-arrow-color">&lt;-</span>
                            <span className="r-string-color"> "{displayData.name}"</span>
                        </li>
                        <li>
                            pronouns <span className="r-arrow-color">&lt;-</span>
                            {renderTokenList(displayData.pronouns)}
                        </li>
                        <li>
                            education <span className="r-arrow-color">&lt;-</span>
                            {renderTokenList(displayData.education)}
                        </li>
                        <li>
                            languages <span className="r-arrow-color">&lt;-</span>{' '}
                            <span style={{ color: '#6b96b6' }}>c</span>
                            <span style={{ color: '#59597f' }}>(</span>
                            {displayData.languages.map((lang: string, index: number) => (
                                <span key={index}>
                                    <span className="r-string-color">"{lang}"</span>
                                    {index < displayData.languages.length - 1 && ', '}
                                </span>
                            ))}
                            <span style={{ color: '#59597f' }}>)</span>
                        </li>
                        <li>
                            resume <span className="r-arrow-color">&lt;-</span>
                            <a href={resumeUrl} target="_blank" rel="noopener" className="about-click">
                                {' download()'}
                            </a>
                        </li>
                        <li>
                            linkedin <span className="r-arrow-color">&lt;-</span>
                            <a href={displayData.linkedin} target="_blank" rel="noopener" className="about-click">
                                {' redirect()'}
                            </a>
                        </li>
                        <li>
                            github <span className="r-arrow-color">&lt;-</span>
                            <a href={displayData.github} target="_blank" rel="noopener" className="about-click">
                                {' redirect()'}
                            </a>
                        </li>
                        <li>
                            e-mail <span className="r-arrow-color">&lt;-</span>
                            <span className="r-string-color"> "{renderEmail(displayData.email)}"</span>
                        </li>
                    </ul>
                </div>
            </div>
        </section>
    );
};

export default About;
