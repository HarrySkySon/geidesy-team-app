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
  CircularProgress,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { teamsService, CreateTeamRequest, UpdateTeamRequest } from '@services/teams.service';

interface TeamFormProps {
  open: boolean;
  onClose: () => void;
  team?: any;
  isEdit?: boolean;
}

const validationSchema = yup.object({
  name: yup
    .string()
    .required('Team name is required')
    .min(2, 'Team name must be at least 2 characters')
    .max(50, 'Team name must be less than 50 characters'),
  description: yup
    .string()
    .max(200, 'Description must be less than 200 characters'),
  status: yup
    .string()
    .oneOf(['ACTIVE', 'INACTIVE', 'ON_BREAK'], 'Invalid status')
    .required('Status is required'),
  leaderId: yup
    .string()
    .nullable(),
});

export const TeamForm: React.FC<TeamFormProps> = ({
  open,
  onClose,
  team,
  isEdit = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: team?.name || '',
      description: team?.description || '',
      status: team?.status || 'ACTIVE',
      leaderId: team?.leaderId || '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError(null);
      
      try {
        const teamData = {
          ...values,
          leaderId: values.leaderId || null,
        };

        if (isEdit && team) {
          await teamsService.updateTeam(team.id, teamData as UpdateTeamRequest);
        } else {
          await teamsService.createTeam(teamData as CreateTeamRequest);
        }

        handleClose();
      } catch (err: any) {
        console.error('Team form error:', err);
        setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} team`);
      } finally {
        setLoading(false);
      }
    },
  });

  // Load available users for team leader selection
  useEffect(() => {
    const loadUsers = async () => {
      if (!open) return;
      
      try {
        setLoadingData(true);
        // For now, we'll use empty array since user management isn't implemented yet
        // In the future, this would load from usersService.getUsers()
        setUsers([]);
      } catch (err) {
        console.error('Error loading users:', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadUsers();
  }, [open]);

  const handleClose = () => {
    formik.resetForm();
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? 'Edit Team' : 'Create New Team'}
      </DialogTitle>
      
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Team Information
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="name"
                name="name"
                label="Team Name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
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
                placeholder="Brief description of the team's purpose and responsibilities..."
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
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
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="ON_BREAK">On Break</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Team Leader</InputLabel>
                <Select
                  id="leaderId"
                  name="leaderId"
                  value={formik.values.leaderId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.leaderId && Boolean(formik.errors.leaderId)}
                  label="Team Leader"
                  disabled={loadingData || users.length === 0}
                >
                  <MenuItem value="">No Leader</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name} ({user.role?.toLowerCase()})
                    </MenuItem>
                  ))}
                </Select>
                {users.length === 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    User management not yet implemented. Leaders can be assigned later.
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            {/* Additional Information */}
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                <strong>Note:</strong> Team members can be added and managed after the team is created.
                Location tracking will be automatically enabled for active teams.
              </Typography>
            </Grid>
          </Grid>
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
            {loading ? 'Saving...' : (isEdit ? 'Update Team' : 'Create Team')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TeamForm;