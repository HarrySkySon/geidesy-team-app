import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tab,
  Tabs,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  CalendarToday as CalendarIcon,
  Login as LoginIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  VpnKey as VpnKeyIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  usersService, 
  UserWithDetails, 
  UserRole, 
  UserStatus 
} from '../../services/users.service';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const UserDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    action: 'activate' | 'deactivate' | null;
  }>({ open: false, action: null });
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);

  // Load user details
  useEffect(() => {
    if (id) {
      const loadUser = async () => {
        try {
          setLoading(true);
          setError(null);
          const userData = await usersService.getUser(id);
          setUser(userData);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load user');
        } finally {
          setLoading(false);
        }
      };

      loadUser();
    }
  }, [id]);

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!user) return;

    try {
      await usersService.deleteUser(user.id);
      navigate('/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeleteDialog(false);
    }
  };

  // Handle status change
  const handleStatusChange = async () => {
    if (!user || !statusDialog.action) return;

    try {
      if (statusDialog.action === 'activate') {
        await usersService.activateUser(user.id);
        setUser({ ...user, status: 'ACTIVE' });
      } else {
        await usersService.deactivateUser(user.id);
        setUser({ ...user, status: 'INACTIVE' });
      }
      setStatusDialog({ open: false, action: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
    }
  };

  // Handle password reset
  const handleResetPassword = async () => {
    if (!user) return;

    try {
      await usersService.resetPassword(user.id);
      setResetPasswordDialog(false);
      // You might want to show a success message here
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Get role color
  const getRoleColor = (role: UserRole): 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'default' => {
    switch (role) {
      case 'ADMIN': return 'error';
      case 'SUPERVISOR': return 'warning';
      case 'TEAM_LEAD': return 'info';
      case 'SURVEYOR': return 'primary';
      default: return 'default';
    }
  };

  // Get status color
  const getStatusColor = (status: UserStatus): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'error';
      case 'PENDING': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>Loading user details...</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !user) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'User not found'}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/users')}
          >
            Back to Users
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Button
              variant="text"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/users')}
              sx={{ mb: 1 }}
            >
              Back to Users
            </Button>
            
            {/* User Header */}
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar
                src={user.profileImageUrl}
                sx={{ width: 80, height: 80, mr: 3 }}
              >
                <PersonIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  {user.name}
                </Typography>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {user.email}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip
                    label={user.role}
                    color={getRoleColor(user.role)}
                  />
                  <Chip
                    label={user.status}
                    color={getStatusColor(user.status)}
                  />
                </Stack>
              </Box>
            </Box>
          </Box>
          
          {/* Actions */}
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/users/${user.id}/edit`)}
            >
              Edit User
            </Button>
            
            {user.status === 'ACTIVE' ? (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<LockIcon />}
                onClick={() => setStatusDialog({ open: true, action: 'deactivate' })}
              >
                Deactivate
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="success"
                startIcon={<LockOpenIcon />}
                onClick={() => setStatusDialog({ open: true, action: 'activate' })}
              >
                Activate
              </Button>
            )}
            
            <Button
              variant="outlined"
              color="info"
              startIcon={<VpnKeyIcon />}
              onClick={() => setResetPasswordDialog(true)}
            >
              Reset Password
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialog(true)}
            >
              Delete
            </Button>
          </Stack>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="user details tabs">
            <Tab label="Profile" />
            <Tab label="Activity" />
            <Tab label="Teams & Tasks" />
          </Tabs>
        </Paper>

        {/* Tab Panels */}
        
        {/* Profile Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Full Name"
                        secondary={user.name}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <EmailIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Email"
                        secondary={user.email}
                      />
                    </ListItem>
                    {user.phone && (
                      <ListItem>
                        <ListItemIcon>
                          <PhoneIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Phone"
                          secondary={user.phone}
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Organization Information */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Organization Information
                  </Typography>
                  <List>
                    {user.department && (
                      <ListItem>
                        <ListItemIcon>
                          <BusinessIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Department"
                          secondary={user.department}
                        />
                      </ListItem>
                    )}
                    {user.position && (
                      <ListItem>
                        <ListItemIcon>
                          <WorkIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Position"
                          secondary={user.position}
                        />
                      </ListItem>
                    )}
                    <ListItem>
                      <ListItemIcon>
                        <CalendarIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Member Since"
                        secondary={new Date(user.createdAt).toLocaleDateString()}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Account Status */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Account Status
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Box textAlign="center">
                        <LoginIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="h6">Last Login</Typography>
                        <Typography color="text.secondary">
                          {user.lastLogin 
                            ? new Date(user.lastLogin).toLocaleString()
                            : 'Never logged in'
                          }
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box textAlign="center">
                        <CalendarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="h6">Account Created</Typography>
                        <Typography color="text.secondary">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box textAlign="center">
                        <CalendarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="h6">Last Updated</Typography>
                        <Typography color="text.secondary">
                          {new Date(user.updatedAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Activity Tab */}
        <TabPanel value={activeTab} index={1}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Typography color="text.secondary">
                Activity tracking will be implemented in a future update.
                This will show user login history, task activities, and other relevant actions.
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Teams & Tasks Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Teams
                  </Typography>
                  <Typography color="text.secondary">
                    Team membership information will be displayed here.
                    This feature will be implemented when team assignments are integrated.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Assigned Tasks
                  </Typography>
                  <Typography color="text.secondary">
                    User's assigned tasks and task history will be displayed here.
                    This feature will be implemented when task assignments are integrated.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
          <DialogTitle>Delete User</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete user "{user.name}"?
              This action cannot be undone and will remove all associated data.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog(false)} color="inherit">
              Cancel
            </Button>
            <Button onClick={handleDeleteUser} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Status Change Dialog */}
        <Dialog
          open={statusDialog.open}
          onClose={() => setStatusDialog({ open: false, action: null })}
        >
          <DialogTitle>
            {statusDialog.action === 'activate' ? 'Activate User' : 'Deactivate User'}
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to {statusDialog.action} user "{user.name}"?
              {statusDialog.action === 'deactivate' && 
                ' This will prevent them from logging in and accessing the system.'
              }
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setStatusDialog({ open: false, action: null })}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusChange}
              color={statusDialog.action === 'activate' ? 'success' : 'warning'}
              variant="contained"
            >
              {statusDialog.action === 'activate' ? 'Activate' : 'Deactivate'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog
          open={resetPasswordDialog}
          onClose={() => setResetPasswordDialog(false)}
        >
          <DialogTitle>Reset Password</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to reset the password for "{user.name}"?
              A temporary password will be generated and sent to their email address.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResetPasswordDialog(false)} color="inherit">
              Cancel
            </Button>
            <Button onClick={handleResetPassword} color="primary" variant="contained">
              Reset Password
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default UserDetails;