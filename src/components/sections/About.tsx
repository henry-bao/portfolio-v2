import type { ReactNode } from 'react';
import { CircularProgress } from '@mui/material';
import { fileUrl } from '../../api';
import type { Profile } from '../../api';
import { routes } from '../../app/routes';
import { FALLBACK_PROFILE, FALLBACK_PROFILE_IMAGE } from '../../config/site';
import { useProfile } from '../../queries';
import { ImageWithFallback } from '../shared';
import { Section, SectionTitle } from '../layout/Section';
import styles from './About.module.css';

/**
 * Fills gaps from the built-in profile, so the section is never empty: everything when no profile
 * could be loaded, and blank text fields otherwise. Saved lists are shown as-is, even when empty.
 */
const withFallbacks = (profile: Profile | null | undefined) => {
    if (!profile) {
        return FALLBACK_PROFILE;
    }

    return {
        name: profile.name || FALLBACK_PROFILE.name,
        pronouns: profile.pronouns,
        education: profile.education,
        languages: profile.languages,
        linkedin: profile.linkedin ?? FALLBACK_PROFILE.linkedin,
        github: profile.github ?? FALLBACK_PROFILE.github,
        email: profile.email || FALLBACK_PROFILE.email,
    };
};

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

/** The leading space stays outside the link, so only the call itself is underlined. */
const ExternalLink = ({ href, children }: { href: string; children: string }) => (
    <>
        {' '}
        <a href={href} target="_blank" rel="noopener" className={styles.link}>
            {children}
        </a>
    </>
);

const About = () => {
    // A failed load falls through to the built-in profile rather than an error message.
    const { data: profile, isPending: loading } = useProfile();
    const displayData = withFallbacks(profile);
    const profileImageUrl = fileUrl(profile?.profileImageId);

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
                                {/* A plain link on purpose: /resume is a server redirect on Vercel. */}
                                <ExternalLink href={routes.resume}>download()</ExternalLink>
                            </AboutRow>
                            <AboutRow label="linkedin">
                                <ExternalLink href={displayData.linkedin}>redirect()</ExternalLink>
                            </AboutRow>
                            <AboutRow label="github">
                                <ExternalLink href={displayData.github}>redirect()</ExternalLink>
                            </AboutRow>
                            <AboutRow label="e-mail">
                                {' '}
                                <a href={`mailto:${displayData.email}`} className={styles.stringLink}>
                                    {'"'}
                                    <EmailTokens email={displayData.email} />
                                    {'"'}
                                </a>
                            </AboutRow>
                        </ul>
                    </div>
                )}
            </div>
        </Section>
    );
};

export default About;
