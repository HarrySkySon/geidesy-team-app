import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  Badge,
  Snackbar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment,
  Group,
  LocationOn,
  Assessment,
  TrendingUp,
  Warning,
  CheckCircle,
  Schedule,
  Person,
  Notifications,
  Refresh,
  Wifi,
  WifiOff,
} from '@mui/icons-material';
import { useAuth } from '@hooks/useAuth';
import { useRealTimeUpdates } from '@hooks/useRealTimeUpdates';
import { useNotifications } from '@hooks/useNotifications';
import { tasksService, Task, TaskStatus } from '@services/tasks.service';
import { teamsService, Team } from '@services/teams.service';

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  overdueTasks: number;
  totalTeams: number;
  activeTeams: number;
  myTasks: number;
  myCompletedTasks: number;
}

interface RecentTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: string;
  assignedToName: string;
  dueDate: string;
  teamName: string;
}

export const Dashboard: React.FC = () => {
  const { user, isAdmin, isSupervisor, canViewAllTasks, getUserDisplayName } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    activeTasks: 0,
    overdueTasks: 0,
    totalTeams: 0,
    activeTeams: 0,
    myTasks: 0,
    myCompletedTasks: 0,
  });
  
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [recentTeams, setRecentTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Real-time updates
  const {
    taskUpdates,
    locationUpdates,
    userStatuses,
    isConnected,
    getOnlineUsers,
    getLatestTaskUpdate,
  } = useRealTimeUpdates();
  
  // Notifications
  const { unreadCount, markAllAsRead } = useNotifications();
  
  const [showConnectionStatus, setShowConnectionStatus] = useState(false);

  const loadDashboardData = async () => {
    try {
      setError(null);
      
      // Load tasks data
      const tasksResponse = await tasksService.getTasks({ 
        limit: 50,
        include: ['assignedTo', 'team'] 
      });
      
      // Load teams data if user can view all teams
      let teams: Team[] = [];
      if (canViewAllTasks()) {
        teams = await teamsService.getTeams({ status: 'ACTIVE' });
      } else {
        teams = await teamsService.getMyTeams();
      }

      // Calculate statistics
      const now = new Date();
      const myUserId = user?.id;
      
      const totalTasks = tasksResponse.tasks.length;
      const completedTasks = tasksResponse.tasks.filter(task => task.status === 'COMPLETED').length;
      const activeTasks = tasksResponse.tasks.filter(task => 
        ['PENDING', 'IN_PROGRESS', 'REVIEW'].includes(task.status)
      ).length;
      const overdueTasks = tasksResponse.tasks.filter(task => 
        task.dueDate && new Date(task.dueDate) < now && task.status !== 'COMPLETED'
      ).length;
      
      const myTasks = tasksResponse.tasks.filter(task => task.assignedToId === myUserId).length;
      const myCompletedTasks = tasksResponse.tasks.filter(task => 
        task.assignedToId === myUserId && task.status === 'COMPLETED'
      ).length;

      setStats({
        totalTasks,
        completedTasks,
        activeTasks,
        overdueTasks,
        totalTeams: teams.length,
        activeTeams: teams.filter(team => team.status === 'ACTIVE').length,
        myTasks,
        myCompletedTasks,
      });

      // Set recent tasks
      const recent = tasksResponse.tasks
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 10)
        .map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          assignedToName: task.assignedTo?.name || 'Unassigned',
          dueDate: task.dueDate || '',
          teamName: task.team?.name || 'No Team',
        }));
      
      setRecentTasks(recent);

      // Set recent teams
      setRecentTeams(teams.slice(0, 5));
      
    } catch (err: any) {
      console.error('Dashboard loading error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle real-time task updates
  useEffect(() => {
    if (taskUpdates.length > 0) {
      // Reload data when tasks are updated to get fresh statistics
      loadDashboardData();
    }
  }, [taskUpdates]);

  // Show connection status when it changes
  useEffect(() => {
    setShowConnectionStatus(true);
    const timer = setTimeout(() => setShowConnectionStatus(false), 3000);
    return () => clearTimeout(timer);
  }, [isConnected]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      case 'REVIEW':
        return 'warning';
      case 'PENDING':
        return 'default';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return '#f44336';
      case 'MEDIUM':
        return '#ff9800';
      case 'LOW':
        return '#4caf50';
      default:
        return '#9e9e9e';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
        }}
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mb: 3 }}>
        <Alert severity="error" action={
          <IconButton color="inherit" size="small" onClick={handleRefresh}>
            <Refresh />
          </IconButton>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome back, {getUserDisplayName()}!
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Here's what's happening with your surveying projects today.
            </Typography>
            
            {/* Connection Status */}
            <Tooltip title={isConnected ? 'Real-time updates active' : 'Offline - no real-time updates'}>
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                {isConnected ? (
                  <Wifi color="success" fontSize="small" />
                ) : (
                  <WifiOff color="error" fontSize="small" />
                )}
              </Box>
            </Tooltip>
            
            {/* Online Users Count */}
            {isConnected && (
              <Chip
                size="small"
                icon={<Person />}
                label={`${getOnlineUsers().length} online`}
                color="success"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notification Badge */}
          {unreadCount > 0 && (
            <Tooltip title={`${unreadCount} unread notifications`}>
              <IconButton onClick={markAllAsRead}>
                <Badge badgeContent={unreadCount} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title="Refresh Dashboard">
            <IconButton 
              onClick={handleRefresh} 
              disabled={refreshing}
              size="large"
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assignment sx={{ color: 'primary.main', mr: 1 }} />
                <Typography color="text.secondary" gutterBottom variant="h6">
                  Total Tasks
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {stats.totalTasks}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
                <Typography color="text.secondary" gutterBottom variant="h6">
                  Completed
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {stats.completedTasks}
              </Typography>
              <Typography variant="body2" color="success.main">
                {stats.totalTasks > 0 
                  ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}% complete`
                  : 'No tasks yet'
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule sx={{ color: 'info.main', mr: 1 }} />
                <Typography color="text.secondary" gutterBottom variant="h6">
                  Active Tasks
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {stats.activeTasks}
              </Typography>
              <Typography variant="body2" color="info.main">
                In progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ color: 'error.main', mr: 1 }} />
                <Typography color="text.secondary" gutterBottom variant="h6">
                  Overdue
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {stats.overdueTasks}
              </Typography>
              <Typography variant="body2" color="error.main">
                Need attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* My Stats (if not admin/supervisor) */}
      {!canViewAllTasks() && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Person sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography color="text.secondary" gutterBottom variant="h6">
                    My Tasks
                  </Typography>
                </Box>
                <Typography variant="h4" component="div">
                  {stats.myTasks}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.myTasks > 0 ? (stats.myCompletedTasks / stats.myTasks) * 100 : 0}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
                  <Typography color="text.secondary" gutterBottom variant="h6">
                    My Progress
                  </Typography>
                </Box>
                <Typography variant="h4" component="div">
                  {stats.myTasks > 0 
                    ? `${Math.round((stats.myCompletedTasks / stats.myTasks) * 100)}%`
                    : '0%'
                  }
                </Typography>
                <Typography variant="body2" color="success.main">
                  {stats.myCompletedTasks} of {stats.myTasks} completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* Recent Tasks */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Tasks
            </Typography>
            {recentTasks.length > 0 ? (
              <List>
                {recentTasks.map((task, index) => (
                  <ListItem
                    key={task.id}
                    divider={index < recentTasks.length - 1}
                    sx={{ px: 0 }}
                  >
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          width: 8,
                          height: 8,
                          bgcolor: getPriorityColor(task.priority),
                        }}
                      >
                        {''}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" noWrap sx={{ flex: 1 }}>
                            {task.title}
                          </Typography>
                          <Chip
                            size="small"
                            label={task.status.replace('_', ' ')}
                            color={getStatusColor(task.status) as any}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {task.assignedToName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {task.teamName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Due: {formatDate(task.dueDate)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                No tasks found
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Teams Overview */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Teams Overview
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" color="primary">
                  {stats.totalTeams}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Teams
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" color="success.main">
                  {stats.activeTeams}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active
                </Typography>
              </Box>
            </Box>
            
            {recentTeams.length > 0 ? (
              <List dense>
                {recentTeams.map((team) => (
                  <ListItem key={team.id} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Group fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={team.name}
                      secondary={`${team.memberCount} members, ${team.activeTasksCount} active tasks`}
                    />
                    <Chip
                      size="small"
                      label={team.status}
                      color={team.status === 'ACTIVE' ? 'success' : 'default'}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                No teams found
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Connection Status Snackbar */}
      <Snackbar
        open={showConnectionStatus}
        autoHideDuration={3000}
        onClose={() => setShowConnectionStatus(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={isConnected ? 'success' : 'warning'} 
          onClose={() => setShowConnectionStatus(false)}
          sx={{ width: '100%' }}
        >
          {isConnected ? 'Real-time updates connected' : 'Real-time updates disconnected'}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;