import NavShell from '../layout/NavShell';
import { routes } from '../../routes/paths';

const BlogNav = () => (
    <NavShell
        logo={{ label: 'Henry Bao', to: routes.home }}
        items={[{ key: 'home', label: 'Back to Home', to: routes.home }]}
    />
);

export default BlogNav;
