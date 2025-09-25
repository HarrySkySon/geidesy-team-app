import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Alert,
  CircularProgress,
  Avatar,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Assignment as AssignmentIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useAuth } from '@hooks/useAuth';
import { tasksService, Task, TaskStatus, TaskPriority, TaskFilters } from '@services/tasks.service';
import { teamsService, Team } from '@services/teams.service';

interface TaskListProps {
  showCreateDialog?: boolean;
  onCreateDialogClose?: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  showCreateDialog = false,
  onCreateDialogClose,
}) => {
  const { canCreateTasks, canDeleteTasks, canManageTasks, user } = useAuth();
  
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalTasks, setTotalTasks] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState<TaskFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(showCreateDialog);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null);

  // Load tasks
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filterParams: TaskFilters = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        teamId: teamFilter || undefined,
        ...filters,
      };
      
      const response = await tasksService.getTasks(filterParams);
      setTasks(response.tasks);
      setTotalTasks(response.total);
      
    } catch (err: any) {
      console.error('Error loading tasks:', err);
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchQuery, statusFilter, priorityFilter, teamFilter, filters]);

  // Load teams for filters
  const loadTeams = useCallback(async () => {
    try {
      const teamsData = await teamsService.getTeams();
      setTeams(teamsData);
    } catch (err) {
      console.error('Error loading teams:', err);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    if (showCreateDialog !== createDialogOpen) {
      setCreateDialogOpen(showCreateDialog);
    }
  }, [showCreateDialog]);

  // Handlers
  const handleSearch = () => {
    setPage(0);
    loadTasks();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPriorityFilter('');
    setTeamFilter('');
    setFilters({});
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, taskId: string) => {
    setAnchorEl(event.currentTarget);
    setMenuTaskId(taskId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTaskId(null);
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setViewDialogOpen(true);
    handleMenuClose();
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteTask = (task: Task) => {
    setSelectedTask(task);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleTaskStatusUpdate = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await tasksService.updateTaskStatus(taskId, newStatus);
      loadTasks();
    } catch (err: any) {
      setError(err.message || 'Failed to update task status');
    }
  };

  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
    if (onCreateDialogClose) {
      onCreateDialogClose();
    }
    loadTasks();
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedTask(null);
    loadTasks();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTask) return;
    
    try {
      await tasksService.deleteTask(selectedTask.id);
      setDeleteDialogOpen(false);
      setSelectedTask(null);
      loadTasks();
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
    }
  };

  // Utility functions
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

  const getPriorityColor = (priority: TaskPriority) => {
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
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon color="success" />;
      case 'IN_PROGRESS':
        return <ScheduleIcon color="info" />;
      case 'PENDING':
        return <ScheduleIcon color="disabled" />;
      case 'REVIEW':
        return <WarningIcon color="warning" />;
      case 'CANCELLED':
        return <WarningIcon color="error" />;
      default:
        return <ScheduleIcon />;
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Tasks Management
        </Typography>
        
        {canCreateTasks() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Task
          </Button>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as TaskStatus)}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="REVIEW">Review</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as TaskPriority)}
                  label="Priority"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="LOW">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Team</InputLabel>
                <Select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  label="Team"
                >
                  <MenuItem value="">All Teams</MenuItem>
                  {teams.map((team) => (
                    <MenuItem key={team.id} value={team.id}>
                      {team.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  startIcon={<SearchIcon />}
                >
                  Search
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleResetFilters}
                >
                  Reset
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Task</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No tasks found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" noWrap>
                        {task.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {task.description?.substring(0, 50)}
                        {task.description && task.description.length > 50 ? '...' : ''}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(task.status)}
                      <Chip
                        size="small"
                        label={task.status.replace('_', ' ')}
                        color={getStatusColor(task.status) as any}
                      />
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: getPriorityColor(task.priority),
                        }}
                      />
                      <Typography variant="body2">
                        {task.priority}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {task.assignedTo?.name?.charAt(0) || 'U'}
                      </Avatar>
                      <Typography variant="body2" noWrap>
                        {task.assignedTo?.name || 'Unassigned'}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {task.team?.name || 'No Team'}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    {task.latitude && task.longitude ? (
                      <Tooltip title={`${task.latitude}, ${task.longitude}`}>
                        <LocationIcon color="primary" fontSize="small" />
                      </Tooltip>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        No location
                      </Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, task.id)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        <TablePagination
          component="div"
          count={totalTasks}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const task = tasks.find(t => t.id === menuTaskId);
          if (task) handleViewTask(task);
        }}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        
        {canManageTasks() && (
          <MenuItem onClick={() => {
            const task = tasks.find(t => t.id === menuTaskId);
            if (task) handleEditTask(task);
          }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Task</ListItemText>
          </MenuItem>
        )}
        
        {canDeleteTasks() && (
          <MenuItem onClick={() => {
            const task = tasks.find(t => t.id === menuTaskId);
            if (task) handleDeleteTask(task);
          }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete Task</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* View Task Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Task Details</DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    {selectedTask.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedTask.description}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Status:</Typography>
                  <Chip
                    label={selectedTask.status.replace('_', ' ')}
                    color={getStatusColor(selectedTask.status) as any}
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Priority:</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: getPriorityColor(selectedTask.priority),
                      }}
                    />
                    <Typography variant="body2">{selectedTask.priority}</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Assigned To:</Typography>
                  <Typography variant="body2">
                    {selectedTask.assignedTo?.name || 'Unassigned'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Team:</Typography>
                  <Typography variant="body2">
                    {selectedTask.team?.name || 'No Team'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Due Date:</Typography>
                  <Typography variant="body2">
                    {selectedTask.dueDate ? formatDate(selectedTask.dueDate) : 'No due date'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Location:</Typography>
                  <Typography variant="body2">
                    {selectedTask.latitude && selectedTask.longitude
                      ? `${selectedTask.latitude}, ${selectedTask.longitude}`
                      : 'No location'
                    }
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the task "{selectedTask?.title}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskList;