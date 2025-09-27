import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Alert,
  Chip,
  CircularProgress,
  IconButton,
  Grid
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';

const API_BASE = 'http://localhost:3000';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo?: string;
  dueDate?: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  leader: string;
  memberCount: number;
}

export default function MobileInterface() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({
    email: 'admin@geodesy.com',
    password: 'password123'
  });

  const login = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/test-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      if (data.success) {
        setIsAuthenticated(true);
        await loadData();
      } else {
        setError('Login failed');
      }
    } catch (err: any) {
      setError('Network error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tasksRes, teamsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/tasks`),
        fetch(`${API_BASE}/api/v1/teams`)
      ]);

      const tasksData = await tasksRes.json();
      const teamsData = await teamsRes.json();

      if (tasksData.success) setTasks(tasksData.data.tasks);
      if (teamsData.success) setTeams(teamsData.data.teams);
    } catch (err: any) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();
      if (result.success) {
        await loadData();
      } else {
        setError('Failed to update task status');
      }
    } catch (err: any) {
      setError('Network error: ' + err.message);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setTasks([]);
    setTeams([]);
    setError(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'warning';
      case 'PENDING': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, px: 2 }}>
        <Card>
          <CardContent>
            <Box textAlign="center" mb={3}>
              <PhoneAndroidIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                📱 Geodesy Mobile
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Mobile Interface for Field Workers
              </Typography>
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
                onClick={login}
                disabled={isLoading}
                sx={{ mt: 3, mb: 2 }}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Login'}
              </Button>
            </Box>

            <Alert severity="info">
              <Typography variant="body2">
                <strong>Test Account:</strong><br/>
                admin@geodesy.com / password123
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 2, px: 2 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          📱 Mobile Dashboard
        </Typography>
        <Box>
          <IconButton onClick={loadData} disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
          <Button variant="outlined" color="error" onClick={logout} size="small">
            Logout
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {tasks.length}
              </Typography>
              <Typography variant="body2">Tasks</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="secondary">
                {teams.length}
              </Typography>
              <Typography variant="body2">Teams</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main">
                {tasks.filter(t => t.status === 'COMPLETED').length}
              </Typography>
              <Typography variant="body2">Done</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tasks */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            📋 My Tasks ({tasks.length})
          </Typography>
          {tasks.map((task) => (
            <Box key={task.id} sx={{ 
              p: 2, 
              border: '1px solid #eee', 
              borderRadius: 1, 
              mb: 2,
              backgroundColor: '#fafafa'
            }}>
              <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ flex: 1 }}>
                  {task.title}
                </Typography>
                <Chip 
                  label={task.status} 
                  color={getStatusColor(task.status) as any}
                  size="small"
                  onClick={() => {
                    const nextStatus = task.status === 'PENDING' ? 'IN_PROGRESS' : 
                                     task.status === 'IN_PROGRESS' ? 'COMPLETED' : 'PENDING';
                    updateTaskStatus(task.id, nextStatus);
                  }}
                  sx={{ cursor: 'pointer', ml: 1 }}
                />
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                {task.description}
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Chip 
                  label={task.priority} 
                  color={getPriorityColor(task.priority) as any}
                  size="small" 
                  variant="outlined"
                />
                {task.assignedTo && (
                  <Typography variant="caption" color="textSecondary">
                    👤 {task.assignedTo}
                  </Typography>
                )}
              </Box>
              {task.dueDate && (
                <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                  📅 Due: {new Date(task.dueDate).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          ))}
          {tasks.length === 0 && (
            <Typography variant="body2" color="textSecondary" textAlign="center" sx={{ py: 3 }}>
              No tasks assigned
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Teams */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            👥 Teams ({teams.length})
          </Typography>
          {teams.map((team) => (
            <Box key={team.id} sx={{ 
              p: 2, 
              border: '1px solid #eee', 
              borderRadius: 1, 
              mb: 2,
              backgroundColor: '#fafafa'
            }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                {team.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                {team.description}
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="textSecondary">
                  👨‍💼 {team.leader}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  👥 {team.memberCount} members
                </Typography>
              </Box>
            </Box>
          ))}
          {teams.length === 0 && (
            <Typography variant="body2" color="textSecondary" textAlign="center" sx={{ py: 3 }}>
              No teams available
            </Typography>
          )}
        </CardContent>
      </Card>

      <Box textAlign="center" sx={{ mt: 3, py: 2 }}>
        <Alert severity="success">
          📱 Mobile Interface Active<br/>
          Connected to: {API_BASE}
        </Alert>
      </Box>
    </Container>
  );
}