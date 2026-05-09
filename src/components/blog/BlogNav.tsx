import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { routes } from '../../routes/paths';
import '../layout/Navbar.css';

const BlogNav = () => {
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
                    <RouterLink to={routes.home} onClick={closeMenu}>
                        Henry Bao
                    </RouterLink>
                </div>
                <ul className={`menu-list ${menuOpen ? 'active' : ''}`}>
                    <li>
                        <RouterLink to={routes.home} onClick={closeMenu}>
                            Back to Home
                        </RouterLink>
                    </li>
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

export default BlogNav;
