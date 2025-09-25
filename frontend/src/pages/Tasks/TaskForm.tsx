import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  Alert,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { tasksService, CreateTaskRequest, UpdateTaskRequest, TaskStatus, TaskPriority } from '@services/tasks.service';
import { teamsService, Team } from '@services/teams.service';
import { authService } from '@services/auth.service';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  task?: any;
  isEdit?: boolean;
}

const validationSchema = yup.object({
  title: yup
    .string()
    .required('Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: yup
    .string()
    .max(500, 'Description must be less than 500 characters'),
  priority: yup
    .string()
    .oneOf(['LOW', 'MEDIUM', 'HIGH'], 'Invalid priority')
    .required('Priority is required'),
  status: yup
    .string()
    .oneOf(['PENDING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED'], 'Invalid status')
    .required('Status is required'),
  dueDate: yup
    .date()
    .nullable()
    .min(new Date(), 'Due date must be in the future'),
  teamId: yup
    .string()
    .nullable(),
  assignedToId: yup
    .string()
    .nullable(),
  latitude: yup
    .number()
    .nullable()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: yup
    .number()
    .nullable()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  address: yup
    .string()
    .max(200, 'Address must be less than 200 characters'),
});

export const TaskForm: React.FC<TaskFormProps> = ({
  open,
  onClose,
  task,
  isEdit = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const formik = useFormik({
    initialValues: {
      title: task?.title || '',
      description: task?.description || '',
      priority: (task?.priority as TaskPriority) || 'MEDIUM',
      status: (task?.status as TaskStatus) || 'PENDING',
      dueDate: task?.dueDate ? new Date(task.dueDate) : null,
      teamId: task?.teamId || '',
      assignedToId: task?.assignedToId || '',
      latitude: task?.latitude || '',
      longitude: task?.longitude || '',
      address: task?.address || '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError(null);
      
      try {
        const taskData = {
          ...values,
          latitude: values.latitude ? Number(values.latitude) : null,
          longitude: values.longitude ? Number(values.longitude) : null,
          dueDate: values.dueDate ? values.dueDate.toISOString() : null,
          teamId: values.teamId || null,
          assignedToId: values.assignedToId || null,
        };

        if (isEdit && task) {
          await tasksService.updateTask(task.id, taskData as UpdateTaskRequest);
        } else {
          await tasksService.createTask(taskData as CreateTaskRequest);
        }

        handleClose();
      } catch (err: any) {
        console.error('Task form error:', err);
        setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} task`);
      } finally {
        setLoading(false);
      }
    },
  });

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [teamsData] = await Promise.all([
          teamsService.getTeams(),
        ]);
        setTeams(teamsData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load form data');
      } finally {
        setLoadingData(false);
      }
    };

    if (open) {
      loadData();
    }
  }, [open]);

  // Load team members when team is selected
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (formik.values.teamId) {
        try {
          const members = await teamsService.getTeamMembers(formik.values.teamId);
          const memberUsers = members.map(member => ({
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
            role: member.user.role,
          }));
          setTeamMembers(memberUsers);
        } catch (err) {
          console.error('Error loading team members:', err);
        }
      } else {
        setTeamMembers([]);
      }
    };

    loadTeamMembers();
  }, [formik.values.teamId]);

  const handleClose = () => {
    formik.resetForm();
    setError(null);
    setTeamMembers([]);
    onClose();
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          formik.setFieldValue('latitude', position.coords.latitude.toString());
          formik.setFieldValue('longitude', position.coords.longitude.toString());
        },
        (error) => {
          setError('Failed to get current location. Please check your browser permissions.');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEdit ? 'Edit Task' : 'Create New Task'}
        </DialogTitle>
        
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            {loadingData ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                
                <Grid container spacing={3}>
                  {/* Basic Information */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Basic Information
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="title"
                      name="title"
                      label="Task Title"
                      value={formik.values.title}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.title && Boolean(formik.errors.title)}
                      helperText={formik.touched.title && formik.errors.title}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      id="description"
                      name="description"
                      label="Description"
                      value={formik.values.description}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.description && Boolean(formik.errors.description)}
                      helperText={formik.touched.description && formik.errors.description}
                    />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        id="priority"
                        name="priority"
                        value={formik.values.priority}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.priority && Boolean(formik.errors.priority)}
                        label="Priority"
                      >
                        <MenuItem value="LOW">Low</MenuItem>
                        <MenuItem value="MEDIUM">Medium</MenuItem>
                        <MenuItem value="HIGH">High</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Status</InputLabel>
                      <Select
                        id="status"
                        name="status"
                        value={formik.values.status}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.status && Boolean(formik.errors.status)}
                        label="Status"
                      >
                        <MenuItem value="PENDING">Pending</MenuItem>
                        <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                        <MenuItem value="REVIEW">Review</MenuItem>
                        <MenuItem value="COMPLETED">Completed</MenuItem>
                        <MenuItem value="CANCELLED">Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <DatePicker
                      label="Due Date"
                      value={formik.values.dueDate}
                      onChange={(newValue) => formik.setFieldValue('dueDate', newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={formik.touched.dueDate && Boolean(formik.errors.dueDate)}
                          helperText={formik.touched.dueDate && formik.errors.dueDate as string}
                        />
                      )}
                    />
                  </Grid>
                  
                  {/* Assignment */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                      Assignment
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Team</InputLabel>
                      <Select
                        id="teamId"
                        name="teamId"
                        value={formik.values.teamId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        label="Team"
                      >
                        <MenuItem value="">No Team</MenuItem>
                        {teams.map((team) => (
                          <MenuItem key={team.id} value={team.id}>
                            {team.name} ({team.memberCount} members)
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Assigned To</InputLabel>
                      <Select
                        id="assignedToId"
                        name="assignedToId"
                        value={formik.values.assignedToId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        label="Assigned To"
                        disabled={!formik.values.teamId}
                      >
                        <MenuItem value="">Unassigned</MenuItem>
                        {teamMembers.map((user) => (
                          <MenuItem key={user.id} value={user.id}>
                            {user.name} ({user.role.toLowerCase()})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {/* Location */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                      <Typography variant="h6">
                        Location
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleGetCurrentLocation}
                      >
                        Get Current Location
                      </Button>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      id="latitude"
                      name="latitude"
                      label="Latitude"
                      type="number"
                      value={formik.values.latitude}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.latitude && Boolean(formik.errors.latitude)}
                      helperText={formik.touched.latitude && formik.errors.latitude}
                      inputProps={{ step: 'any' }}
                    />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      id="longitude"
                      name="longitude"
                      label="Longitude"
                      type="number"
                      value={formik.values.longitude}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.longitude && Boolean(formik.errors.longitude)}
                      helperText={formik.touched.longitude && formik.errors.longitude}
                      inputProps={{ step: 'any' }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="address"
                      name="address"
                      label="Address/Description"
                      value={formik.values.address}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.address && Boolean(formik.errors.address)}
                      helperText={formik.touched.address && formik.errors.address}
                    />
                  </Grid>
                </Grid>
              </>
            )}
          </DialogContent>
          
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || loadingData}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Task' : 'Create Task')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default TaskForm;