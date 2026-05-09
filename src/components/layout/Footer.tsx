import './Footer.css';

type FooterProps = {
    isResumeLoading?: boolean;
    resumeUrl: string | null;
};

const Footer = ({ isResumeLoading = false, resumeUrl }: FooterProps) => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
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
