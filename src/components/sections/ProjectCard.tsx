import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme, useMediaQuery } from '@mui/material';
import { ArrowDropUp, ArrowDropDown } from '@mui/icons-material';
import { ImageWithFallback } from '../shared';
import './ProjectCard.css';

interface ProjectCardProps {
    title: string;
    logoUrl?: string;
    role: string;
    description: string[];
    date: string;
    link_url?: string;
    link_text?: string;
    isOpen?: boolean;
}

const ProjectCard = ({
    title,
    logoUrl,
    role,
    description,
    date,
    link_url,
    link_text,
    isOpen = false,
}: ProjectCardProps) => {
    const [isExpanded, setIsExpanded] = useState(isOpen);
    const theme = useTheme();
    const isTablet = useMediaQuery(theme.breakpoints.down(992));
    const content = useMemo(
        () => (
            <>
                <ImageWithFallback src={logoUrl} fallbackSrc="/img/placeholder.svg" alt={`${title}'s logo`} />
                <div className="description">
                    <h1>{role}</h1>
                    {description.map((paragraph, index) => (
                        <p key={`${paragraph}-${index}`}>{`● ${paragraph}`}</p>
                    ))}
                    <strong>{date}</strong>
                    {link_url && (
                        <p>
                            <a href={link_url} target="_blank" rel="noopener" className="details-href">
                                {link_text}
                            </a>
                        </p>
                    )}
                </div>
            </>
        ),
        [date, description, link_text, link_url, logoUrl, role, title]
    );

    const renderContent = useCallback(() => {
        if (isTablet) {
            return isExpanded && <div>{content}</div>;
        }

        return (
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {content}
                    </motion.div>
                )}
            </AnimatePresence>
        );
    }, [content, isExpanded, isTablet]);

    return (
        <details className="project-details" open={isExpanded}>
            <summary
                className="project-summary"
                onClick={(e) => {
                    e.preventDefault();
                    setIsExpanded((currentIsExpanded) => !currentIsExpanded);
                }}
            >
                {title}
                {isExpanded ? (
                    <ArrowDropDown style={{ fontSize: '3rem' }} />
                ) : (
                    <ArrowDropUp style={{ fontSize: '3rem' }} />
                )}
            </summary>
            {renderContent()}
        </details>
    );
};

export default ProjectCard;
