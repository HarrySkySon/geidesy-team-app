import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  Container,
  CssBaseline,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Assignment,
  Group,
  LocationOn,
  Assessment,
  Settings,
  Logout,
  AccountCircle,
  Notifications,
  Person,
  Admin,
  Supervisor,
} from '@mui/icons-material';
import { useAuth } from '@hooks/useAuth';

const drawerWidth = 240;

interface NavigationItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  roles?: string[];
  requiredPermission?: string;
}

export const AppLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    user,
    userRole,
    isAdmin,
    isSupervisor,
    logout,
    getUserDisplayName,
    getUserInitials,
    getProfileImageUrl,
    canManageTasks,
    canManageTeams,
    canViewReports,
    canManageUsers,
  } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigationItems: NavigationItem[] = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/dashboard',
    },
    {
      text: 'Tasks',
      icon: <Assignment />,
      path: '/tasks',
    },
    {
      text: 'Teams',
      icon: <Group />,
      path: '/teams',
      requiredPermission: 'canViewTeams',
    },
    {
      text: 'Locations',
      icon: <LocationOn />,
      path: '/locations',
    },
    {
      text: 'Reports',
      icon: <Assessment />,
      path: '/reports',
      requiredPermission: 'canViewReports',
    },
    {
      text: 'Users',
      icon: <Person />,
      path: '/users',
      requiredPermission: 'canManageUsers',
      roles: ['ADMIN'],
    },
    {
      text: 'Settings',
      icon: <Settings />,
      path: '/settings',
    },
  ];

  const filteredNavigationItems = navigationItems.filter((item) => {
    if (item.roles && !item.roles.includes(userRole || '')) {
      return false;
    }
    
    if (item.requiredPermission) {
      switch (item.requiredPermission) {
        case 'canManageUsers':
          return canManageUsers();
        case 'canViewReports':
          return canViewReports();
        case 'canViewTeams':
          return canManageTeams() || true; // All users can view teams
        default:
          return true;
      }
    }
    
    return true;
  });

  const drawer = (
    <div>
      {/* Logo/Brand */}
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
        }}
      >
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 'bold',
            color: 'primary.main',
            textAlign: 'center',
          }}
        >
          Geodesy Teams
        </Typography>
      </Toolbar>

      <Divider />

      {/* User Info */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Avatar
          src={getProfileImageUrl() || undefined}
          sx={{
            width: 56,
            height: 56,
            mx: 'auto',
            mb: 1,
            bgcolor: 'primary.main',
          }}
        >
          {getUserInitials()}
        </Avatar>
        <Typography variant="subtitle2" noWrap>
          {getUserDisplayName()}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
          {isAdmin && (
            <Tooltip title="Administrator">
              <Admin fontSize="small" color="error" sx={{ mr: 0.5 }} />
            </Tooltip>
          )}
          {isSupervisor && !isAdmin && (
            <Tooltip title="Supervisor">
              <Supervisor fontSize="small" color="warning" sx={{ mr: 0.5 }} />
            </Tooltip>
          )}
          <Typography variant="caption" color="text.secondary">
            {userRole?.toLowerCase().replace('_', ' ')}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Navigation */}
      <List>
        {filteredNavigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isActive}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) {
                    setMobileOpen(false);
                  }
                }}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
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
            Surveying Team Management
          </Typography>

          {/* Notifications */}
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Badge badgeContent={0} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          {/* Profile Menu */}
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="profile-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar
              src={getProfileImageUrl() || undefined}
              sx={{ width: 32, height: 32 }}
            >
              {getUserInitials()}
            </Avatar>
          </IconButton>

          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem onClick={() => { navigate('/profile'); handleProfileMenuClose(); }}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { navigate('/settings'); handleProfileMenuClose(); }}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="navigation"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default AppLayout;