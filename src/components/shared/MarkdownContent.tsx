import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './MarkdownContent.module.css';

const components: Components = {
    table: ({ node: _node, ...props }) => (
        <div className={styles.tableScroller}>
            <table {...props} />
        </div>
    ),
};

/** Renders GitHub-flavoured markdown with the blog's typography. */
export function MarkdownContent({ children }: { children: string }) {
    return (
        <div className={styles.markdown}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {children}
            </ReactMarkdown>
        </div>
    );
}
