import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { SectionVisibility } from '../../services/appwrite';
import { Models } from 'appwrite';
import { routes } from '../../routes/paths';
import { scrollToSection } from '../../utils/scroll';
import './Navbar.css';

type NavbarProps = {
    sectionVisibility: (Models.Document & SectionVisibility) | null;
};

const Navbar = ({ sectionVisibility }: NavbarProps) => {
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

    const handleSectionClick = (sectionId: string) => {
        closeMenu();
        scrollToSection(sectionId);
    };

    return (
        <nav className={`nav ${isSticky ? 'sticky' : ''}`}>
            <div className="nav-content">
                <div className="logo">
                    <button type="button" className="nav-link-button nav-logo-button" onClick={() => handleSectionClick('home')}>
                        Henry Bao
                    </button>
                </div>
                <ul className={`menu-list ${menuOpen ? 'active' : ''}`}>
                    <li>
                        <button type="button" className="nav-link-button" onClick={() => handleSectionClick('home')}>
                            Home
                        </button>
                    </li>
                    {(!sectionVisibility || sectionVisibility.about) && (
                        <li>
                            <button type="button" className="nav-link-button" onClick={() => handleSectionClick('about')}>
                                About Me
                            </button>
                        </li>
                    )}
                    {(!sectionVisibility || sectionVisibility.projects) && (
                        <li>
                            <button type="button" className="nav-link-button" onClick={() => handleSectionClick('projects')}>
                                Projects
                            </button>
                        </li>
                    )}
                    {(!sectionVisibility || sectionVisibility.blogs) && (
                        <li>
                            <button type="button" className="nav-link-button" onClick={() => handleSectionClick('blogs')}>
                                Blogs
                            </button>
                        </li>
                    )}
                    {isAuthenticated && (
                        <li>
                            <RouterLink to={routes.admin.overview} onClick={closeMenu} className="nav-admin-button">
                                Admin
                            </RouterLink>
                        </li>
                    )}
                </ul>
                <button
                    type="button"
                    className={`menu-btn ${menuOpen ? 'open' : ''}`}
                    aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={menuOpen}
                    onClick={toggleMenu}
                >
                    <div className="menu-burger"></div>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
