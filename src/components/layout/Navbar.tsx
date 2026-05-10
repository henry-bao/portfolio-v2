import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { routes } from '../../routes/paths';
import { scrollToSection } from '../../utils/scroll';
import { isSectionVisible } from '../../utils/sectionVisibility';
import { useBodyScrollLock, useStickyHeader } from '../../hooks';
import type { SectionVisibility, SectionVisibilityDocument, SectionVisibilityStatus } from '../../types';
import './Navbar.css';

type NavbarProps = {
    sectionVisibility: SectionVisibilityDocument | null;
    sectionVisibilityStatus: SectionVisibilityStatus;
};

const navSections: Array<{ id: keyof Pick<SectionVisibility, 'about' | 'projects' | 'blogs'>; label: string }> = [
    { id: 'about', label: 'About Me' },
    { id: 'projects', label: 'Projects' },
    { id: 'blogs', label: 'Blogs' },
];

const Navbar = ({ sectionVisibility, sectionVisibilityStatus }: NavbarProps) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const isSticky = useStickyHeader();
    const { isAuthenticated } = useAuth();

    useBodyScrollLock(menuOpen);

    const toggleMenu = () => {
        setMenuOpen((currentMenuOpen) => !currentMenuOpen);
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };

    const handleSectionClick = (sectionId: string) => {
        closeMenu();
        scrollToSection(sectionId);
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
                    {navSections.map(
                        ({ id, label }) =>
                            isSectionVisible(sectionVisibility, sectionVisibilityStatus, id) && (
                                <li className="nav-link-enter" key={id}>
                                    <button type="button" className="nav-link-button" onClick={() => handleSectionClick(id)}>
                                        {label}
                                    </button>
                                </li>
                            )
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
