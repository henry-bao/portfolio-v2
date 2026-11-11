import { routes } from '../../app/routes';
import { CONTACT_EMAIL, OWNER_NAME } from '../../config/site';
import styles from './Footer.module.css';

const FIRST_COPYRIGHT_YEAR = 2022;

const Footer = () => (
    <footer className={styles.footer}>
        <p className={styles.line}>
            {/* A plain link on purpose: /resume is a server redirect on Vercel (see routes.resume). */}
            <a className={styles.link} href={routes.resume} target="_blank" rel="noopener">
                {OWNER_NAME}
            </a>{' '}
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
            Copyright &copy; {FIRST_COPYRIGHT_YEAR}&ndash;{new Date().getFullYear()}
        </p>
    </footer>
);

export default Footer;
