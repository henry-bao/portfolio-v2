import { useProjects } from '../../hooks';
import { getFilePreviewUrl } from '../../services/storageService';
import { LoadingError } from '../shared';
import { Section, SectionTitle } from '../layout/Section';
import ProjectCard from './ProjectCard';
import styles from './Projects.module.css';

const Projects = () => {
    const { data: projects, loading, error, refresh } = useProjects();

    return (
        <Section id="projects" inset className={styles.projects}>
            <SectionTitle>Projects</SectionTitle>

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
                    <div className={styles.empty}>
                        <p>oops, no projects found</p>
                        <p>db probably broke (i blame appwrite)</p>
                        <p>at least the about me section has fallback data</p>
                        <p>you can still contact me there :)</p>
                    </div>
                )}
            </LoadingError>
        </Section>
    );
};

export default Projects;
