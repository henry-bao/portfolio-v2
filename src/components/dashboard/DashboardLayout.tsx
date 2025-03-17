import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
    AppBar,
    Box,
    CssBaseline,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Button,
    Tooltip,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    Person as PersonIcon,
    Work as WorkIcon,
    ExitToApp as LogoutIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Home,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const expandedDrawerWidth = 240;
const collapsedDrawerWidth = 64;

const DashboardLayout = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleMenuItemClick = (path: string) => {
        setMobileOpen(!mobileOpen);
        navigate(path);
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleDrawerCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const drawerWidth = isCollapsed ? collapsedDrawerWidth : expandedDrawerWidth;

    const handleLogout = async () => {
        await logout();
        navigate('/admin/login');
    };

    const menuItems = [
        { text: 'Overview', icon: <DashboardIcon />, path: '/admin/overview' },
        { text: 'Profile', icon: <PersonIcon />, path: '/admin/profile' },
        { text: 'Projects', icon: <WorkIcon />, path: '/admin/projects' },
    ];

    const drawer = (
        <div>
            <Toolbar
                sx={{
                    justifyContent: { xs: 'space-between', sm: isCollapsed ? 'center' : 'space-between' },
                    minHeight: 64,
                    px: { xs: 2, sm: isCollapsed ? 0 : 2 },
                }}
            >
                {(!isCollapsed || isMobile) && (
                    <Typography variant="h6" noWrap component="div">
                        Menu
                    </Typography>
                )}
                <IconButton
                    onClick={handleDrawerCollapse}
                    sx={{
                        mr: isCollapsed ? 0 : -1,
                        display: { xs: 'none', sm: 'inline-flex' },
                    }}
                >
                    {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                </IconButton>
            </Toolbar>
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <Tooltip title={isCollapsed ? item.text : ''} placement="right">
                            <ListItemButton onClick={() => handleMenuItemClick(item.path)}>
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                {(!isCollapsed || isMobile) && <ListItemText primary={item.text} />}
                            </ListItemButton>
                        </Tooltip>
                    </ListItem>
                ))}
            </List>
            <Divider />
            <List>
                <ListItem disablePadding>
                    <Tooltip title={isCollapsed ? 'Logout' : ''} placement="right">
                        <ListItemButton onClick={handleLogout}>
                            <ListItemIcon>
                                <LogoutIcon />
                            </ListItemIcon>
                            {(!isCollapsed || isMobile) && <ListItemText primary="Logout" />}
                        </ListItemButton>
                    </Tooltip>
                </ListItem>
            </List>
        </div>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    transition: 'width 0.2s, margin-left 0.2s',
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Dashboard
                    </Typography>
                    <Button color="inherit" onClick={() => navigate('/')}>
                        <Home />
                        {isMobile ? '' : 'View Site'}
                    </Button>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                aria-label="dashboard navigation"
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: '60vw',
                            transition: 'width 0.2s',
                        },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            transition: 'width 0.2s',
                            overflowX: 'hidden',
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    mt: '64px',
                    backgroundColor: 'background.default',
                    minHeight: '100vh',
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
};

export default DashboardLayout;
