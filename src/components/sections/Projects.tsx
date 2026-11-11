import { CircularProgress } from '@mui/material';
import { useProjects } from '../../queries';
import { Section, SectionTitle } from '../layout/Section';
import ProjectCard from './ProjectCard';
import styles from './Projects.module.css';

const Projects = () => {
    const { data: projects, isPending, isError, refetch } = useProjects();

    return (
        <Section id="projects" inset className={styles.projects}>
            <SectionTitle>Projects</SectionTitle>

            {isPending ? (
                <div className={styles.loading}>
                    <CircularProgress />
                </div>
            ) : isError ? (
                <div className={styles.empty}>
                    <p>oops, the projects didn't load</p>
                    <p>db probably broke (i blame appwrite)</p>
                    <p>at least the about me section has fallback data</p>
                    <p>you can still contact me there :)</p>
                    <button type="button" className={styles.retry} onClick={() => void refetch()}>
                        try again
                    </button>
                </div>
            ) : projects.length === 0 ? (
                <div className={styles.empty}>
                    <p>no projects here yet</p>
                </div>
            ) : (
                projects.map((project) => <ProjectCard key={project.$id} project={project} />)
            )}
        </Section>
    );
};

export default Projects;
