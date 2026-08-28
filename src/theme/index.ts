import { createTheme } from '@mui/material/styles';

/** Dark theme shared by the public site and the dashboard. */
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
