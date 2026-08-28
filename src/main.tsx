import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Analytics } from '@vercel/analytics/react';

import App from './App';
import { theme } from './theme';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Unable to mount the app: no #root element found in the document.');
}

createRoot(rootElement).render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Analytics />
            <App />
        </ThemeProvider>
    </StrictMode>
);
