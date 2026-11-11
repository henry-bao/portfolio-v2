import NavShell from '../layout/NavShell';
import { routes } from '../../app/routes';
import { OWNER_NAME } from '../../config/site';

const BlogNav = () => (
    <NavShell
        logo={{ label: OWNER_NAME, to: routes.home }}
        items={[{ key: 'home', label: 'Back to Home', to: routes.home }]}
    />
);

export default BlogNav;
