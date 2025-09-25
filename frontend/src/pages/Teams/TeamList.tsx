import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  AvatarGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  People as PeopleIcon,
  LocationOn as LocationIcon,
  Assignment as AssignmentIcon,
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useAuth } from '@hooks/useAuth';
import { teamsService, Team, TeamMember } from '@services/teams.service';

interface TeamListProps {
  showCreateDialog?: boolean;
  onCreateDialogClose?: () => void;
}

export const TeamList: React.FC<TeamListProps> = ({
  showCreateDialog = false,
  onCreateDialogClose,
}) => {
  const { canManageTeams, canManageUsers, getUserDisplayName } = useAuth();
  
  // State
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  
  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(showCreateDialog);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  
  // Menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTeamId, setMenuTeamId] = useState<string | null>(null);

  // Load teams
  const loadTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const teamsData = await teamsService.getTeams();
      setTeams(teamsData);
      
    } catch (err: any) {
      console.error('Error loading teams:', err);
      setError(err.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load team members
  const loadTeamMembers = useCallback(async (teamId: string) => {
    try {
      const members = await teamsService.getTeamMembers(teamId);
      setTeamMembers(members);
    } catch (err: any) {
      console.error('Error loading team members:', err);
      setError(err.message || 'Failed to load team members');
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    if (showCreateDialog !== createDialogOpen) {
      setCreateDialogOpen(showCreateDialog);
    }
  }, [showCreateDialog]);

  // Handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, teamId: string) => {
    setAnchorEl(event.currentTarget);
    setMenuTeamId(teamId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTeamId(null);
  };

  const handleViewTeam = async (team: Team) => {
    setSelectedTeam(team);
    await loadTeamMembers(team.id);
    setViewDialogOpen(true);
    handleMenuClose();
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteTeam = (team: Team) => {
    setSelectedTeam(team);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleManageMembers = async (team: Team) => {
    setSelectedTeam(team);
    await loadTeamMembers(team.id);
    setMembersDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTeam) return;
    
    try {
      await teamsService.deleteTeam(selectedTeam.id);
      setDeleteDialogOpen(false);
      setSelectedTeam(null);
      loadTeams();
    } catch (err: any) {
      setError(err.message || 'Failed to delete team');
    }
  };

  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
    if (onCreateDialogClose) {
      onCreateDialogClose();
    }
    loadTeams();
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedTeam(null);
    loadTeams();
  };

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'default';
      case 'ON_BREAK':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatLastLocation = (team: Team) => {
    if (!team.lastLocation) return 'No location data';
    
    const timestamp = new Date(team.lastLocation.timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${Math.floor(diffHours / 24)} days ago`;
  };

  if (loading) {
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
          Teams Management
        </Typography>
        
        {canManageTeams() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Team
          </Button>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No teams found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {canManageTeams() ? 'Create your first team to get started.' : 'Teams will appear here once created.'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {teams.map((team) => (
            <Grid item xs={12} sm={6} md={4} key={team.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Team Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h2" noWrap>
                        {team.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {team.description || 'No description'}
                      </Typography>
                    </Box>
                    
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, team.id)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  {/* Status */}
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={team.status}
                      color={getStatusColor(team.status) as any}
                      size="small"
                    />
                  </Box>

                  {/* Team Members */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PeopleIcon sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                    </Typography>
                    
                    {team.members && team.members.length > 0 && (
                      <AvatarGroup max={3} sx={{ ml: 1 }}>
                        {team.members.slice(0, 3).map((member) => (
                          <Avatar
                            key={member.id}
                            sx={{ width: 24, height: 24 }}
                            title={member.user.name}
                          >
                            {member.user.name?.charAt(0)}
                          </Avatar>
                        ))}
                      </AvatarGroup>
                    )}
                  </Box>

                  {/* Tasks Stats */}
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AssignmentIcon sx={{ fontSize: 16, mr: 0.5, color: 'info.main' }} />
                      <Typography variant="caption">
                        {team.activeTasksCount} active
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AssignmentIcon sx={{ fontSize: 16, mr: 0.5, color: 'success.main' }} />
                      <Typography variant="caption">
                        {team.completedTasksCount} completed
                      </Typography>
                    </Box>
                  </Box>

                  {/* Last Location */}
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      Last seen: {formatLastLocation(team)}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    onClick={() => handleViewTeam(team)}
                    startIcon={<ViewIcon />}
                  >
                    View Details
                  </Button>
                  
                  {canManageTeams() && (
                    <Button
                      size="small"
                      onClick={() => handleManageMembers(team)}
                      startIcon={<PersonAddIcon />}
                    >
                      Members
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const team = teams.find(t => t.id === menuTeamId);
          if (team) handleViewTeam(team);
        }}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        
        {canManageTeams() && (
          <>
            <MenuItem onClick={() => {
              const team = teams.find(t => t.id === menuTeamId);
              if (team) handleEditTeam(team);
            }}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit Team</ListItemText>
            </MenuItem>
            
            <MenuItem onClick={() => {
              const team = teams.find(t => t.id === menuTeamId);
              if (team) handleManageMembers(team);
            }}>
              <ListItemIcon>
                <PersonAddIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Manage Members</ListItemText>
            </MenuItem>
            
            <MenuItem onClick={() => {
              const team = teams.find(t => t.id === menuTeamId);
              if (team) handleDeleteTeam(team);
            }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete Team</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* View Team Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Team Details</DialogTitle>
        <DialogContent>
          {selectedTeam && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    {selectedTeam.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedTeam.description || 'No description'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Status:</Typography>
                  <Chip
                    label={selectedTeam.status}
                    color={getStatusColor(selectedTeam.status) as any}
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Members:</Typography>
                  <Typography variant="body2">
                    {selectedTeam.memberCount} member{selectedTeam.memberCount !== 1 ? 's' : ''}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Active Tasks:</Typography>
                  <Typography variant="body2">{selectedTeam.activeTasksCount}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Completed Tasks:</Typography>
                  <Typography variant="body2">{selectedTeam.completedTasksCount}</Typography>
                </Grid>
                
                {selectedTeam.lastLocation && (
                  <>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Last Known Location:
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        Coordinates: {selectedTeam.lastLocation.latitude}, {selectedTeam.lastLocation.longitude}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        Last Update: {formatLastLocation(selectedTeam)}
                      </Typography>
                    </Grid>
                  </>
                )}
                
                {teamMembers.length > 0 && (
                  <>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Team Members:
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <List dense>
                        {teamMembers.map((member) => (
                          <ListItem key={member.id}>
                            <ListItemAvatar>
                              <Avatar>{member.user.name?.charAt(0)}</Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={member.user.name}
                              secondary={
                                <Box>
                                  <Typography variant="caption" display="block">
                                    {member.user.role?.toLowerCase()}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    {member.user.email}
                                  </Typography>
                                  {member.user.phone && (
                                    <Typography variant="caption" display="block">
                                      {member.user.phone}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                  </>
                )}
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
        <DialogTitle>Delete Team</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the team "{selectedTeam?.name}"? 
            This action cannot be undone and will remove all team assignments.
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

      {/* Members Management Dialog */}
      <Dialog
        open={membersDialogOpen}
        onClose={() => setMembersDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Manage Team Members: {selectedTeam?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Team member management will be available once user management is implemented.
          </Typography>
          
          {teamMembers.length > 0 && (
            <List>
              {teamMembers.map((member) => (
                <ListItem
                  key={member.id}
                  secondaryAction={
                    canManageUsers() && (
                      <IconButton edge="end" color="error" disabled>
                        <PersonRemoveIcon />
                      </IconButton>
                    )
                  }
                >
                  <ListItemAvatar>
                    <Avatar>{member.user.name?.charAt(0)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={member.user.name}
                    secondary={member.user.email}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMembersDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamList;