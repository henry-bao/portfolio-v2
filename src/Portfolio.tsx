import { Models } from 'appwrite';
import { SectionVisibility } from './services/appwrite';
import { useProfileData } from './hooks/useAppwriteData';
import { getFileUrl } from './services/fileProxy';

import Footer from './components/layout/Footer';
import Navbar from './components/layout/Navbar';
import About from './components/sections/About';
import Landing from './components/sections/Landing';
import Projects from './components/sections/Projects';
import Blog from './components/sections/Blog';

import './Portfolio.css';

interface PortfolioProps {
    sectionVisibility: (Models.Document & SectionVisibility) | null;
}

function Portfolio({ sectionVisibility }: PortfolioProps) {
    const { data: profile } = useProfileData();
    
    const resumeUrl = profile?.resumeFileId ? getFileUrl(profile.resumeFileId) : null;

    return (
        <>
            <Navbar sectionVisibility={sectionVisibility} />
            <main>
                <Landing />
                {(!sectionVisibility || sectionVisibility.about) && <About />}
                {(!sectionVisibility || sectionVisibility.projects) && <Projects />}
                {(!sectionVisibility || sectionVisibility.blogs) && <Blog />}
            </main>
            <Footer resumeUrl={resumeUrl} />
        </>
    );
}

export default Portfolio;
