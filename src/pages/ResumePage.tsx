import { useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import { fileUrl, getErrorMessage } from '../api';
import { useActiveResume } from '../queries';
import NotFoundPage from './NotFoundPage';
import styles from './NotFoundPage.module.css';

/**
 * Client-side fallback for `/resume` and `/resume-redirect`.
 *
 * On Vercel (henry.bao.dev) these paths never reach the SPA: vercel.json sends them to api/resume.ts,
 * which answers with a real 302. This page only runs where that isn't possible, such as the static
 * Appwrite Sites mirror. If the lookup fails it says so; it never falls back to a stale resume.
 */
const ResumePage = () => {
    const { data: resume, isPending, isError, error, refetch } = useActiveResume();
    const url = fileUrl(resume?.fileId);

    useEffect(() => {
        if (url) {
            window.location.replace(url);
        }
    }, [url]);

    if (isPending || url) {
        return (
            <main className={styles.page}>
                <div className={styles.card}>
                    <CircularProgress />
                    <p className={styles.message}>Opening the resume…</p>
                </div>
            </main>
        );
    }

    if (isError) {
        return (
            <main className={styles.page}>
                <div className={styles.card}>
                    <h1 className={styles.title}>Resume unavailable</h1>
                    <p className={styles.message}>{getErrorMessage(error)}</p>
                    <button type="button" className={styles.homeLink} onClick={() => void refetch()}>
                        Try again
                    </button>
                </div>
            </main>
        );
    }

    return <NotFoundPage />;
};

export default ResumePage;
