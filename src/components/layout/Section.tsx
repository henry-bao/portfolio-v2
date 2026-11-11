import type { ReactNode } from 'react';
import { classNames } from '../../lib/classNames';
import styles from './Section.module.css';

interface SectionProps {
    id: string;
    /** Use the wider side gutters. */
    inset?: boolean;
    className?: string;
    children: ReactNode;
}

/** Full-height home-page section; `id` is the scroll target used by the navbar. */
export const Section = ({ id, inset = false, className, children }: SectionProps) => (
    <section id={id} className={classNames(styles.section, inset && styles.inset, className)}>
        {children}
    </section>
);

export const SectionTitle = ({ children }: { children: ReactNode }) => <h2 className={styles.title}>{children}</h2>;
