import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { routes } from '../../routes/paths';
import { scrollToSection } from '../../utils/scroll';
import './Landing.css';

const Landing = () => {
    const navigate = useNavigate();
    const [clickCount, setClickCount] = useState(0);

    const handleWaveClick = () => {
        const newCount = clickCount + 1;
        setClickCount(newCount);

        if (newCount === 5) {
            setClickCount(0);
            navigate(routes.admin.login);
        }
    };

    return (
        <section id="home" className="landing-css">
            <div className="hello-container">
                <div className="type-animation">
                    <span className="open-tag">&lt;Hello&gt;</span>{' '}
                    <span className="wave-hand" onClick={handleWaveClick}>
                        {'👋'}
                    </span>
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
                <div className="scroll-indicator"></div>
            </button>
        </section>
    );
};

export default Landing;
