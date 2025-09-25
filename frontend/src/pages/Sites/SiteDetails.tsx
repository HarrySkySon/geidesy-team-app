import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Task as TaskIcon,
  Boundary as BoundaryIcon,
  Notes as NotesIcon,
  CalendarToday as CalendarIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import {
  sitesService,
  SiteWithDetails,
  SiteTask,
  SiteStatistics,
  SiteBoundaryPoint,
} from '../../services/sites.service';
import { SiteMap } from '../../components/maps';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const SiteDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [site, setSite] = useState<SiteWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState(false);

  // Load site details
  useEffect(() => {
    if (id) {
      const loadSite = async () => {
        try {
          setLoading(true);
          setError(null);
          const siteData = await sitesService.getSite(id);
          setSite(siteData);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load site');
        } finally {
          setLoading(false);
        }
      };

      loadSite();
    }
  }, [id]);

  // Handle delete site
  const handleDeleteSite = async () => {
    if (!site) return;

    try {
      await sitesService.deleteSite(site.id);
      navigate('/sites');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete site');
    } finally {
      setDeleteDialog(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Format coordinates
  const formatCoordinates = (lat: number, lng: number, format: 'decimal' | 'dms' = 'decimal') => {
    if (format === 'dms') {
      return sitesService.formatCoordinatesDMS(lat, lng);
    }
    return sitesService.formatCoordinates(lat, lng);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>Loading site details...</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !site) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Site not found'}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/sites')}
          >
            Back to Sites
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Button
              variant="text"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/sites')}
              sx={{ mb: 1 }}
            >
              Back to Sites
            </Button>
            <Typography variant="h4" component="h1" gutterBottom>
              {site.name}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip
                label={sitesService.getSiteTypeDisplayName(site.siteType)}
                color={sitesService.getSiteTypeColor(site.siteType)}
              />
              <Chip
                label={sitesService.getSiteStatusDisplayName(site.status)}
                color={sitesService.getSiteStatusColor(site.status)}
              />
            </Stack>
            {site.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {site.description}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/sites/${site.id}/edit`)}
            >
              Edit Site
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialog(true)}
            >
              Delete
            </Button>
          </Stack>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="site details tabs">
            <Tab label="Overview" />
            <Tab label={`Tasks (${site.tasks?.length || 0})`} />
            <Tab label="Location & Boundaries" />
            <Tab label="Statistics" />
          </Tabs>
        </Paper>

        {/* Tab Panels */}
        
        {/* Overview Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <LocationIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Address"
                        secondary={site.address || 'No address specified'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CalendarIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Created"
                        secondary={new Date(site.createdAt).toLocaleString()}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CalendarIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Last Updated"
                        secondary={new Date(site.updatedAt).toLocaleString()}
                      />
                    </ListItem>
                    {site.createdBy && (
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Created By"
                          secondary={`${site.createdBy.name} (${site.createdBy.email})`}
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Contact Information
                  </Typography>
                  {site.contactPerson || site.contactPhone || site.contactEmail ? (
                    <List>
                      {site.contactPerson && (
                        <ListItem>
                          <ListItemIcon>
                            <PersonIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Contact Person"
                            secondary={site.contactPerson}
                          />
                        </ListItem>
                      )}
                      {site.contactPhone && (
                        <ListItem>
                          <ListItemIcon>
                            <PhoneIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Phone"
                            secondary={site.contactPhone}
                          />
                        </ListItem>
                      )}
                      {site.contactEmail && (
                        <ListItem>
                          <ListItemIcon>
                            <EmailIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Email"
                            secondary={site.contactEmail}
                          />
                        </ListItem>
                      )}
                    </List>
                  ) : (
                    <Typography color="text.secondary">
                      No contact information available
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Notes */}
            {site.notes && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <NotesIcon sx={{ mr: 1 }} />
                      Notes
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {site.notes}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Tasks Tab */}
        <TabPanel value={activeTab} index={1}>
          {site.tasks && site.tasks.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Team</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {site.tasks.map((task: SiteTask) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">{task.title}</Typography>
                          {task.description && (
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {task.description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={task.status} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={task.priority}
                          size="small"
                          color={
                            task.priority === 'HIGH' ? 'error' :
                            task.priority === 'MEDIUM' ? 'warning' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {task.assignedTo ? (
                          <Typography variant="body2">
                            {task.assignedTo.name}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Unassigned
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.team ? (
                          <Chip label={task.team.name} size="small" />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No team
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Card>
              <CardContent>
                <Box textAlign="center" py={4}>
                  <TaskIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No tasks assigned to this site
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tasks will appear here when they are created and assigned to this site.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </TabPanel>

        {/* Location & Boundaries Tab */}
        <TabPanel value={activeTab} index={2}>
          <Stack spacing={3}>
            {/* Interactive Map */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Site Location & Boundaries
                </Typography>
                <SiteMap
                  sites={[site]}
                  center={[site.latitude, site.longitude]}
                  zoom={15}
                  height={500}
                  onSiteClick={() => {}}
                  showPopups={false}
                  interactive={true}
                />
              </CardContent>
            </Card>

            <Grid container spacing={3}>
              {/* Coordinates */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Coordinates
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary="Decimal Degrees"
                          secondary={formatCoordinates(site.latitude, site.longitude)}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Degrees, Minutes, Seconds"
                          secondary={formatCoordinates(site.latitude, site.longitude, 'dms')}
                        />
                      </ListItem>
                      {site.altitude && (
                        <ListItem>
                          <ListItemText
                            primary="Altitude"
                            secondary={`${site.altitude.toFixed(2)} meters`}
                          />
                        </ListItem>
                      )}
                      {site.accuracy && (
                        <ListItem>
                          <ListItemText
                            primary="Accuracy"
                            secondary={`±${site.accuracy.toFixed(2)} meters`}
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Site Boundaries */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <BoundaryIcon sx={{ mr: 1 }} />
                      Site Boundaries
                    </Typography>
                    {site.boundaries && site.boundaries.length > 0 ? (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {site.boundaries.length} boundary points defined
                        </Typography>
                        <List dense>
                          {site.boundaries.map((point: SiteBoundaryPoint, index: number) => (
                            <ListItem key={index}>
                              <ListItemText
                                primary={`Point ${index + 1}`}
                                secondary={formatCoordinates(point.latitude, point.longitude)}
                              />
                            </ListItem>
                          ))}
                        </List>
                        {site.boundaries.length >= 3 && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                            <Typography variant="body2">
                              <strong>Area:</strong> {sitesService.calculateBoundaryArea(site.boundaries).toFixed(6)} sq. degrees
                            </Typography>
                            {sitesService.getBoundaryCenter(site.boundaries) && (
                              <Typography variant="body2">
                                <strong>Center:</strong> {formatCoordinates(
                                  sitesService.getBoundaryCenter(site.boundaries)!.latitude,
                                  sitesService.getBoundaryCenter(site.boundaries)!.longitude
                                )}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Typography color="text.secondary">
                        No boundaries defined for this site
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Stack>
        </TabPanel>

        {/* Statistics Tab */}
        <TabPanel value={activeTab} index={3}>
          {site.statistics ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="primary" gutterBottom>
                      {site.statistics.totalTasks}
                    </Typography>
                    <Typography variant="h6">Total Tasks</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="success.main" gutterBottom>
                      {site.statistics.completedTasks}
                    </Typography>
                    <Typography variant="h6">Completed</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="info.main" gutterBottom>
                      {site.statistics.activeTasks}
                    </Typography>
                    <Typography variant="h6">Active</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="secondary.main" gutterBottom>
                      {site.statistics.completionRate.toFixed(1)}%
                    </Typography>
                    <Typography variant="h6">Completion Rate</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Card>
              <CardContent>
                <Box textAlign="center" py={4}>
                  <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No statistics available
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Statistics will be generated once tasks are assigned to this site.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </TabPanel>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
          <DialogTitle>Delete Site</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the site "{site.name}"?
              This action cannot be undone and will also delete all associated tasks.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog(false)} color="inherit">
              Cancel
            </Button>
            <Button onClick={handleDeleteSite} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default SiteDetails;