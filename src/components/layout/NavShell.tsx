import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useMediaQuery } from '@mui/material';
import { useAuth } from '../../context/useAuth';
import { useBodyScrollLock, useStickyHeader } from '../../hooks';
import { routes } from '../../routes/paths';
import { classNames } from '../../utils/classNames';
import styles from './NavShell.module.css';

/** A nav entry is either a route link or an in-page action such as scrolling to a section. */
export type NavLinkTarget = { to: string } | { onSelect: () => void };

export type NavItem = NavLinkTarget & {
    key: string;
    label: string;
    /** Fade the link in when it mounts; for links that only appear once data has loaded. */
    reveal?: boolean;
};

interface NavShellProps {
    logo: NavLinkTarget & { label: string };
    items: NavItem[];
    /** Placeholder links shown after `items` while the remaining links are loading. */
    placeholderCount?: number;
}

/** Keep in sync with the mobile breakpoint in NavShell.module.css. */
const MOBILE_MENU_QUERY = '(max-width: 768px)';

const NavLink = ({
    target,
    className,
    onNavigate,
    children,
}: {
    target: NavLinkTarget;
    className: string;
    onNavigate: () => void;
    children: string;
}) =>
    'to' in target ? (
        <RouterLink to={target.to} className={className} onClick={onNavigate}>
            {children}
        </RouterLink>
    ) : (
        <button
            type="button"
            className={className}
            onClick={() => {
                onNavigate();
                target.onSelect();
            }}
        >
            {children}
        </button>
    );

/**
 * Fixed header shared by the portfolio and blog pages: sticky background on scroll,
 * the full-screen mobile menu and the authenticated-only admin link.
 */
const NavShell = ({ logo, items, placeholderCount = 0 }: NavShellProps) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const isSticky = useStickyHeader();
    const isMobile = useMediaQuery(MOBILE_MENU_QUERY);
    const { isAuthenticated } = useAuth();

    useBodyScrollLock(menuOpen && isMobile);

    const closeMenu = () => setMenuOpen(false);

    return (
        <nav className={classNames(styles.nav, isSticky && styles.sticky)}>
            <div className={styles.content}>
                <div>
                    <NavLink target={logo} className={styles.logo} onNavigate={closeMenu}>
                        {logo.label}
                    </NavLink>
                </div>
                <ul className={classNames(styles.menu, menuOpen && styles.menuOpen)}>
                    {items.map(({ key, label, reveal, ...target }) => (
                        <li key={key} className={reveal ? styles.reveal : undefined}>
                            <NavLink target={target} className={styles.link} onNavigate={closeMenu}>
                                {label}
                            </NavLink>
                        </li>
                    ))}
                    {Array.from({ length: placeholderCount }, (_, index) => (
                        <li key={index} className={styles.skeletonItem} aria-hidden="true">
                            <span className={styles.skeleton} />
                        </li>
                    ))}
                    {isAuthenticated && (
                        <li>
                            <RouterLink
                                to={routes.admin.overview}
                                className={classNames(styles.link, styles.adminLink)}
                                onClick={closeMenu}
                            >
                                Admin
                            </RouterLink>
                        </li>
                    )}
                </ul>
                <button
                    type="button"
                    className={styles.menuButton}
                    aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((currentMenuOpen) => !currentMenuOpen)}
                >
                    <span className={styles.burger} />
                </button>
            </div>
        </nav>
    );
};

export default NavShell;
