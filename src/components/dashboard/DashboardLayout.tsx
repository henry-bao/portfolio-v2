import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
    AppBar,
    Box,
    Button,
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
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import {
    Book as BlogIcon,
    Dashboard as DashboardIcon,
    Description as ResumeIcon,
    ExitToApp as LogoutIcon,
    Home,
    KeyboardDoubleArrowLeft as LeftIcon,
    Menu as MenuIcon,
    Person as PersonIcon,
    KeyboardDoubleArrowRight as RightIcon,
    Work as WorkIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/useAuth';
import { COMPACT_LAYOUT_WIDTH_PX, useBodyScrollLock, useBreakpoints } from '../../hooks';
import { routes } from '../../routes/paths';

const EXPANDED_DRAWER_WIDTH = 240;
const COLLAPSED_DRAWER_WIDTH = 64;
const DRAWER_TRANSITION = 'width 0.2s, margin-left 0.2s';

const menuItems = [
    { text: 'Overview', icon: <DashboardIcon />, path: routes.admin.overview },
    { text: 'Profile', icon: <PersonIcon />, path: routes.admin.profile },
    { text: 'Projects', icon: <WorkIcon />, path: routes.admin.projects },
    { text: 'Blogs', icon: <BlogIcon />, path: routes.admin.blogs },
    { text: 'Resumes', icon: <ResumeIcon />, path: routes.admin.resumes },
];

interface SidebarListItemProps {
    text: string;
    icon: ReactNode;
    onClick: () => void;
    /** Icon-only mode: the drawer is collapsed and we are not on a mobile overlay. */
    isIconOnly: boolean;
}

const SidebarListItem = ({ text, icon, onClick, isIconOnly }: SidebarListItemProps) => (
    <ListItem disablePadding>
        <Tooltip title={isIconOnly ? text : ''} placement="right">
            <ListItemButton
                onClick={onClick}
                sx={{ py: { xs: 3, sm: 1 }, justifyContent: isIconOnly ? 'center' : 'flex-start' }}
            >
                <ListItemIcon sx={{ minWidth: isIconOnly ? 0 : undefined, justifyContent: isIconOnly ? 'center' : undefined }}>
                    {icon}
                </ListItemIcon>
                {!isIconOnly && <ListItemText primary={text} />}
            </ListItemButton>
        </Tooltip>
    </ListItem>
);

const DashboardLayout = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const { isMobile } = useBreakpoints();
    const isCompact = useMediaQuery(theme.breakpoints.down(COMPACT_LAYOUT_WIDTH_PX));

    useBodyScrollLock(mobileOpen);

    useEffect(() => {
        setIsCollapsed(isCompact);
    }, [isCompact]);

    const drawerWidth = isCollapsed ? COLLAPSED_DRAWER_WIDTH : EXPANDED_DRAWER_WIDTH;
    const isIconOnly = isCollapsed && !isMobile;

    const handleMenuItemClick = (path: string) => {
        setMobileOpen(false);
        navigate(path);
    };

    const handleLogout = async () => {
        await logout();
        navigate(routes.admin.login);
    };

    const drawerContent = (
        <>
            <Toolbar
                sx={{
                    justifyContent: { xs: 'space-between', sm: isCollapsed ? 'center' : 'space-between' },
                    minHeight: 64,
                    px: { xs: 2, sm: isCollapsed ? 0 : 2 },
                }}
            >
                {!isIconOnly && (
                    <Typography variant="h6" noWrap>
                        Menu
                    </Typography>
                )}
                <IconButton
                    onClick={() => setIsCollapsed((currentIsCollapsed) => !currentIsCollapsed)}
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
                        text={item.text}
                        icon={item.icon}
                        onClick={() => handleMenuItemClick(item.path)}
                        isIconOnly={isIconOnly}
                    />
                ))}
            </List>
            <Divider />
            <List>
                <SidebarListItem
                    text="Logout"
                    icon={<LogoutIcon />}
                    onClick={handleLogout}
                    isIconOnly={isIconOnly}
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
                    transition: DRAWER_TRANSITION,
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={() => setMobileOpen((currentMobileOpen) => !currentMobileOpen)}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Dashboard
                    </Typography>
                    <Button color="inherit" onClick={() => navigate(routes.home)} startIcon={<Home />}>
                        Home
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
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true, disableScrollLock: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: '70vw', transition: 'width 0.2s' },
                    }}
                >
                    {drawerContent}
                </Drawer>
                <Drawer
                    variant="permanent"
                    open
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            transition: 'width 0.2s',
                            overflowX: 'hidden',
                        },
                    }}
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
                    minHeight: '100vh',
                }}
            >
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};

export default DashboardLayout;
