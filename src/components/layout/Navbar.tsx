import { useEffect, useState } from 'react';
import { Link as ScrollLink } from 'react-scroll';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isSticky, setIsSticky] = useState(false);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const handleScroll = () => {
            setIsSticky(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
        document.body.classList.toggle('disableScroll', !menuOpen);
    };

    const closeMenu = () => {
        setMenuOpen(false);
        document.body.classList.remove('disableScroll');
    };

    return (
        <nav className={`nav ${isSticky ? 'sticky' : ''}`}>
            <div className="nav-content">
                <div className="logo">
                    <ScrollLink to="home" smooth={true} duration={500} onClick={closeMenu}>
                        Henry Bao
                    </ScrollLink>
                </div>
                <ul className={`menu-list ${menuOpen ? 'active' : ''}`}>
                    <li>
                        <ScrollLink to="home" smooth={true} duration={500} onClick={closeMenu}>
                            Home
                        </ScrollLink>
                    </li>
                    <li>
                        <ScrollLink to="about" smooth={true} duration={500} onClick={closeMenu}>
                            About Me
                        </ScrollLink>
                    </li>
                    <li>
                        <ScrollLink to="projects" smooth={true} duration={500} onClick={closeMenu}>
                            Projects
                        </ScrollLink>
                    </li>
                    {isAuthenticated && (
                        <li>
                            <RouterLink to="/admin/overview" onClick={closeMenu}>
                                Admin
                            </RouterLink>
                        </li>
                    )}
                </ul>
                <div className={`menu-btn ${menuOpen ? 'open' : ''}`} onClick={toggleMenu}>
                    <div className="menu-burger"></div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
