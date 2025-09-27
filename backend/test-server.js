const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

console.log('🚀 Starting Geodesy Team Management Test Server...');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory data storage
let tasks = [
  {
    id: 'task-1',
    title: 'Topographic Survey - Site A',
    description: 'Complete topographic survey of construction site A with total station',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assignedTo: 'Alex Thompson',
    teamId: 'team-1',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'task-2',
    title: 'GPS Control Point Verification',
    description: 'Verify and update GPS control points for geodetic network',
    status: 'PENDING',
    priority: 'MEDIUM',
    assignedTo: 'Maria Rodriguez',
    teamId: 'team-2',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'task-3',
    title: 'Building Layout Stakeout',
    description: 'Layout building corners and elevation marks for new residential complex',
    status: 'COMPLETED',
    priority: 'HIGH',
    assignedTo: 'Alex Thompson',
    teamId: 'team-1',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

let teams = [
  {
    id: 'team-1',
    name: 'Test Survey Team',
    description: 'This is a test team',
    status: 'ACTIVE',
    leader: 'Alex Thompson',
    memberCount: 3,
    members: [
      { id: 'member-1', name: 'Alex Thompson', role: 'Team Leader', email: 'alex@geodesy.com' },
      { id: 'member-2', name: 'John Smith', role: 'Surveyor', email: 'john@geodesy.com' },
      { id: 'member-3', name: 'Sarah Wilson', role: 'CAD Technician', email: 'sarah@geodesy.com' }
    ]
  },
  {
    id: 'team-2',
    name: 'Geodetic Control Network Team',
    description: 'Responsible for maintaining control points',
    status: 'ACTIVE',
    leader: 'Maria Rodriguez',
    memberCount: 5,
    members: [
      { id: 'member-4', name: 'Maria Rodriguez', role: 'Team Leader', email: 'maria@geodesy.com' },
      { id: 'member-5', name: 'David Chen', role: 'GPS Specialist', email: 'david@geodesy.com' },
      { id: 'member-6', name: 'Emma Johnson', role: 'Field Surveyor', email: 'emma@geodesy.com' },
      { id: 'member-7', name: 'Michael Brown', role: 'Data Analyst', email: 'michael@geodesy.com' },
      { id: 'member-8', name: 'Lisa Davis', role: 'Equipment Manager', email: 'lisa@geodesy.com' }
    ]
  }
];

let nextTaskId = 4;
let nextTeamId = 3;

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:19006'],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Geodesy Team Management API is running!'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Surveying Team Management API',
    version: '1.0.0',
    description: 'REST API for managing surveying teams and tasks',
    status: 'Test Mode - TypeScript compilation issues',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      tasks: '/api/v1/tasks',
      teams: '/api/v1/teams',
      users: '/api/v1/users',
      sites: '/api/v1/sites',
      upload: '/api/v1/upload'
    },
    note: 'This is a test server. The full TypeScript backend needs compilation fixes.'
  });
});

// Test authentication endpoint
app.post('/api/v1/auth/test-login', (req, res) => {
  console.log('Test login request received:', req.body);
  
  res.json({
    success: true,
    message: 'Test login successful',
    data: {
      user: {
        id: 'test-user-1',
        email: 'admin@geodesy.com',
        name: 'Test Admin',
        role: 'ADMIN'
      },
      tokens: {
        accessToken: 'test-access-token-12345',
        refreshToken: 'test-refresh-token-67890'
      }
    }
  });
});

// Tasks CRUD endpoints
app.get('/api/v1/tasks', (req, res) => {
  res.json({
    success: true,
    data: {
      tasks: tasks,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: tasks.length
      }
    }
  });
});

app.post('/api/v1/tasks', (req, res) => {
  console.log('Creating new task:', req.body);
  
  const newTask = {
    id: `task-${nextTaskId++}`,
    title: req.body.title,
    description: req.body.description,
    status: req.body.status || 'PENDING',
    priority: req.body.priority || 'MEDIUM',
    assignedTo: req.body.assignedTo,
    teamId: req.body.teamId,
    createdAt: new Date().toISOString(),
    dueDate: req.body.dueDate
  };
  
  tasks.push(newTask);
  
  res.json({
    success: true,
    message: 'Task created successfully',
    data: { task: newTask }
  });
});

app.put('/api/v1/tasks/:id', (req, res) => {
  console.log('Updating task:', req.params.id, req.body);
  
  const taskIndex = tasks.findIndex(task => task.id === req.params.id);
  if (taskIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }
  
  const updatedTask = {
    ...tasks[taskIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  // If status is being changed to COMPLETED, add completedAt
  if (req.body.status === 'COMPLETED' && tasks[taskIndex].status !== 'COMPLETED') {
    updatedTask.completedAt = new Date().toISOString();
  }
  
  tasks[taskIndex] = updatedTask;
  
  res.json({
    success: true,
    message: 'Task updated successfully',
    data: { task: updatedTask }
  });
});

app.delete('/api/v1/tasks/:id', (req, res) => {
  console.log('Deleting task:', req.params.id);
  
  const taskIndex = tasks.findIndex(task => task.id === req.params.id);
  if (taskIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }
  
  const deletedTask = tasks.splice(taskIndex, 1)[0];
  
  res.json({
    success: true,
    message: 'Task deleted successfully',
    data: { task: deletedTask }
  });
});

// Teams CRUD endpoints
app.get('/api/v1/teams', (req, res) => {
  res.json({
    success: true,
    data: {
      teams: teams
    }
  });
});

app.post('/api/v1/teams', (req, res) => {
  console.log('Creating new team:', req.body);
  
  const newTeam = {
    id: `team-${nextTeamId++}`,
    name: req.body.name,
    description: req.body.description,
    status: req.body.status || 'ACTIVE',
    leader: req.body.leader,
    memberCount: req.body.members ? req.body.members.length : 0,
    members: req.body.members || [],
    createdAt: new Date().toISOString()
  };
  
  teams.push(newTeam);
  
  res.json({
    success: true,
    message: 'Team created successfully',
    data: { team: newTeam }
  });
});

app.put('/api/v1/teams/:id', (req, res) => {
  console.log('Updating team:', req.params.id, req.body);
  
  const teamIndex = teams.findIndex(team => team.id === req.params.id);
  if (teamIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Team not found'
    });
  }
  
  const updatedTeam = {
    ...teams[teamIndex],
    ...req.body,
    memberCount: req.body.members ? req.body.members.length : teams[teamIndex].memberCount,
    updatedAt: new Date().toISOString()
  };
  
  teams[teamIndex] = updatedTeam;
  
  res.json({
    success: true,
    message: 'Team updated successfully',
    data: { team: updatedTeam }
  });
});

app.delete('/api/v1/teams/:id', (req, res) => {
  console.log('Deleting team:', req.params.id);
  
  const teamIndex = teams.findIndex(team => team.id === req.params.id);
  if (teamIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Team not found'
    });
  }
  
  const deletedTeam = teams.splice(teamIndex, 1)[0];
  
  res.json({
    success: true,
    message: 'Team deleted successfully',
    data: { team: deletedTeam }
  });
});

// Get team members
app.get('/api/v1/teams/:id/members', (req, res) => {
  const team = teams.find(team => team.id === req.params.id);
  if (!team) {
    return res.status(404).json({
      success: false,
      message: 'Team not found'
    });
  }
  
  res.json({
    success: true,
    data: { members: team.members || [] }
  });
});

// Catch all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    note: 'This is a test server with limited endpoints'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎉 Test server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API info: http://localhost:${PORT}/api`);
  console.log(`🔐 Test login: POST http://localhost:${PORT}/api/v1/auth/test-login`);
  console.log(`📋 Test tasks: GET http://localhost:${PORT}/api/v1/tasks`);
  console.log(`👥 Test teams: GET http://localhost:${PORT}/api/v1/teams`);
  console.log('');
  console.log('⚠️  Note: This is a test server. TypeScript backend needs fixes.');
  console.log('✅ Backend structure and configuration are ready');
  console.log('🔧 Next step: Fix TypeScript compilation issues');
});

module.exports = app;