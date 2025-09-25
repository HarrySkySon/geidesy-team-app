import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Alert,
  Pagination,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usersService, User, UserFilters, UsersResponse, UserRole, UserStatus } from '../../services/users.service';

const Users: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  // Filters
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 12,
    search: '',
    role: undefined,
    status: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Action dialogs
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({ open: false, user: null });

  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    user: User | null;
    action: 'activate' | 'deactivate' | null;
  }>({ open: false, user: null, action: null });

  // Load users
  const loadUsers = async (newFilters?: Partial<UserFilters>) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentFilters = newFilters ? { ...filters, ...newFilters } : filters;
      const response: UsersResponse = await usersService.getUsers(currentFilters);
      
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Handle filter changes
  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    loadUsers(newFilters);
  };

  // Handle page change
  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    loadUsers(newFilters);
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!deleteDialog.user) return;

    try {
      await usersService.deleteUser(deleteDialog.user.id);
      setDeleteDialog({ open: false, user: null });
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  // Handle user status change
  const handleStatusChange = async () => {
    if (!statusDialog.user || !statusDialog.action) return;

    try {
      if (statusDialog.action === 'activate') {
        await usersService.activateUser(statusDialog.user.id);
      } else {
        await usersService.deactivateUser(statusDialog.user.id);
      }
      setStatusDialog({ open: false, user: null, action: null });
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
    }
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

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            User Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/users/new')}
          >
            Add New User
          </Button>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Search users"
                  placeholder="Search by name or email"
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={filters.role || ''}
                    label="Role"
                    onChange={(e) => handleFilterChange('role', e.target.value || undefined)}
                  >
                    <MenuItem value="">All Roles</MenuItem>
                    <MenuItem value="ADMIN">Admin</MenuItem>
                    <MenuItem value="SUPERVISOR">Supervisor</MenuItem>
                    <MenuItem value="TEAM_LEAD">Team Lead</MenuItem>
                    <MenuItem value="SURVEYOR">Surveyor</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status || ''}
                    label="Status"
                    onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={filters.sortBy || 'createdAt'}
                    label="Sort By"
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <MenuItem value="name">Name</MenuItem>
                    <MenuItem value="email">Email</MenuItem>
                    <MenuItem value="role">Role</MenuItem>
                    <MenuItem value="status">Status</MenuItem>
                    <MenuItem value="createdAt">Created Date</MenuItem>
                    <MenuItem value="lastLogin">Last Login</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Users Grid */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <Typography>Loading users...</Typography>
          </Box>
        ) : users.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="h6" align="center" color="text.secondary">
                No users found
              </Typography>
              <Typography align="center" color="text.secondary" sx={{ mt: 1 }}>
                {filters.search || filters.role || filters.status
                  ? 'Try adjusting your filters'
                  : 'Start by adding your first user'
                }
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <>
            <Grid container spacing={3}>
              {users.map((user) => (
                <Grid item xs={12} md={6} lg={4} key={user.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      {/* User Avatar and Basic Info */}
                      <Box display="flex" alignItems="center" mb={2}>
                        <Avatar
                          src={user.profileImageUrl}
                          sx={{ width: 56, height: 56, mr: 2 }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Box flexGrow={1}>
                          <Typography variant="h6" component="h3">
                            {user.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Role and Status */}
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Chip
                          label={user.role}
                          color={getRoleColor(user.role)}
                          size="small"
                        />
                        <Chip
                          label={user.status}
                          color={getStatusColor(user.status)}
                          size="small"
                        />
                      </Box>

                      {/* Contact Information */}
                      <Stack spacing={1}>
                        {user.phone && (
                          <Box display="flex" alignItems="center">
                            <PhoneIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {user.phone}
                            </Typography>
                          </Box>
                        )}
                        {user.department && (
                          <Typography variant="body2" color="text.secondary">
                            Department: {user.department}
                          </Typography>
                        )}
                        {user.position && (
                          <Typography variant="body2" color="text.secondary">
                            Position: {user.position}
                          </Typography>
                        )}
                      </Stack>

                      {/* Last Login */}
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                        {user.lastLogin 
                          ? `Last login: ${new Date(user.lastLogin).toLocaleDateString()}`
                          : 'Never logged in'
                        }
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Created: {new Date(user.createdAt).toLocaleDateString()}
                      </Typography>
                    </CardContent>

                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => navigate(`/users/${user.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => navigate(`/users/${user.id}/edit`)}
                      >
                        Edit
                      </Button>
                      
                      {/* Status Toggle */}
                      {user.status === 'ACTIVE' ? (
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => setStatusDialog({ open: true, user, action: 'deactivate' })}
                          title="Deactivate user"
                        >
                          <LockIcon />
                        </IconButton>
                      ) : (
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => setStatusDialog({ open: true, user, action: 'activate' })}
                          title="Activate user"
                        >
                          <LockOpenIcon />
                        </IconButton>
                      )}

                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteDialog({ open: true, user })}
                        title="Delete user"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <Box display="flex" justifyContent="center" mt={4}>
                <Pagination
                  count={pagination.pages}
                  page={pagination.page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, user: null })}
        >
          <DialogTitle>Delete User</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete user "{deleteDialog.user?.name}"?
              This action cannot be undone and will remove all associated data.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteDialog({ open: false, user: null })}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteUser}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Status Change Confirmation Dialog */}
        <Dialog
          open={statusDialog.open}
          onClose={() => setStatusDialog({ open: false, user: null, action: null })}
        >
          <DialogTitle>
            {statusDialog.action === 'activate' ? 'Activate User' : 'Deactivate User'}
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to {statusDialog.action} user "{statusDialog.user?.name}"?
              {statusDialog.action === 'deactivate' && 
                ' This will prevent them from logging in and accessing the system.'
              }
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setStatusDialog({ open: false, user: null, action: null })}
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
      </Box>
    </Container>
  );
};

export default Users;