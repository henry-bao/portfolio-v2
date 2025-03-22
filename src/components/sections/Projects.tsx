import { useState, useEffect } from 'react';
import ProjectCard from './ProjectCard';
import { getProjects } from '../../services/appwrite';
import { getFilePreviewUrl } from '../../services/fileProxy';
import { CircularProgress } from '@mui/material';

import './Projects.css';

interface ProjectDisplayData {
    id: string;
    title: string;
    role: string;
    description: string[];
    date: string;
    logoUrl?: string;
    link_url?: string;
    link_text?: string;
    isOpen?: boolean;
}

const Projects = () => {
    const [projects, setProjects] = useState<ProjectDisplayData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setIsLoading(true);
                const projectsList = await getProjects();

                // Map Appwrite documents to our display format
                const mappedProjects = projectsList.map((project) => {
                    const logoUrl = project.logoFileId ? getFilePreviewUrl(project.logoFileId) : undefined;

                    return {
                        id: project.$id,
                        title: project.title,
                        role: project.role,
                        description: project.description,
                        date: project.date,
                        logoUrl,
                        link_url: project.link_url,
                        link_text: project.link_text,
                        isOpen: project.isOpen,
                    };
                });

                setProjects(mappedProjects);
                setError(null);
            } catch (err) {
                console.error('Error fetching projects:', err);
                setError('Failed to load projects');

                // Fallback to empty array if there's an error
                setProjects([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjects();
    }, []);

    return (
        <section id="projects" className="projects-css">
            <h1 className="sec-title">Projects</h1>

            {isLoading ? (
                <div className="loading-container">
                    <p>Loading projects...</p>
                    <CircularProgress />
                </div>
            ) : error ? (
                <div className="error-container">
                    <p>{error}</p>
                </div>
            ) : projects.length === 0 ? (
                <div className="empty-container">
                    <p>oops, no projects found</p>
                    <p>db probably broke (i blame appwrite)</p>
                    <p>at least the about me section has fallback data</p>
                    <p>you can still contact me there :)</p>
                </div>
            ) : (
                projects.map((project) => (
                    <ProjectCard
                        key={project.id}
                        title={project.title}
                        logo={project.logoUrl || '/img/placeholder.svg'}
                        role={project.role}
                        description={project.description}
                        date={project.date}
                        link_url={project.link_url}
                        link_text={project.link_text}
                        isOpen={project.isOpen}
                    />
                ))
            )}
        </section>
    );
};

export default Projects;
