import { useEffect, useState } from 'react';
import { Link as ScrollLink } from 'react-scroll';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { SectionVisibility } from '../../services/appwrite';
import { Models } from 'appwrite';
import './Navbar.css';

type NavbarProps = {
    sectionVisibility: (Models.Document & SectionVisibility) | null;
};

const Navbar = ({ sectionVisibility }: NavbarProps) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isSticky, setIsSticky] = useState(false);
    const { isAuthenticated } = useAuth();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            setIsSticky(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (sectionVisibility !== null) {
            setIsLoading(false);
        }
    }, [sectionVisibility]);

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
                    <ScrollLink to="home" duration={300} onClick={closeMenu}>
                        Henry Bao
                    </ScrollLink>
                </div>
                <ul className={`menu-list ${menuOpen ? 'active' : ''}`}>
                    {!isLoading && (
                        <>
                            <li>
                                <ScrollLink to="home" duration={300} onClick={closeMenu}>
                                    Home
                                </ScrollLink>
                            </li>
                            {(!sectionVisibility || sectionVisibility.about) && (
                                <li>
                                    <ScrollLink to="about" duration={300} onClick={closeMenu}>
                                        About Me
                                    </ScrollLink>
                                </li>
                            )}
                            {(!sectionVisibility || sectionVisibility.projects) && (
                                <li>
                                    <ScrollLink to="projects" duration={300} onClick={closeMenu}>
                                        Projects
                                    </ScrollLink>
                                </li>
                            )}
                            {(!sectionVisibility || sectionVisibility.blogs) && (
                                <li>
                                    <ScrollLink to="blogs" duration={300} onClick={closeMenu}>
                                        Blogs
                                    </ScrollLink>
                                </li>
                            )}
                            {isAuthenticated && (
                                <li>
                                    <RouterLink to="/admin/overview" onClick={closeMenu} className="nav-admin-button">
                                        Admin
                                    </RouterLink>
                                </li>
                            )}{' '}
                        </>
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
