import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './app/App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Unable to mount the app: no #root element found in the document.');
}

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>
);
