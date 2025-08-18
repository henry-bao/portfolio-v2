import './Footer.css';

type FooterProps = {
    resumeUrl: string | null;
};
const Footer = ({ resumeUrl }: FooterProps) => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <p>
                <a href={resumeUrl || '/file/Resume.pdf'} target="_blank" rel="noopener noreferrer">
                    Henry Bao
                </a>{' '}
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
