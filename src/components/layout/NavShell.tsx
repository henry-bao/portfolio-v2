import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useBodyScrollLock, useStickyHeader } from '../../hooks';
import { routes } from '../../routes/paths';
import { classNames } from '../../utils/classNames';
import './Navbar.css';

interface NavShellProps {
    logo: (closeMenu: () => void) => ReactNode;
    children: (closeMenu: () => void) => ReactNode;
}

/**
 * Sticky header chrome shared by the portfolio and blog navs: burger menu state,
 * body scroll locking and the authenticated-only admin link.
 */
const NavShell = ({ logo, children }: NavShellProps) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const isSticky = useStickyHeader();
    const { isAuthenticated } = useAuth();

    useBodyScrollLock(menuOpen);

    const closeMenu = () => setMenuOpen(false);

    return (
        <nav className={classNames('nav', isSticky && 'sticky')}>
            <div className="nav-content">
                <div className="logo">{logo(closeMenu)}</div>
                <ul className={classNames('menu-list', menuOpen && 'active')}>
                    {children(closeMenu)}
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
                    className={classNames('menu-btn', menuOpen && 'open')}
                    aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((currentMenuOpen) => !currentMenuOpen)}
                >
                    <div className="menu-burger" />
                </button>
            </div>
        </nav>
    );
};

export default NavShell;
