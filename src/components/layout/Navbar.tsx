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
    sectionVisibilityStatus: 'loading' | 'ready' | 'fallback';
};

const Navbar = ({ sectionVisibility, sectionVisibilityStatus }: NavbarProps) => {
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
    const isSectionVisible = (section: keyof SectionVisibility) => {
        if (sectionVisibilityStatus === 'loading') {
            return false;
        }

        return sectionVisibility ? sectionVisibility[section] : sectionVisibilityStatus === 'fallback';
    };
    const isLoadingSectionLinks = sectionVisibilityStatus === 'loading';

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
                    {isLoadingSectionLinks && (
                        <>
                            <li className="nav-link-skeleton-item" aria-hidden="true">
                                <span className="nav-link-skeleton" />
                            </li>
                            <li className="nav-link-skeleton-item" aria-hidden="true">
                                <span className="nav-link-skeleton" />
                            </li>
                            <li className="nav-link-skeleton-item" aria-hidden="true">
                                <span className="nav-link-skeleton" />
                            </li>
                        </>
                    )}
                    {isSectionVisible('about') && (
                        <li className="nav-link-enter">
                            <button type="button" className="nav-link-button" onClick={() => handleSectionClick('about')}>
                                About Me
                            </button>
                        </li>
                    )}
                    {isSectionVisible('projects') && (
                        <li className="nav-link-enter">
                            <button type="button" className="nav-link-button" onClick={() => handleSectionClick('projects')}>
                                Projects
                            </button>
                        </li>
                    )}
                    {isSectionVisible('blogs') && (
                        <li className="nav-link-enter">
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
