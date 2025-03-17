import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

    return (
        <details open={isExpanded}>
            <summary
                onClick={(e) => {
                    e.preventDefault();
                    setIsExpanded(!isExpanded);
                }}
            >
                {title}
            </summary>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <img src={logo} alt={`${title}'s logo`} />
                        <div className="description">
                            <h1>{role}</h1>
                            {description.map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
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
                    </motion.div>
                )}
            </AnimatePresence>
        </details>
    );
};

export default ProjectCard;
