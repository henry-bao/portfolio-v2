import type { ReactNode } from 'react';
import { CircularProgress } from '@mui/material';
import Footer from '../layout/Footer';
import BlogNav from './BlogNav';
import styles from './BlogPageShell.module.css';

interface BlogPageShellProps {
    children: ReactNode;
    showNav?: boolean;
}

/** Nav + footer chrome shared by the blog list and blog post pages. */
const BlogPageShell = ({ children, showNav = true }: BlogPageShellProps) => (
    <div className={styles.page}>
        {showNav && <BlogNav />}
        {children}
        <Footer resumeUrl={null} />
    </div>
);

/** Spinner that fills the space between the nav and the footer. */
export const BlogPageLoading = () => (
    <div className={styles.loading}>
        <CircularProgress />
    </div>
);

export default BlogPageShell;
