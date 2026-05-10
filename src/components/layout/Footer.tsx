import './Footer.css';

type FooterProps = {
    className?: string;
    isResumeLoading?: boolean;
    resumeUrl: string | null;
};

const Footer = ({ className = '', isResumeLoading = false, resumeUrl }: FooterProps) => {
    const currentYear = new Date().getFullYear();
    const footerClassName = ['footer', className].filter(Boolean).join(' ');

    return (
        <footer className={footerClassName}>
            <p>
                {isResumeLoading ? (
                    <span>Henry Bao</span>
                ) : (
                    <a href={resumeUrl || '/file/Resume.pdf'} target="_blank" rel="noopener">
                        Henry Bao
                    </a>
                )}{' '}
                | <a href="#">Portfolio</a>
            </p>
            <p>
                <a href="mailto:henry@bao.nyc">henry@bao.nyc</a>
            </p>
            <p>Copyright &copy; 2022-{currentYear}</p>
        </footer>
    );
};

export default Footer;
