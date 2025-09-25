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
  Avatar,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  usersService,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserRole,
  UserStatus,
} from '../../services/users.service';
import { uploadService } from '../../services/upload.service';

interface UserFormProps {
  mode: 'create' | 'edit';
}

const UserForm: React.FC<UserFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required('Full name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters'),
    email: Yup.string()
      .required('Email is required')
      .email('Invalid email format')
      .max(100, 'Email must not exceed 100 characters'),
    password: mode === 'create' 
      ? Yup.string()
          .required('Password is required')
          .min(8, 'Password must be at least 8 characters')
          .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
          .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
          .matches(/[0-9]/, 'Password must contain at least one number')
      : Yup.string()
          .nullable()
          .notRequired()
          .test('password-validation', 'Password must be at least 8 characters with uppercase, lowercase, and number', function(value) {
            if (!value) return true; // Allow empty for edit mode
            return value.length >= 8 && 
                   /[A-Z]/.test(value) && 
                   /[a-z]/.test(value) && 
                   /[0-9]/.test(value);
          }),
    confirmPassword: Yup.string()
      .nullable()
      .notRequired()
      .test('passwords-match', 'Passwords must match', function(value) {
        const password = this.parent.password;
        if (!password && !value) return true;
        return password === value;
      }),
    role: Yup.string().required('Role is required'),
    status: Yup.string().required('Status is required'),
    phone: Yup.string().nullable().max(20, 'Phone number must not exceed 20 characters'),
    department: Yup.string().nullable().max(100, 'Department must not exceed 100 characters'),
    position: Yup.string().nullable().max(100, 'Position must not exceed 100 characters'),
  });

  // Form handling
  const formik = useFormik<CreateUserRequest | (UpdateUserRequest & { confirmPassword?: string })>({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'SURVEYOR' as UserRole,
      status: 'ACTIVE' as UserStatus,
      phone: '',
      department: '',
      position: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);

        // Upload profile image if selected
        let profileImageUrl = user?.profileImageUrl;
        if (profileImage) {
          try {
            setUploadingImage(true);
            const uploadedFile = await uploadService.uploadProfileImage(profileImage);
            profileImageUrl = uploadedFile.url;
          } catch (uploadError) {
            setError('Failed to upload profile image. Please try again.');
            return;
          } finally {
            setUploadingImage(false);
          }
        }

        const userData = {
          name: values.name,
          email: values.email,
          role: values.role,
          status: values.status,
          phone: values.phone || undefined,
          department: values.department || undefined,
          position: values.position || undefined,
          profileImageUrl,
        };

        if (mode === 'create') {
          const newUser = await usersService.createUser({
            ...userData,
            password: values.password!,
          } as CreateUserRequest);
          navigate(`/users/${newUser.id}`);
        } else if (mode === 'edit' && id) {
          const updateData: UpdateUserRequest = { ...userData };
          if (values.password) {
            updateData.password = values.password;
          }
          const updatedUser = await usersService.updateUser(id, updateData);
          navigate(`/users/${updatedUser.id}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save user');
      } finally {
        setLoading(false);
      }
    },
  });

  // Load user data for editing
  useEffect(() => {
    if (mode === 'edit' && id) {
      const loadUser = async () => {
        try {
          setLoading(true);
          const userData = await usersService.getUser(id);
          setUser(userData);
          
          // Set profile image preview
          if (userData.profileImageUrl) {
            setProfileImagePreview(userData.profileImageUrl);
          }
          
          // Populate form with existing data
          formik.setValues({
            name: userData.name,
            email: userData.email,
            password: '',
            confirmPassword: '',
            role: userData.role,
            status: userData.status,
            phone: userData.phone || '',
            department: userData.department || '',
            position: userData.position || '',
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load user');
        } finally {
          setLoading(false);
        }
      };

      loadUser();
    }
  }, [mode, id]);

  // Handle profile image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file
      try {
        uploadService.validateFile(file, 'profile_image');
        setProfileImage(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setProfileImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid image file');
      }
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            {mode === 'create' ? 'Create New User' : `Edit User${user ? `: ${user.name}` : ''}`}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate('/users')}
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
            {/* Profile Image */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Profile Image
                </Typography>
                <Box display="flex" alignItems="center" gap={3}>
                  <Avatar
                    src={profileImagePreview || undefined}
                    sx={{ width: 100, height: 100 }}
                  />
                  <Box>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="profile-image-upload"
                      type="file"
                      onChange={handleImageSelect}
                    />
                    <label htmlFor="profile-image-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<PhotoCameraIcon />}
                        disabled={uploadingImage}
                      >
                        {profileImagePreview ? 'Change Photo' : 'Upload Photo'}
                      </Button>
                    </label>
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                      JPEG, PNG, or WebP. Max file size: 5MB
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

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
                      label="Full Name"
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
                      type="email"
                      name="email"
                      label="Email Address"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.email && Boolean(formik.errors.email)}
                      helperText={formik.touched.email && formik.errors.email}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Role</InputLabel>
                      <Select
                        name="role"
                        value={formik.values.role}
                        label="Role"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.role && Boolean(formik.errors.role)}
                      >
                        <MenuItem value="ADMIN">Admin</MenuItem>
                        <MenuItem value="SUPERVISOR">Supervisor</MenuItem>
                        <MenuItem value="TEAM_LEAD">Team Lead</MenuItem>
                        <MenuItem value="SURVEYOR">Surveyor</MenuItem>
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
                        <MenuItem value="ACTIVE">Active</MenuItem>
                        <MenuItem value="INACTIVE">Inactive</MenuItem>
                        <MenuItem value="PENDING">Pending</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Password Section */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {mode === 'create' ? 'Password' : 'Change Password (Optional)'}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      label={mode === 'create' ? 'Password' : 'New Password'}
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.password && Boolean(formik.errors.password)}
                      helperText={formik.touched.password && formik.errors.password}
                      required={mode === 'create'}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      label="Confirm Password"
                      value={formik.values.confirmPassword}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                      helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                      required={mode === 'create' || Boolean(formik.values.password)}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                            >
                              {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
                {mode === 'create' && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Password must be at least 8 characters with uppercase, lowercase, and number
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Contact & Organization Information */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contact & Organization Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      name="phone"
                      label="Phone Number"
                      value={formik.values.phone}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.phone && Boolean(formik.errors.phone)}
                      helperText={formik.touched.phone && formik.errors.phone}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      name="department"
                      label="Department"
                      value={formik.values.department}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.department && Boolean(formik.errors.department)}
                      helperText={formik.touched.department && formik.errors.department}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      name="position"
                      label="Position/Title"
                      value={formik.values.position}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.position && Boolean(formik.errors.position)}
                      helperText={formik.touched.position && formik.errors.position}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/users')}
                  disabled={loading || uploadingImage}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading || uploadingImage}
                >
                  {loading ? 'Saving...' : uploadingImage ? 'Uploading...' : mode === 'create' ? 'Create User' : 'Update User'}
                </Button>
              </Box>
            </Paper>
          </Stack>
        </form>
      </Box>
    </Container>
  );
};

export default UserForm;