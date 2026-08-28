import type { ReactNode } from 'react';
import Footer from '../layout/Footer';
import BlogNav from './BlogNav';

interface BlogPageShellProps {
    children: ReactNode;
    showNav?: boolean;
}

/** Nav + footer chrome shared by the blog list and blog post pages. */
const BlogPageShell = ({ children, showNav = true }: BlogPageShellProps) => (
    <div className="blog-page-wrapper">
        {showNav && <BlogNav />}
        {children}
        <Footer resumeUrl={null} />
    </div>
);

export default BlogPageShell;
