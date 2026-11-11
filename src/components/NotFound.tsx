import { Link } from 'react-router-dom';
import { routes } from '../routes/paths';
import styles from './NotFound.module.css';

const NotFound = () => (
    <main className={styles.page}>
        <div className={styles.card}>
            <h1 className={styles.code}>404</h1>
            <h2 className={styles.title}>Page Not Found</h2>
            <p className={styles.message}>The page you are looking for doesn't exist or has been moved.</p>
            <Link to={routes.home} className={styles.homeLink}>
                Return to Home
            </Link>
        </div>
    </main>
);

export default NotFound;
