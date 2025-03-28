import { useState, useEffect, JSX } from 'react';
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
    KeyboardDoubleArrowLeft as LeftIcon,
    KeyboardDoubleArrowRight as RightIcon,
    Home,
    Description as ResumeIcon,
    Book as BlogIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const expandedDrawerWidth = 240;
const collapsedDrawerWidth = 64;

interface SidebarListItemProps {
    tooltipText: string;
    text: string;
    icon: JSX.Element;
    onClick: () => void;
    isCollapsed: boolean;
    isMobile: boolean;
}

const SidebarListItem = ({ tooltipText, text, icon, onClick, isCollapsed, isMobile }: SidebarListItemProps) => {
    const buttonStyles = {
        py: { xs: 3, sm: 1 },
        justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start',
    };

    const iconStyles = {
        minWidth: isCollapsed && !isMobile ? 0 : undefined,
        justifyContent: isCollapsed && !isMobile ? 'center' : undefined,
    };

    return (
        <ListItem disablePadding>
            <Tooltip title={isCollapsed ? tooltipText : ''} placement="right">
                <ListItemButton onClick={onClick} sx={buttonStyles}>
                    <ListItemIcon sx={iconStyles}>{icon}</ListItemIcon>
                    {(!isCollapsed || isMobile) && <ListItemText primary={text} />}
                </ListItemButton>
            </Tooltip>
        </ListItem>
    );
};

const DashboardLayout = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down(992));

    useEffect(() => {
        setIsCollapsed(isTablet);
    }, [isTablet]);

    const handleMenuItemClick = (path: string) => {
        if (mobileOpen) setMobileOpen(false);
        navigate(path);
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleDrawerCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/admin/login');
    };

    const drawerWidth = isCollapsed ? collapsedDrawerWidth : expandedDrawerWidth;

    const menuItems = [
        { text: 'Overview', icon: <DashboardIcon />, path: '/admin/overview' },
        { text: 'Profile', icon: <PersonIcon />, path: '/admin/profile' },
        { text: 'Projects', icon: <WorkIcon />, path: '/admin/projects' },
        { text: 'Blogs', icon: <BlogIcon />, path: '/admin/blogs' },
        { text: 'Resumes', icon: <ResumeIcon />, path: '/admin/resumes' },
    ];

    const drawerContent = (
        <>
            <Toolbar
                sx={{
                    justifyContent: { xs: 'space-between', sm: isCollapsed ? 'center' : 'space-between' },
                    minHeight: 64,
                    px: { xs: 2, sm: isCollapsed ? 0 : 2 },
                }}
            >
                {(!isCollapsed || isMobile) && (
                    <Typography variant="h6" noWrap>
                        Menu
                    </Typography>
                )}
                <IconButton
                    onClick={handleDrawerCollapse}
                    sx={{ mr: isCollapsed ? 0 : -1, display: { xs: 'none', sm: 'inline-flex' } }}
                >
                    {isCollapsed ? <RightIcon /> : <LeftIcon />}
                </IconButton>
            </Toolbar>
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <SidebarListItem
                        key={item.text}
                        tooltipText={item.text}
                        text={item.text}
                        icon={item.icon}
                        onClick={() => handleMenuItemClick(item.path)}
                        isCollapsed={isCollapsed}
                        isMobile={isMobile}
                    />
                ))}
            </List>
            <Divider />
            <List>
                <SidebarListItem
                    tooltipText="Logout"
                    text="Logout"
                    icon={<LogoutIcon />}
                    onClick={handleLogout}
                    isCollapsed={isCollapsed}
                    isMobile={isMobile}
                />
            </List>
        </>
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
                    <Button
                        color="inherit"
                        onClick={() => {
                            navigate('/');
                        }}
                        startIcon={<Home />}
                    >
                        Home
                    </Button>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                aria-label="dashboard navigation"
            >
                {/* Mobile Drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true,
                        disableScrollLock: true,
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: '70vw',
                            transition: 'width 0.2s',
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
                {/* Desktop Drawer */}
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
                    {drawerContent}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: isMobile ? 2 : 3,
                    backgroundColor: 'background.default',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100dvh',
                }}
            >
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};

export default DashboardLayout;
