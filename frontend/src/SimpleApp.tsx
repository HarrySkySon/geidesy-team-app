import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import MobileInterface from './MobileInterface';

const SimpleApp: React.FC = () => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [credentials, setCredentials] = useState({
    email: 'admin@geodesy.com',
    password: 'password123'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Check URL for mobile mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'mobile') {
      setViewMode('mobile');
    }
  }, []);
  
  // Task management states
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'PENDING',
    priority: 'MEDIUM',
    assignedTo: '',
    teamId: '',
    dueDate: ''
  });
  
  // Team management states
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
    leader: ''
  });

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/test-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        setUserInfo(data.data.user);
        // Load dashboard data after successful login
        await loadDashboardData();
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err: any) {
      setError('Network error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const [tasksResponse, teamsResponse, healthResponse] = await Promise.all([
        fetch('http://localhost:3000/api/v1/tasks'),
        fetch('http://localhost:3000/api/v1/teams'),
        fetch('http://localhost:3000/health')
      ]);

      const tasksData = await tasksResponse.json();
      const teamsData = await teamsResponse.json();
      const healthData = await healthResponse.json();

      setDashboardData({
        tasks: tasksData.data?.tasks || [],
        teams: teamsData.data?.teams || [],
        health: healthData
      });
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserInfo(null);
    setDashboardData(null);
    setError(null);
  };

  // Task management functions
  const openTaskDialog = (task = null) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo,
        teamId: task.teamId,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
      });
    } else {
      setEditingTask(null);
      setTaskForm({
        title: '',
        description: '',
        status: 'PENDING',
        priority: 'MEDIUM',
        assignedTo: '',
        teamId: '',
        dueDate: ''
      });
    }
    setTaskDialogOpen(true);
  };

  const closeTaskDialog = () => {
    setTaskDialogOpen(false);
    setEditingTask(null);
  };

  const saveTask = async () => {
    setIsLoading(true);
    try {
      const taskData = {
        ...taskForm,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : null
      };

      const url = editingTask 
        ? `http://localhost:3000/api/v1/tasks/${editingTask.id}`
        : 'http://localhost:3000/api/v1/tasks';
      
      const method = editingTask ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      const result = await response.json();
      if (result.success) {
        closeTaskDialog();
        await loadDashboardData();
      } else {
        setError(result.message || 'Failed to save task');
      }
    } catch (err: any) {
      setError('Error saving task: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/v1/tasks/${taskId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        await loadDashboardData();
      } else {
        setError(result.message || 'Failed to delete task');
      }
    } catch (err: any) {
      setError('Error deleting task: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();
      if (result.success) {
        await loadDashboardData();
      } else {
        setError(result.message || 'Failed to update task status');
      }
    } catch (err: any) {
      setError('Error updating task: ' + err.message);
    }
  };

  // Show mobile interface if mobile mode is selected
  if (viewMode === 'mobile') {
    return <MobileInterface />;
  }

  if (isAuthenticated && userInfo) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h4" gutterBottom>
                📊 Geodesy Dashboard
              </Typography>
              <Box display="flex" gap={1}>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />} 
                  onClick={() => openTaskDialog()} 
                  sx={{ mr: 1 }}
                >
                  New Task
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<AddIcon />} 
                  onClick={() => setTeamDialogOpen(true)} 
                  sx={{ mr: 1 }}
                >
                  New Team
                </Button>
                <Button variant="outlined" onClick={loadDashboardData} disabled={isLoading}>
                  🔄 Refresh Data
                </Button>
                <Button variant="outlined" color="error" onClick={handleLogout}>
                  Logout
                </Button>
              </Box>
            </Box>

            <Box mb={3}>
              <Typography variant="h6" color="primary">
                Welcome, {userInfo.name}!
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Role: {userInfo.role} | Email: {userInfo.email}
              </Typography>
            </Box>

            <Box display="flex" gap={2} mb={3}>
              <Card sx={{ p: 2, flexGrow: 1 }}>
                <Typography variant="h6">📋 Tasks</Typography>
                <Typography variant="h4" color="primary">
                  {dashboardData?.tasks?.length || 0}
                </Typography>
                <Typography variant="body2">Active tasks</Typography>
              </Card>
              
              <Card sx={{ p: 2, flexGrow: 1 }}>
                <Typography variant="h6">👥 Teams</Typography>
                <Typography variant="h4" color="secondary">
                  {dashboardData?.teams?.length || 0}
                </Typography>
                <Typography variant="body2">Working teams</Typography>
              </Card>
              
              <Card sx={{ p: 2, flexGrow: 1 }}>
                <Typography variant="h6">🏥 Health</Typography>
                <Typography variant="h4" color="success.main">
                  {dashboardData?.health?.status === 'healthy' ? 'OK' : 'ERROR'}
                </Typography>
                <Typography variant="body2">System status</Typography>
              </Card>
            </Box>

            {/* Tasks List */}
            {dashboardData?.tasks && dashboardData.tasks.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">📋 Tasks Management</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {dashboardData.tasks.length} tasks total
                    </Typography>
                  </Box>
                  {dashboardData.tasks.map((task: any) => (
                    <Box key={task.id} sx={{ p: 2, border: '1px solid #eee', borderRadius: 1, mb: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="start">
                        <Box flex={1}>
                          <Typography variant="subtitle1" fontWeight="bold">{task.title}</Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            {task.description}
                          </Typography>
                          <Box display="flex" gap={1} mb={1}>
                            <Chip 
                              label={task.status} 
                              color={task.status === 'COMPLETED' ? 'success' : task.status === 'IN_PROGRESS' ? 'warning' : 'default'}
                              size="small"
                              onClick={() => {
                                const nextStatus = task.status === 'PENDING' ? 'IN_PROGRESS' : 
                                                 task.status === 'IN_PROGRESS' ? 'COMPLETED' : 'PENDING';
                                updateTaskStatus(task.id, nextStatus);
                              }}
                              sx={{ cursor: 'pointer' }}
                            />
                            <Chip label={task.priority} size="small" variant="outlined" />
                          </Box>
                          <Typography variant="caption" display="block">
                            Assigned to: <strong>{task.assignedTo}</strong>
                            {task.dueDate && ` | Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                          </Typography>
                        </Box>
                        <Box display="flex" gap={1}>
                          <IconButton size="small" onClick={() => openTaskDialog(task)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => deleteTask(task.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Teams List */}
            {dashboardData?.teams && dashboardData.teams.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>👥 Active Teams</Typography>
                  {dashboardData.teams.map((team: any, index: number) => (
                    <Box key={team.id || index} sx={{ p: 2, border: '1px solid #eee', borderRadius: 1, mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">{team.name}</Typography>
                      <Typography variant="body2" color="textSecondary">Leader: {team.leader}</Typography>
                      <Typography variant="caption">
                        Status: <strong>{team.status}</strong> | Members: <strong>{team.memberCount || 0}</strong>
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            )}

            <Alert severity="success">
              🎉 Geodesy Team Management System is running successfully!<br/>
              Backend API: http://localhost:3000 ✅<br/>
              Frontend: http://localhost:3003 ✅<br/>
              Data loaded: {dashboardData ? 'Real data from API' : 'Loading...'}
            </Alert>

            {/* Task Dialog */}
            <Dialog open={taskDialogOpen} onClose={closeTaskDialog} maxWidth="md" fullWidth>
              <DialogTitle>
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </DialogTitle>
              <DialogContent>
                <Box display="flex" flexDirection="column" gap={2} mt={1}>
                  <TextField
                    label="Task Title"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Description"
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    fullWidth
                    multiline
                    rows={3}
                  />
                  <Box display="flex" gap={2}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={taskForm.status}
                        label="Status"
                        onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                      >
                        <MenuItem value="PENDING">Pending</MenuItem>
                        <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                        <MenuItem value="COMPLETED">Completed</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={taskForm.priority}
                        label="Priority"
                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                      >
                        <MenuItem value="LOW">Low</MenuItem>
                        <MenuItem value="MEDIUM">Medium</MenuItem>
                        <MenuItem value="HIGH">High</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box display="flex" gap={2}>
                    <TextField
                      label="Assigned To"
                      value={taskForm.assignedTo}
                      onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                      fullWidth
                    />
                    <FormControl fullWidth>
                      <InputLabel>Team</InputLabel>
                      <Select
                        value={taskForm.teamId}
                        label="Team"
                        onChange={(e) => setTaskForm({ ...taskForm, teamId: e.target.value })}
                      >
                        {dashboardData?.teams?.map((team: any) => (
                          <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <TextField
                    label="Due Date"
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={closeTaskDialog}>Cancel</Button>
                <Button 
                  onClick={saveTask} 
                  variant="contained" 
                  disabled={!taskForm.title || isLoading}
                >
                  {isLoading ? <CircularProgress size={20} /> : (editingTask ? 'Update' : 'Create')}
                </Button>
              </DialogActions>
            </Dialog>

            {/* Team Dialog */}
            <Dialog open={teamDialogOpen} onClose={() => setTeamDialogOpen(false)} maxWidth="sm" fullWidth>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogContent>
                <Box display="flex" flexDirection="column" gap={2} mt={1}>
                  <TextField
                    label="Team Name"
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Description"
                    value={teamForm.description}
                    onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                  />
                  <TextField
                    label="Team Leader"
                    value={teamForm.leader}
                    onChange={(e) => setTeamForm({ ...teamForm, leader: e.target.value })}
                    fullWidth
                  />
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setTeamDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={async () => {
                    try {
                      const response = await fetch('http://localhost:3000/api/v1/teams', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(teamForm),
                      });
                      const result = await response.json();
                      if (result.success) {
                        setTeamDialogOpen(false);
                        setTeamForm({ name: '', description: '', leader: '' });
                        await loadDashboardData();
                      }
                    } catch (err) {
                      console.error('Error creating team:', err);
                    }
                  }}
                  variant="contained" 
                  disabled={!teamForm.name}
                >
                  Create Team
                </Button>
              </DialogActions>
            </Dialog>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card>
        <CardContent>
          <Box textAlign="center" mb={3}>
            <Typography variant="h4" gutterBottom>
              🌍 Geodesy Team Manager
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Surveying Team Management System
            </Typography>
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={viewMode} 
              onChange={(e, newValue) => setViewMode(newValue)}
              centered
            >
              <Tab 
                icon={<DesktopWindowsIcon />} 
                label="Desktop" 
                value="desktop" 
              />
              <Tab 
                icon={<PhoneAndroidIcon />} 
                label="Mobile" 
                value="mobile" 
              />
            </Tabs>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" noValidate>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              margin="normal"
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              margin="normal"
              variant="outlined"
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleLogin}
              disabled={isLoading}
              sx={{ mt: 3, mb: 2 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Login'}
            </Button>
          </Box>

          <Box mt={3}>
            <Alert severity="info">
              <Typography variant="body2" component="div">
                <strong>Test Accounts:</strong><br/>
                • Admin: admin@geodesy.com / password123<br/>
                • Supervisor: supervisor@geodesy.com / password123<br/>
                • Member: member1@geodesy.com / password123
              </Typography>
            </Alert>
          </Box>

          <Box mt={2}>
            <Alert severity="warning">
              <Typography variant="body2">
                Backend API: <a href="http://localhost:3000/health" target="_blank" rel="noopener noreferrer">
                  http://localhost:3000/health
                </a>
              </Typography>
            </Alert>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default SimpleApp;