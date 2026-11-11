import { OWNER_NAME } from '../../config/site';
import type { SiteSection } from '../../api';
import { useSectionVisibility } from '../../queries';
import { scrollToSection } from '../../lib/scroll';
import NavShell from './NavShell';
import type { NavItem } from './NavShell';

const navSections: { id: Extract<SiteSection, 'about' | 'projects' | 'blogs'>; label: string }[] = [
    { id: 'about', label: 'About Me' },
    { id: 'projects', label: 'Projects' },
    { id: 'blogs', label: 'Blogs' },
];

/** Home-page nav: links scroll to sections, and only visible sections get a link. */
const Navbar = () => {
    const { isVisible, isResolved } = useSectionVisibility();

    const items: NavItem[] = [
        { key: 'home', label: 'Home', onSelect: () => scrollToSection('home') },
        ...navSections
            .filter(({ id }) => isVisible(id))
            .map(({ id, label }) => ({ key: id, label, reveal: true, onSelect: () => scrollToSection(id) })),
    ];

    return (
        <NavShell
            logo={{ label: OWNER_NAME, onSelect: () => scrollToSection('home') }}
            items={items}
            placeholderCount={isResolved ? 0 : navSections.length}
        />
    );
};

export default Navbar;
