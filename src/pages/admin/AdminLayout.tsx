import { useState } from 'react';
import type { ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    AppBar,
    Box,
    Button,
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
import { useNotify } from '../../app/notifications/useNotify';
import { routes } from '../../app/routes';
import { COMPACT_LAYOUT_WIDTH_PX, useBreakpoints } from '../../hooks';
import { useSignOut } from '../../queries';

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
    isSelected?: boolean;
    disabled?: boolean;
}

const SidebarListItem = ({ text, icon, onClick, isIconOnly, isSelected = false, disabled = false }: SidebarListItemProps) => (
    <ListItem disablePadding>
        <Tooltip title={isIconOnly ? text : ''} placement="right">
            <ListItemButton
                onClick={onClick}
                selected={isSelected}
                disabled={disabled}
                aria-current={isSelected ? 'page' : undefined}
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

/**
 * The sidebar follows the compact breakpoint until the user toggles it; that choice holds until the
 * breakpoint flips again.
 */
function useSidebarCollapse(isCompact: boolean) {
    const [override, setOverride] = useState<boolean | null>(null);
    const [lastIsCompact, setLastIsCompact] = useState(isCompact);

    if (lastIsCompact !== isCompact) {
        setLastIsCompact(isCompact);
        setOverride(null);
    }

    const isCollapsed = override ?? isCompact;
    return { isCollapsed, toggle: () => setOverride(!isCollapsed) };
}

const AdminLayout = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const theme = useTheme();
    const { isMobile } = useBreakpoints();
    const isCompact = useMediaQuery(theme.breakpoints.down(COMPACT_LAYOUT_WIDTH_PX));
    const { isCollapsed, toggle } = useSidebarCollapse(isCompact);
    const signOut = useSignOut();
    const notify = useNotify();

    const drawerWidth = isCollapsed ? COLLAPSED_DRAWER_WIDTH : EXPANDED_DRAWER_WIDTH;
    const isIconOnly = isCollapsed && !isMobile;

    const handleMenuItemClick = (path: string) => {
        setMobileOpen(false);
        navigate(path);
    };

    const handleSignOut = async () => {
        try {
            await signOut.mutateAsync();
        } catch (error) {
            // The local session is cleared either way; only the server-side one may linger.
            notify.error(error);
        }
        navigate(routes.admin.login, { replace: true });
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
                    onClick={toggle}
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
                        isSelected={pathname === item.path || pathname.startsWith(`${item.path}/`)}
                    />
                ))}
            </List>
            <Divider />
            <List>
                <SidebarListItem
                    text={signOut.isPending ? 'Signing out…' : 'Logout'}
                    icon={<LogoutIcon />}
                    onClick={() => void handleSignOut()}
                    isIconOnly={isIconOnly}
                    disabled={signOut.isPending}
                />
            </List>
        </>
    );

    return (
        <Box sx={{ display: 'flex' }}>
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
                    ModalProps={{ keepMounted: true }}
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
                    minWidth: 0,
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

export default AdminLayout;
