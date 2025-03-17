import { Link } from 'react-scroll';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './Landing.css';

const Landing = () => {
    const navigate = useNavigate();
    const [clickCount, setClickCount] = useState(0);

    const handleWaveClick = () => {
        const newCount = clickCount + 1;
        setClickCount(newCount);

        if (newCount === 5) {
            setClickCount(0);
            navigate('/admin/login');
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
            <Link to="about" smooth={true} duration={500} className="scroll-indicator-container">
                <div className="scroll-indicator"></div>
            </Link>
        </section>
    );
};

export default Landing;
