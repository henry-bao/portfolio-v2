import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useMediaQuery, useTheme } from '@mui/material';
import { ArrowDropDown, ArrowDropUp } from '@mui/icons-material';
import { fileUrl, projectsApi } from '../../api';
import type { Project } from '../../api';
import { PLACEHOLDER_IMAGE } from '../../config/site';
import { COMPACT_LAYOUT_WIDTH_PX } from '../../hooks';
import { ImageWithFallback } from '../shared';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
    project: Project;
}

const EXPAND_DURATION_S = 0.3;

const ProjectCard = ({ project }: ProjectCardProps) => {
    const { title, role, description, date, link_url: linkUrl, link_text: linkText, isOpen } = project;
    const [isExpanded, setIsExpanded] = useState(isOpen);
    const detailsId = useId();
    const theme = useTheme();
    // Expanding is only animated on wider screens; compact layouts just toggle.
    const isCompact = useMediaQuery(theme.breakpoints.down(COMPACT_LAYOUT_WIDTH_PX));
    const ToggleIcon = isExpanded ? ArrowDropDown : ArrowDropUp;

    return (
        <div className={styles.card}>
            <button
                type="button"
                className={styles.toggle}
                aria-expanded={isExpanded}
                aria-controls={detailsId}
                onClick={() => setIsExpanded((currentIsExpanded) => !currentIsExpanded)}
            >
                {title}
                <ToggleIcon sx={{ fontSize: '3rem' }} />
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        id={detailsId}
                        className={styles.collapse}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: isCompact ? 0 : EXPAND_DURATION_S }}
                    >
                        <div className={styles.details}>
                            <ImageWithFallback
                                className={styles.logo}
                                src={fileUrl(project.logoFileId)}
                                fallbackSrc={PLACEHOLDER_IMAGE}
                                alt={`${title}'s logo`}
                            />
                            <div className={styles.description}>
                                <h3 className={styles.role}>{role}</h3>
                                {description.map((paragraph, index) => (
                                    <p key={`${paragraph}-${index}`} className={styles.point}>{`● ${paragraph}`}</p>
                                ))}
                                <strong className={styles.date}>{date}</strong>
                                {linkUrl && (
                                    <p className={styles.point}>
                                        <a href={linkUrl} target="_blank" rel="noopener" className={styles.link}>
                                            {linkText ?? projectsApi.DEFAULT_LINK_TEXT}
                                        </a>
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProjectCard;
