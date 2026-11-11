import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { CircularProgress } from '@mui/material';
import { getFileUrl } from '../../services/storageService';
import type { ProfileDocument } from '../../types';
import { FALLBACK_PROFILE_IMAGE, FALLBACK_RESUME_URL } from '../../utils/assets';
import { mapProfileDocumentToDisplayData } from '../../utils/profile';
import { ImageWithFallback } from '../shared';
import { Section, SectionTitle } from '../layout/Section';
import styles from './About.module.css';

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
                <span className={styles.string}> "{item}"</span>
                {index < items.length - 1 && <span className={styles.punctuation}>&nbsp;{separator}</span>}
            </span>
        ))}
    </>
);

/** Renders `c("a", "b")`. */
const TokenVector = ({ items }: { items: string[] }) => (
    <>
        <span className={styles.function}>c</span>
        <span className={styles.punctuation}>(</span>
        {items.map((item, index) => (
            <span key={`${item}-${index}`}>
                <span className={styles.string}>"{item}"</span>
                {index < items.length - 1 && ', '}
            </span>
        ))}
        <span className={styles.punctuation}>)</span>
    </>
);

/** Dims the `@` and `.` so the address reads as a string literal. */
const EmailTokens = ({ email }: { email: string }) => (
    <>
        {email.split(/([@.])/).map((part, index) =>
            part === '@' || part === '.' ? (
                <span key={`${part}-${index}`} className={styles.punctuation}>
                    {part}
                </span>
            ) : (
                <span key={`${part}-${index}`}>{part}</span>
            )
        )}
    </>
);

const AboutRow = ({ label, children }: { label: string; children: ReactNode }) => (
    <li className={styles.fact}>
        {label} <span className={styles.assign}>&lt;-</span>
        {children}
    </li>
);

const ExternalLink = ({ href, children }: { href: string; children: string }) => (
    <a href={href} target="_blank" rel="noopener" className={styles.link}>
        {children}
    </a>
);

const About = ({ loading, profile, resumeUrl }: AboutProps) => {
    const { displayData, profileImageUrl } = useMemo(
        () => ({
            displayData: mapProfileDocumentToDisplayData(profile),
            profileImageUrl: profile?.profileImageId ? getFileUrl(profile.profileImageId) : null,
        }),
        [profile]
    );

    return (
        <Section id="about" className={styles.about}>
            <div className={styles.content}>
                <SectionTitle>About Me</SectionTitle>

                {loading ? (
                    <div className={styles.loading} aria-label="Loading profile">
                        <CircularProgress />
                    </div>
                ) : (
                    <div className={styles.layout}>
                        <div className={styles.photoFrame}>
                            <ImageWithFallback
                                className={styles.photo}
                                src={profileImageUrl}
                                fallbackSrc={FALLBACK_PROFILE_IMAGE}
                                alt="A picture of me (Henry Bao) in black and white"
                            />
                        </div>
                        <ul className={styles.facts}>
                            <AboutRow label="name">
                                <span className={styles.string}> "{displayData.name}"</span>
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
                                <ExternalLink href={resumeUrl || FALLBACK_RESUME_URL}>{' download()'}</ExternalLink>
                            </AboutRow>
                            <AboutRow label="linkedin">
                                <ExternalLink href={displayData.linkedin}>{' redirect()'}</ExternalLink>
                            </AboutRow>
                            <AboutRow label="github">
                                <ExternalLink href={displayData.github}>{' redirect()'}</ExternalLink>
                            </AboutRow>
                            <AboutRow label="e-mail">
                                <span className={styles.string}>
                                    {' "'}
                                    <EmailTokens email={displayData.email} />
                                    {'"'}
                                </span>
                            </AboutRow>
                        </ul>
                    </div>
                )}
            </div>
        </Section>
    );
};

export default About;
