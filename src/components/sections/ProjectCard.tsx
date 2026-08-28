import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useMediaQuery, useTheme } from '@mui/material';
import { ArrowDropDown, ArrowDropUp } from '@mui/icons-material';
import { COMPACT_LAYOUT_WIDTH_PX } from '../../hooks';
import type { ProjectDocument } from '../../types';
import { PLACEHOLDER_IMAGE } from '../../utils/assets';
import { ImageWithFallback } from '../shared';
import './ProjectCard.css';

interface ProjectCardProps {
    project: ProjectDocument;
    logoUrl?: string;
}

const EXPAND_DURATION_S = 0.3;

const ProjectCard = ({ project, logoUrl }: ProjectCardProps) => {
    const { title, role, description, date, link_url: linkUrl, link_text: linkText, isOpen = false } = project;
    const [isExpanded, setIsExpanded] = useState(isOpen);
    const theme = useTheme();
    const isTablet = useMediaQuery(theme.breakpoints.down(COMPACT_LAYOUT_WIDTH_PX));

    const content = (
        <>
            <ImageWithFallback src={logoUrl} fallbackSrc={PLACEHOLDER_IMAGE} alt={`${title}'s logo`} />
            <div className="description">
                <h1>{role}</h1>
                {description.map((paragraph, index) => (
                    <p key={`${paragraph}-${index}`}>{`● ${paragraph}`}</p>
                ))}
                <strong>{date}</strong>
                {linkUrl && (
                    <p>
                        <a href={linkUrl} target="_blank" rel="noopener" className="details-href">
                            {linkText}
                        </a>
                    </p>
                )}
            </div>
        </>
    );

    return (
        <details className="project-details" open={isExpanded}>
            <summary
                className="project-summary"
                onClick={(event) => {
                    // `details` toggles itself; React owns the open state instead.
                    event.preventDefault();
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

            {isTablet ? (
                isExpanded && <div>{content}</div>
            ) : (
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: EXPAND_DURATION_S }}
                        >
                            {content}
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </details>
    );
};

export default ProjectCard;
