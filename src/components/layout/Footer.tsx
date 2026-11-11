import { CONTACT_EMAIL } from '../../config/site';
import { FALLBACK_RESUME_URL } from '../../utils/assets';
import styles from './Footer.module.css';

interface FooterProps {
    isResumeLoading?: boolean;
    resumeUrl: string | null;
}

const FIRST_COPYRIGHT_YEAR = 2022;

const Footer = ({ isResumeLoading = false, resumeUrl }: FooterProps) => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <p className={styles.line}>
                {isResumeLoading ? (
                    <span>Henry Bao</span>
                ) : (
                    <a className={styles.link} href={resumeUrl || FALLBACK_RESUME_URL} target="_blank" rel="noopener">
                        Henry Bao
                    </a>
                )}{' '}
                |{' '}
                <a className={styles.link} href="#">
                    Portfolio
                </a>
            </p>
            <p className={styles.line}>
                <a className={styles.link} href={`mailto:${CONTACT_EMAIL}`}>
                    {CONTACT_EMAIL}
                </a>
            </p>
            <p className={styles.line}>
                Copyright &copy; {FIRST_COPYRIGHT_YEAR}-{currentYear}
            </p>
        </footer>
    );
};

export default Footer;
