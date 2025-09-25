import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
  Stack,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  sitesService,
  Site,
  CreateSiteRequest,
  UpdateSiteRequest,
  SiteType,
  SiteStatus,
  SiteBoundaryPoint,
} from '../../services/sites.service';
import { LocationPicker, SiteBoundaryMap } from '../../components/maps';

interface SiteFormProps {
  mode: 'create' | 'edit';
}

const SiteForm: React.FC<SiteFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [site, setSite] = useState<Site | null>(null);

  // Validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required('Site name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters'),
    description: Yup.string().max(500, 'Description must not exceed 500 characters'),
    address: Yup.string().max(200, 'Address must not exceed 200 characters'),
    latitude: Yup.number()
      .required('Latitude is required')
      .min(-90, 'Latitude must be between -90 and 90')
      .max(90, 'Latitude must be between -90 and 90'),
    longitude: Yup.number()
      .required('Longitude is required')
      .min(-180, 'Longitude must be between -180 and 180')
      .max(180, 'Longitude must be between -180 and 180'),
    altitude: Yup.number().nullable(),
    accuracy: Yup.number().nullable().min(0, 'Accuracy cannot be negative'),
    siteType: Yup.string().required('Site type is required'),
    status: Yup.string().required('Status is required'),
    contactPerson: Yup.string().max(100, 'Contact person name must not exceed 100 characters'),
    contactPhone: Yup.string().max(20, 'Phone number must not exceed 20 characters'),
    contactEmail: Yup.string()
      .email('Invalid email format')
      .max(100, 'Email must not exceed 100 characters'),
    notes: Yup.string().max(1000, 'Notes must not exceed 1000 characters'),
  });

  // Form handling
  const formik = useFormik<CreateSiteRequest | UpdateSiteRequest>({
    initialValues: {
      name: '',
      description: '',
      address: '',
      latitude: 0,
      longitude: 0,
      altitude: null,
      accuracy: null,
      siteType: 'OTHER' as SiteType,
      status: 'PLANNED' as SiteStatus,
      contactPerson: '',
      contactPhone: '',
      contactEmail: '',
      notes: '',
      boundaries: [],
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);

        if (mode === 'create') {
          const newSite = await sitesService.createSite(values as CreateSiteRequest);
          navigate(`/sites/${newSite.id}`);
        } else if (mode === 'edit' && id) {
          const updatedSite = await sitesService.updateSite(id, values as UpdateSiteRequest);
          navigate(`/sites/${updatedSite.id}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save site');
      } finally {
        setLoading(false);
      }
    },
  });

  // Load site data for editing
  useEffect(() => {
    if (mode === 'edit' && id) {
      const loadSite = async () => {
        try {
          setLoading(true);
          const siteData = await sitesService.getSite(id);
          setSite(siteData);
          
          // Populate form with existing data
          formik.setValues({
            name: siteData.name,
            description: siteData.description || '',
            address: siteData.address || '',
            latitude: siteData.latitude,
            longitude: siteData.longitude,
            altitude: siteData.altitude || null,
            accuracy: siteData.accuracy || null,
            siteType: siteData.siteType,
            status: siteData.status,
            contactPerson: siteData.contactPerson || '',
            contactPhone: siteData.contactPhone || '',
            contactEmail: siteData.contactEmail || '',
            notes: siteData.notes || '',
            boundaries: siteData.boundaries || [],
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load site');
        } finally {
          setLoading(false);
        }
      };

      loadSite();
    }
  }, [mode, id]);


  return (
    <Container maxWidth="md">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            {mode === 'create' ? 'Create New Site' : `Edit Site${site ? `: ${site.name}` : ''}`}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate('/sites')}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <Stack spacing={3}>
            {/* Basic Information */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="name"
                      label="Site Name"
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
                      name="description"
                      label="Description"
                      value={formik.values.description}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.description && Boolean(formik.errors.description)}
                      helperText={formik.touched.description && formik.errors.description}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="address"
                      label="Address"
                      value={formik.values.address}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.address && Boolean(formik.errors.address)}
                      helperText={formik.touched.address && formik.errors.address}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Site Type</InputLabel>
                      <Select
                        name="siteType"
                        value={formik.values.siteType}
                        label="Site Type"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.siteType && Boolean(formik.errors.siteType)}
                      >
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
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        name="status"
                        value={formik.values.status}
                        label="Status"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.status && Boolean(formik.errors.status)}
                      >
                        <MenuItem value="PLANNED">Planned</MenuItem>
                        <MenuItem value="ACTIVE">Active</MenuItem>
                        <MenuItem value="INACTIVE">Inactive</MenuItem>
                        <MenuItem value="COMPLETED">Completed</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Location Information */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Location Information
                </Typography>
                <LocationPicker
                  latitude={formik.values.latitude || undefined}
                  longitude={formik.values.longitude || undefined}
                  onLocationChange={(lat, lng) => {
                    formik.setFieldValue('latitude', lat);
                    formik.setFieldValue('longitude', lng);
                  }}
                  height={400}
                  disabled={loading}
                />
                
                {/* Additional Location Fields */}
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      name="altitude"
                      label="Altitude (meters)"
                      value={formik.values.altitude || ''}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.altitude && Boolean(formik.errors.altitude)}
                      helperText={formik.touched.altitude && formik.errors.altitude}
                      inputProps={{ step: 'any' }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      name="accuracy"
                      label="Accuracy (meters)"
                      value={formik.values.accuracy || ''}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.accuracy && Boolean(formik.errors.accuracy)}
                      helperText={formik.touched.accuracy && formik.errors.accuracy}
                      inputProps={{ step: 'any', min: 0 }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Contact Information (Optional)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      name="contactPerson"
                      label="Contact Person"
                      value={formik.values.contactPerson}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.contactPerson && Boolean(formik.errors.contactPerson)}
                      helperText={formik.touched.contactPerson && formik.errors.contactPerson}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      name="contactPhone"
                      label="Contact Phone"
                      value={formik.values.contactPhone}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.contactPhone && Boolean(formik.errors.contactPhone)}
                      helperText={formik.touched.contactPhone && formik.errors.contactPhone}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="email"
                      name="contactEmail"
                      label="Contact Email"
                      value={formik.values.contactEmail}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.contactEmail && Boolean(formik.errors.contactEmail)}
                      helperText={formik.touched.contactEmail && formik.errors.contactEmail}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Site Boundaries */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Site Boundaries (Optional)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <SiteBoundaryMap
                  boundaries={formik.values.boundaries || []}
                  onBoundariesChange={(boundaries) => formik.setFieldValue('boundaries', boundaries)}
                  siteCenter={formik.values.latitude && formik.values.longitude ? {
                    latitude: formik.values.latitude,
                    longitude: formik.values.longitude
                  } : undefined}
                  height={500}
                  disabled={loading}
                />
              </AccordionDetails>
            </Accordion>

            {/* Notes */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  name="notes"
                  label="Additional Notes"
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.notes && Boolean(formik.errors.notes)}
                  helperText={formik.touched.notes && formik.errors.notes}
                  placeholder="Any additional information about this site..."
                />
              </CardContent>
            </Card>

            {/* Form Actions */}
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/sites')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : mode === 'create' ? 'Create Site' : 'Update Site'}
                </Button>
              </Box>
            </Paper>
          </Stack>
        </form>
      </Box>
    </Container>
  );
};

export default SiteForm;