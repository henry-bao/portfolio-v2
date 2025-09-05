import { useMemo } from 'react';
import ProjectCard from './ProjectCard';
import { useProjects } from '../../hooks/useAppwriteData';
import { getFilePreviewUrl } from '../../services/fileProxy';
import { LoadingError } from '../shared';

import './Projects.css';


const Projects = () => {
    const { data: projectsData, loading, error, refresh } = useProjects();

    const projects = useMemo(() => {
        if (!projectsData) return [];
        
        return projectsData.map((project) => {
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
    }, [projectsData]);

    return (
        <section id="projects" className="projects-css">
            <h1 className="sec-title">Projects</h1>
            
            <LoadingError loading={loading} error={error} onRetry={refresh}>
                {projects.length === 0 ? (
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
            </LoadingError>
        </section>
    );
};

export default Projects;
