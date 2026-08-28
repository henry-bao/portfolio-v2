import { CONTACT_EMAIL } from '../../config/site';
import { classNames } from '../../utils/classNames';
import { FALLBACK_RESUME_URL } from '../../utils/assets';
import './Footer.css';

interface FooterProps {
    className?: string;
    isResumeLoading?: boolean;
    resumeUrl: string | null;
}

const FIRST_COPYRIGHT_YEAR = 2022;

const Footer = ({ className, isResumeLoading = false, resumeUrl }: FooterProps) => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={classNames('footer', className)}>
            <p>
                {isResumeLoading ? (
                    <span>Henry Bao</span>
                ) : (
                    <a href={resumeUrl || FALLBACK_RESUME_URL} target="_blank" rel="noopener">
                        Henry Bao
                    </a>
                )}{' '}
                | <a href="#">Portfolio</a>
            </p>
            <p>
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
            <p>
                Copyright &copy; {FIRST_COPYRIGHT_YEAR}-{currentYear}
            </p>
        </footer>
    );
};

export default Footer;
