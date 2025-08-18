import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveResumeVersion } from '../services/resumeService';
import { getFileUrl } from '../services/fileProxy';
import { logger } from '../utils/logger';

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
                    // If no active resume, redirect to 404
                    navigate('/404');
                }
            } catch (error) {
                logger.error('Error fetching active resume:', error);
                navigate('/404');
            }
        };

        redirectToResume();
    }, [navigate]);

    return null; // No need to render anything while redirecting
};

export default ResumeRedirect;
