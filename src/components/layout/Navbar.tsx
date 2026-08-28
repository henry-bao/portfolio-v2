import { scrollToSection } from '../../utils/scroll';
import { isSectionVisible } from '../../utils/sectionVisibility';
import type { SectionVisibility, SectionVisibilityDocument, SectionVisibilityStatus } from '../../types';
import NavShell from './NavShell';

interface NavbarProps {
    sectionVisibility: SectionVisibilityDocument | null;
    sectionVisibilityStatus: SectionVisibilityStatus;
}

type NavSection = { id: Extract<keyof SectionVisibility, 'about' | 'projects' | 'blogs'>; label: string };

const navSections: NavSection[] = [
    { id: 'about', label: 'About Me' },
    { id: 'projects', label: 'Projects' },
    { id: 'blogs', label: 'Blogs' },
];

const Navbar = ({ sectionVisibility, sectionVisibilityStatus }: NavbarProps) => {
    const isLoadingSectionLinks = sectionVisibilityStatus === 'loading';

    return (
        <NavShell
            logo={(closeMenu) => (
                <button
                    type="button"
                    className="nav-link-button nav-logo-button"
                    onClick={() => {
                        closeMenu();
                        scrollToSection('home');
                    }}
                >
                    Henry Bao
                </button>
            )}
        >
            {(closeMenu) => {
                const goToSection = (sectionId: string) => {
                    closeMenu();
                    scrollToSection(sectionId);
                };

                return (
                    <>
                        <li>
                            <button type="button" className="nav-link-button" onClick={() => goToSection('home')}>
                                Home
                            </button>
                        </li>
                        {isLoadingSectionLinks &&
                            navSections.map(({ id }) => (
                                <li className="nav-link-skeleton-item" key={id} aria-hidden="true">
                                    <span className="nav-link-skeleton" />
                                </li>
                            ))}
                        {navSections.map(
                            ({ id, label }) =>
                                isSectionVisible(sectionVisibility, sectionVisibilityStatus, id) && (
                                    <li className="nav-link-enter" key={id}>
                                        <button
                                            type="button"
                                            className="nav-link-button"
                                            onClick={() => goToSection(id)}
                                        >
                                            {label}
                                        </button>
                                    </li>
                                )
                        )}
                    </>
                );
            }}
        </NavShell>
    );
};

export default Navbar;
