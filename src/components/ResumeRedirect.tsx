import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveResumeVersion } from '../services/resumeService';
import { getFileUrl } from '../services/fileProxy';

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
                    // If no active resume, redirect to 404 (handled by catch-all route)
                    navigate('/404', { replace: true });
                }
            } catch (error) {
                console.error('Error fetching active resume:', error);
                navigate('/404', { replace: true });
            }
        };

        redirectToResume();
    }, [navigate]);

    return null; // No need to render anything while redirecting
};

export default ResumeRedirect;
