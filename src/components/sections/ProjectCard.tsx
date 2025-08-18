import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme, useMediaQuery } from '@mui/material';
import { ArrowDropUp, ArrowDropDown } from '@mui/icons-material';
import './ProjectCard.css';

interface ProjectCardProps {
    title: string;
    logo: string;
    role: string;
    description: string[];
    date: string;
    link_url?: string;
    link_text?: string;
    isOpen?: boolean;
}

const ProjectCard = ({
    title,
    logo,
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

    const renderContent = () => {
        const content = (
            <>
                <img src={logo} alt={`${title}'s logo`} />
                <div className="description">
                    <h1>{role}</h1>
                    {description.map((paragraph, index) => (
                        <p key={index}>{`● ${paragraph}`}</p>
                    ))}
                    <strong>{date}</strong>
                    {link_url && (
                        <p>
                            <a href={link_url} target="_blank" rel="noopener noreferrer" className="details-href">
                                {link_text}
                            </a>
                        </p>
                    )}
                </div>
            </>
        );

        // For tablet devices and below, render without animations
        if (isTablet) {
            return isExpanded && <div>{content}</div>;
        }

        // For desktop, use motion animations
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
    };

    return (
        <details className="project-details" open={isExpanded}>
            <summary className="project-summary"
                onClick={(e) => {
                    e.preventDefault();
                    setIsExpanded(!isExpanded);
                }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
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
