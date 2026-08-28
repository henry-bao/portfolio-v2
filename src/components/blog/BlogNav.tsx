import { Link as RouterLink } from 'react-router-dom';
import NavShell from '../layout/NavShell';
import { routes } from '../../routes/paths';

const BlogNav = () => (
    <NavShell
        logo={(closeMenu) => (
            <RouterLink to={routes.home} onClick={closeMenu}>
                Henry Bao
            </RouterLink>
        )}
    >
        {(closeMenu) => (
            <li>
                <RouterLink to={routes.home} onClick={closeMenu}>
                    Back to Home
                </RouterLink>
            </li>
        )}
    </NavShell>
);

export default BlogNav;
