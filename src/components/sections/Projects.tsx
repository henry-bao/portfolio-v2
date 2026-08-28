import { useProjects } from '../../hooks';
import { getFilePreviewUrl } from '../../services/storageService';
import { LoadingError } from '../shared';
import ProjectCard from './ProjectCard';

import './Projects.css';

const Projects = () => {
    const { data: projects, loading, error, refresh } = useProjects();

    return (
        <section id="projects" className="projects-css">
            <h1 className="sec-title">Projects</h1>

            <LoadingError loading={loading} error={error} onRetry={refresh}>
                {projects?.length ? (
                    projects.map((project) => (
                        <ProjectCard
                            key={project.$id}
                            project={project}
                            logoUrl={project.logoFileId ? getFilePreviewUrl(project.logoFileId) : undefined}
                        />
                    ))
                ) : (
                    <div className="empty-container">
                        <p>oops, no projects found</p>
                        <p>db probably broke (i blame appwrite)</p>
                        <p>at least the about me section has fallback data</p>
                        <p>you can still contact me there :)</p>
                    </div>
                )}
            </LoadingError>
        </section>
    );
};

export default Projects;
