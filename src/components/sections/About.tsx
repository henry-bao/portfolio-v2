import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { getFilePreviewUrl } from '../../services/storageService';
import type { ProfileDocument } from '../../types';
import { FALLBACK_PROFILE_IMAGE, FALLBACK_RESUME_URL } from '../../utils/assets';
import { mapProfileDocumentToDisplayData } from '../../utils/profile';
import { ImageWithFallback } from '../shared';
import './About.css';

interface AboutProps {
    loading: boolean;
    profile: ProfileDocument | null;
    resumeUrl: string | null;
}

/** Renders `"a" && "b"` the way the surrounding R-flavoured pseudo-code reads. */
const TokenList = ({ items, separator = '&&' }: { items: string[]; separator?: string }) => (
    <>
        {items.map((item, index) => (
            <span key={`${item}-${index}`}>
                <span className="r-string-color"> "{item}"</span>
                {index < items.length - 1 && <span className="r-punctuation-color">&nbsp;{separator}</span>}
            </span>
        ))}
    </>
);

/** Renders `c("a", "b")`. */
const TokenVector = ({ items }: { items: string[] }) => (
    <>
        <span className="r-function-color">c</span>
        <span className="r-punctuation-color">(</span>
        {items.map((item, index) => (
            <span key={`${item}-${index}`}>
                <span className="r-string-color">"{item}"</span>
                {index < items.length - 1 && ', '}
            </span>
        ))}
        <span className="r-punctuation-color">)</span>
    </>
);

/** Dims the `@` and `.` so the address reads as a string literal. */
const EmailTokens = ({ email }: { email: string }) => (
    <>
        {email.split(/([@.])/).map((part, index) =>
            part === '@' || part === '.' ? (
                <span key={`${part}-${index}`} className="r-punctuation-color">
                    {part}
                </span>
            ) : (
                <span key={`${part}-${index}`}>{part}</span>
            )
        )}
    </>
);

const AboutRow = ({ label, children }: { label: string; children: ReactNode }) => (
    <li>
        {label} <span className="r-arrow-color">&lt;-</span>
        {children}
    </li>
);

const ExternalLink = ({ href, children }: { href: string; children: string }) => (
    <a href={href} target="_blank" rel="noopener" className="about-click">
        {children}
    </a>
);

const About = ({ loading, profile, resumeUrl }: AboutProps) => {
    const { displayData, profileImageUrl } = useMemo(
        () => ({
            displayData: mapProfileDocumentToDisplayData(profile),
            profileImageUrl: profile?.profileImageId ? getFilePreviewUrl(profile.profileImageId) : null,
        }),
        [profile]
    );

    return (
        <section id="about" className="about-css">
            <div className="about">
                <h1 className="sec-title">About Me</h1>

                {loading ? (
                    <Box className="about-loading" aria-label="Loading profile">
                        <CircularProgress />
                    </Box>
                ) : (
                    <div className="about-container">
                        <div className="my-pic-container">
                            <ImageWithFallback
                                className="my-pic"
                                src={profileImageUrl}
                                fallbackSrc={FALLBACK_PROFILE_IMAGE}
                                alt="A picture of me (Henry Bao) in black and white"
                            />
                        </div>
                        <ul className="about-list">
                            <AboutRow label="name">
                                <span className="r-string-color"> "{displayData.name}"</span>
                            </AboutRow>
                            <AboutRow label="pronouns">
                                <TokenList items={displayData.pronouns} />
                            </AboutRow>
                            <AboutRow label="education">
                                <TokenList items={displayData.education} />
                            </AboutRow>
                            <AboutRow label="languages">
                                {' '}
                                <TokenVector items={displayData.languages} />
                            </AboutRow>
                            <AboutRow label="resume">
                                <ExternalLink href={resumeUrl || FALLBACK_RESUME_URL}>
                                    {' download()'}
                                </ExternalLink>
                            </AboutRow>
                            <AboutRow label="linkedin">
                                <ExternalLink href={displayData.linkedin}>{' redirect()'}</ExternalLink>
                            </AboutRow>
                            <AboutRow label="github">
                                <ExternalLink href={displayData.github}>{' redirect()'}</ExternalLink>
                            </AboutRow>
                            <AboutRow label="e-mail">
                                <span className="r-string-color">
                                    {' "'}
                                    <EmailTokens email={displayData.email} />
                                    {'"'}
                                </span>
                            </AboutRow>
                        </ul>
                    </div>
                )}
            </div>
        </section>
    );
};

export default About;
