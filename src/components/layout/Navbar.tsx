import { scrollToSection } from '../../utils/scroll';
import { isSectionVisible } from '../../utils/sectionVisibility';
import type { SectionVisibility, SectionVisibilityDocument, SectionVisibilityStatus } from '../../types';
import NavShell from './NavShell';
import type { NavItem } from './NavShell';

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

    const items: NavItem[] = [
        { key: 'home', label: 'Home', onSelect: () => scrollToSection('home') },
        ...navSections
            .filter(({ id }) => isSectionVisible(sectionVisibility, sectionVisibilityStatus, id))
            .map(({ id, label }) => ({ key: id, label, reveal: true, onSelect: () => scrollToSection(id) })),
    ];

    return (
        <NavShell
            logo={{ label: 'Henry Bao', onSelect: () => scrollToSection('home') }}
            items={items}
            placeholderCount={isLoadingSectionLinks ? navSections.length : 0}
        />
    );
};

export default Navbar;
