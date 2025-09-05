import { useMemo } from 'react';
import { useProfileData } from '../../hooks/useAppwriteData';
import { getFilePreviewUrl } from '../../services/fileProxy';
import type { ProfileDocument } from '../../types';
import './About.css';

interface DisplayData {
    name: string;
    pronouns: string[];
    education: string[];
    languages: string[];
    resumeFileId?: string;
    profileImageId?: string;
    linkedin: string;
    github: string;
    email: string;
}

// Helper function to map profile document to our display format
const mapDocumentToDisplayData = (doc: ProfileDocument): DisplayData => {
    return {
        name: doc.name || 'Henry Bao',
        pronouns: doc.pronouns || ['He', 'Him'],
        education: doc.education || ['MS @ Cornell', 'BS @ UW'],
        languages: doc.languages || ['Python', 'JavaScript/TypeScript', 'Swift', 'Java'],
        resumeFileId: doc.resumeFileId,
        profileImageId: doc.profileImageId,
        linkedin: doc.linkedin || 'https://www.linkedin.com/in/henglibao',
        github: doc.github || 'https://github.com/henry-bao',
        email: doc.email || 'henry@bao.dev',
    };
};

const About = () => {
    const { data: profile } = useProfileData();

    const { displayData, resumeUrl, profileImageUrl } = useMemo(() => {
        const data: DisplayData = profile
            ? mapDocumentToDisplayData(profile)
            : {
                  name: 'Henry Bao',
                  pronouns: ['He', 'Him'],
                  education: ['MS @ Cornell', 'BS @ UW'],
                  languages: ['Python', 'JavaScript/TypeScript', 'Swift', 'Java'],
                  linkedin: 'https://www.linkedin.com/in/henglibao',
                  github: 'https://github.com/henry-bao',
                  email: 'henry@bao.dev',
              };

        const resume = profile?.resumeFileId ? getFilePreviewUrl(profile.resumeFileId) : '/file/Resume.pdf';
        const profileImage = profile?.profileImageId ? getFilePreviewUrl(profile.profileImageId) : '/img/henry_800x800.png';

        return {
            displayData: data,
            resumeUrl: resume,
            profileImageUrl: profileImage
        };
    }, [profile]);

    return (
        <section id="about" className="about-css">
            <div className="about">
                <h1 className="sec-title">About Me</h1>
                <div className="about-container">
                    <div className="my-pic-container">
                        <img
                            className="my-pic"
                            src={profileImageUrl || '/img/henry_800x800.png'}
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
                            {displayData.pronouns.map((pronoun: string, index: number) => (
                                <span key={index}>
                                    <span className="r-string-color"> "{pronoun}"</span>
                                    {index < displayData.pronouns.length - 1 && (
                                        <span style={{ color: '#59597f' }}>&nbsp;&&</span>
                                    )}
                                </span>
                            ))}
                        </li>
                        <li>
                            education <span className="r-arrow-color">&lt;-</span>
                            {displayData.education.map((edu: string, index: number) => (
                                <span key={index}>
                                    <span className="r-string-color"> "{edu}"</span>
                                    {index < displayData.education.length - 1 && (
                                        <span style={{ color: '#59597f' }}>&nbsp;&&</span>
                                    )}
                                </span>
                            ))}
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
                            <a
                                href={resumeUrl || '/file/Resume.pdf'}
                                target="_blank"
                                rel="noopener"
                                className="about-click"
                            >
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
                            <span
                                className="r-string-color"
                                dangerouslySetInnerHTML={{
                                    __html: ` "${displayData.email
                                        .replace('@', '<span style="color: #59597f">@</span>')
                                        .replace('.', '<span style="color: #59597f">.</span>')}"`,
                                }}
                            />
                        </li>
                    </ul>
                </div>
            </div>
        </section>
    );
};

export default About;
