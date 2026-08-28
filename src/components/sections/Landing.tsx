import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../routes/paths';
import { scrollToSection } from '../../utils/scroll';
import './Landing.css';

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
        <section id="home" className="landing-css">
            <div className="hello-container">
                <div className="type-animation">
                    <span className="open-tag">&lt;Hello&gt;</span>{' '}
                    {/* Decorative easter egg: hidden from assistive tech and the tab order. */}
                    <button
                        type="button"
                        className="wave-hand"
                        onClick={handleWaveClick}
                        aria-hidden="true"
                        tabIndex={-1}
                    >
                        {'👋'}
                    </button>
                    {"  I'm Henry "}
                    <span className="close-tag">&lt;/Hello&gt;&nbsp;</span>
                </div>
            </div>
            <button
                type="button"
                className="scroll-indicator-container"
                aria-label="Scroll to about section"
                onClick={() => scrollToSection('about')}
            >
                <div className="scroll-indicator" />
            </button>
        </section>
    );
};

export default Landing;
