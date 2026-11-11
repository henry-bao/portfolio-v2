import { useSectionVisibility } from '../queries';
import Footer from '../components/layout/Footer';
import Navbar from '../components/layout/Navbar';
import About from '../components/sections/About';
import Blog from '../components/sections/Blog';
import Landing from '../components/sections/Landing';
import Projects from '../components/sections/Projects';

/** The portfolio: each section loads its own data and handles its own failures. */
function HomePage() {
    const { isVisible } = useSectionVisibility();

    return (
        <>
            <Navbar />
            <main>
                <Landing />
                {isVisible('about') && <About />}
                {isVisible('projects') && <Projects />}
                {isVisible('blogs') && <Blog />}
            </main>
            <Footer />
        </>
    );
}

export default HomePage;
