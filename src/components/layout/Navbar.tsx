import { useEffect, useState } from 'react';
import { Link as ScrollLink } from 'react-scroll';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getSectionVisibility, SectionVisibility } from '../../services/appwrite';
import { Models } from 'appwrite';
import './Navbar.css';

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isSticky, setIsSticky] = useState(false);
    const [sectionVisibility, setSectionVisibility] = useState<(Models.Document & SectionVisibility) | null>(null);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const handleScroll = () => {
            setIsSticky(window.scrollY > 20);
        };

        const fetchSectionVisibility = async () => {
            try {
                const visibility = await getSectionVisibility();
                setSectionVisibility(visibility);
            } catch (error) {
                console.error('Error fetching section visibility:', error);
            }
        };

        window.addEventListener('scroll', handleScroll);
        fetchSectionVisibility();
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
                    <ScrollLink to="home" duration={300} onClick={closeMenu}>
                        Henry Bao
                    </ScrollLink>
                </div>
                <ul className={`menu-list ${menuOpen ? 'active' : ''}`}>
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
