import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../app/routes';
import { scrollToSection } from '../../lib/scroll';
import styles from './Landing.module.css';

/** Clicks on the waving hand needed to reveal the dashboard login. */
const ADMIN_UNLOCK_CLICKS = 5;

const Landing = () => {
    const navigate = useNavigate();
    const clickCountRef = useRef(0);

    const handleWaveClick = () => {
        clickCountRef.current += 1;

        if (clickCountRef.current >= ADMIN_UNLOCK_CLICKS) {
            clickCountRef.current = 0;
            navigate(routes.admin.login);
        }
    };

    return (
        <section id="home" className={styles.landing}>
            {/* Read out as plain words; the markup-style tags are for the eye only. */}
            <h1 className={styles.greeting} aria-label="Hello, I'm Henry">
                <span className={styles.typewriter}>
                    <span className={styles.tag}>&lt;Hello&gt;</span>{' '}
                    {/* Decorative easter egg: hidden from assistive tech and the tab order. */}
                    <button
                        type="button"
                        className={styles.wave}
                        onClick={handleWaveClick}
                        aria-hidden="true"
                        tabIndex={-1}
                    >
                        {'👋'}
                    </button>
                    {"  I'm Henry "}
                    <span className={styles.tag}>&lt;/Hello&gt;&nbsp;</span>
                </span>
            </h1>
            <button
                type="button"
                className={styles.scrollButton}
                aria-label="Scroll to about section"
                onClick={() => scrollToSection('about')}
            >
                <span className={styles.scrollArrow} />
            </button>
        </section>
    );
};

export default Landing;
