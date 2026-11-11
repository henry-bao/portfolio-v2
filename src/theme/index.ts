import { createTheme } from '@mui/material/styles';

/**
 * Dark theme for the MUI components used by the dashboard and the public site.
 * The brand colours mirror the CSS custom properties in src/styles/tokens.css.
 */
export const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#2f7295' },
        secondary: { main: '#c0738b' },
        background: { default: '#121212', paper: '#1e1e1e' },
        text: { primary: '#ffffff', secondary: 'rgba(255, 255, 255, 0.7)' },
    },
    typography: {
        fontFamily: '"Source Code Pro", monospace',
    },
    components: {
        MuiAppBar: { styleOverrides: { root: { backgroundColor: '#1e1e1e' } } },
        MuiDrawer: { styleOverrides: { paper: { backgroundColor: '#1e1e1e' } } },
    },
});
