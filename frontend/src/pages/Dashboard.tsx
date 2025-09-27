import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Task as TaskIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '@hooks/useAuth';
import { useDispatch } from 'react-redux';
import { logoutUser } from '@store/slices/authSlice';
import { AppDispatch } from '@store/index';
import { apiService } from '@services/api';

interface DashboardStats {
  tasks: any[];
  teams: any[];
  systemHealth: {
    status: string;
    timestamp: string;
    uptime: number;
  };
}

const Dashboard: React.FC = () => {
  const { user, userName, userRole, isAdmin, isSupervisor } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load dashboard data
      const [tasksResponse, teamsResponse, healthResponse] = await Promise.all([
        fetch('http://localhost:3000/api/v1/tasks').then(r => r.json()),
        fetch('http://localhost:3000/api/v1/teams').then(r => r.json()),
        fetch('http://localhost:3000/health').then(r => r.json())
      ]);

      setStats({
        tasks: tasksResponse.data?.tasks || [],
        teams: teamsResponse.data?.teams || [],
        systemHealth: healthResponse
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser());
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'error';
      case 'SUPERVISOR': return 'warning';
      case 'TEAM_MEMBER': return 'primary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Welcome back, {userName}!
          </Typography>
          <Chip 
            label={userRole} 
            color={getRoleColor(userRole || '')} 
            size="small" 
            sx={{ mt: 1 }}
          />
        </Box>
        <Button
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          color="error"
        >
          Logout
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button onClick={loadDashboardData} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Quick Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TaskIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {stats?.tasks?.length || 0}
                  </Typography>
                  <Typography color="textSecondary">
                    Tasks
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <GroupIcon color="secondary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {stats?.teams?.length || 0}
                  </Typography>
                  <Typography color="textSecondary">
                    Teams
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircleIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {stats?.systemHealth?.status === 'healthy' ? 'OK' : 'ERROR'}
                  </Typography>
                  <Typography color="textSecondary">
                    System Health
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ScheduleIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {Math.floor((stats?.systemHealth?.uptime || 0) / 60)}m
                  </Typography>
                  <Typography color="textSecondary">
                    Uptime
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Tasks */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Tasks
              </Typography>
              <List>
                {stats?.tasks?.slice(0, 5).map((task, index) => (
                  <ListItem key={task.id || index}>
                    <ListItemIcon>
                      <TaskIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={task.title}
                      secondary={`Status: ${task.status} | Priority: ${task.priority}`}
                    />
                  </ListItem>
                )) || (
                  <ListItem>
                    <ListItemText primary="No tasks available" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Teams Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Teams Overview
              </Typography>
              <List>
                {stats?.teams?.slice(0, 5).map((team, index) => (
                  <ListItem key={team.id || index}>
                    <ListItemIcon>
                      <GroupIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={team.name}
                      secondary={`Status: ${team.status} | Members: ${team.memberCount || 0}`}
                    />
                  </ListItem>
                )) || (
                  <ListItem>
                    <ListItemText primary="No teams available" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* System Info */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Backend Status
                  </Typography>
                  <Typography variant="body1">
                    {stats?.systemHealth?.status || 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    API URL
                  </Typography>
                  <Typography variant="body1">
                    http://localhost:3000
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    User Role
                  </Typography>
                  <Typography variant="body1">
                    {userRole}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {new Date().toLocaleTimeString()}
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={loadDashboardData}
                  sx={{ mr: 2 }}
                >
                  Refresh Data
                </Button>
                <Button 
                  variant="text"
                  onClick={() => window.open('http://localhost:3000/health', '_blank')}
                >
                  Check API Health
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;