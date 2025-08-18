import { PropsWithChildren } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const adminTheme = createTheme({
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

const AdminThemeProvider = ({ children }: PropsWithChildren) => {
    return (
        <ThemeProvider theme={adminTheme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
};

export default AdminThemeProvider;

