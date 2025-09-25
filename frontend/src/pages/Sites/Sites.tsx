import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Alert,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { sitesService, Site, SiteFilters, SitesResponse } from '../../services/sites.service';

const Sites: React.FC = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  // Filters
  const [filters, setFilters] = useState<SiteFilters>({
    page: 1,
    limit: 12,
    search: '',
    siteType: undefined,
    status: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    site: Site | null;
  }>({ open: false, site: null });

  // Load sites
  const loadSites = async (newFilters?: Partial<SiteFilters>) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentFilters = newFilters ? { ...filters, ...newFilters } : filters;
      const response: SitesResponse = await sitesService.getSites(currentFilters);
      
      setSites(response.sites);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  // Handle filter changes
  const handleFilterChange = (key: keyof SiteFilters, value: any) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    loadSites(newFilters);
  };

  // Handle page change
  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    loadSites(newFilters);
  };

  // Handle delete site
  const handleDeleteSite = async () => {
    if (!deleteDialog.site) return;

    try {
      await sitesService.deleteSite(deleteDialog.site.id);
      setDeleteDialog({ open: false, site: null });
      loadSites();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete site');
    }
  };

  // Format coordinates for display
  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Sites Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/sites/new')}
          >
            Add New Site
          </Button>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Search sites"
                  placeholder="Search by name, address, or description"
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Site Type</InputLabel>
                  <Select
                    value={filters.siteType || ''}
                    label="Site Type"
                    onChange={(e) => handleFilterChange('siteType', e.target.value || undefined)}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="RESIDENTIAL">Residential</MenuItem>
                    <MenuItem value="COMMERCIAL">Commercial</MenuItem>
                    <MenuItem value="INDUSTRIAL">Industrial</MenuItem>
                    <MenuItem value="AGRICULTURAL">Agricultural</MenuItem>
                    <MenuItem value="INFRASTRUCTURE">Infrastructure</MenuItem>
                    <MenuItem value="ENVIRONMENTAL">Environmental</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status || ''}
                    label="Status"
                    onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                    <MenuItem value="PLANNED">Planned</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={filters.sortBy || 'createdAt'}
                    label="Sort By"
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <MenuItem value="name">Name</MenuItem>
                    <MenuItem value="createdAt">Created Date</MenuItem>
                    <MenuItem value="updatedAt">Updated Date</MenuItem>
                    <MenuItem value="siteType">Type</MenuItem>
                    <MenuItem value="status">Status</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Sites Grid */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <Typography>Loading sites...</Typography>
          </Box>
        ) : sites.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="h6" align="center" color="text.secondary">
                No sites found
              </Typography>
              <Typography align="center" color="text.secondary" sx={{ mt: 1 }}>
                {filters.search || filters.siteType || filters.status
                  ? 'Try adjusting your filters'
                  : 'Start by adding your first site'
                }
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <>
            <Grid container spacing={3}>
              {sites.map((site) => (
                <Grid item xs={12} md={6} lg={4} key={site.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Typography variant="h6" component="h3" noWrap>
                          {site.name}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip
                            label={sitesService.getSiteTypeDisplayName(site.siteType)}
                            color={sitesService.getSiteTypeColor(site.siteType)}
                            size="small"
                          />
                          <Chip
                            label={sitesService.getSiteStatusDisplayName(site.status)}
                            color={sitesService.getSiteStatusColor(site.status)}
                            size="small"
                          />
                        </Stack>
                      </Box>

                      {site.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {site.description}
                        </Typography>
                      )}

                      {site.address && (
                        <Box display="flex" alignItems="center" mb={1}>
                          <LocationIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {site.address}
                          </Typography>
                        </Box>
                      )}

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Coordinates: {formatCoordinates(site.latitude, site.longitude)}
                      </Typography>

                      {site.taskCount !== undefined && (
                        <Typography variant="body2" color="text.secondary">
                          Tasks: {site.taskCount}
                        </Typography>
                      )}

                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Created: {new Date(site.createdAt).toLocaleDateString()}
                      </Typography>
                    </CardContent>

                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => navigate(`/sites/${site.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => navigate(`/sites/${site.id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleteDialog({ open: true, site })}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <Box display="flex" justifyContent="center" mt={4}>
                <Pagination
                  count={pagination.pages}
                  page={pagination.page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, site: null })}
        >
          <DialogTitle>Delete Site</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the site "{deleteDialog.site?.name}"?
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteDialog({ open: false, site: null })}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteSite}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Sites;