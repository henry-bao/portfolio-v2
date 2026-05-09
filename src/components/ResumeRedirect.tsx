import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveResumeVersion } from '../services/resumeService';
import { getFileUrl } from '../services/fileProxy';
import { routes } from '../routes/paths';

const ResumeRedirect = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const redirectToResume = async () => {
            try {
                const activeResume = await getActiveResumeVersion();
                if (activeResume) {
                    const fileUrl = getFileUrl(activeResume.fileId);
                    window.location.href = fileUrl;
                } else {
                    navigate(routes.notFound);
                }
            } catch (error) {
                console.error('Error fetching active resume:', error);
                navigate(routes.notFound);
            }
        };

        redirectToResume();
    }, [navigate]);

    return null; // No need to render anything while redirecting
};

export default ResumeRedirect;
