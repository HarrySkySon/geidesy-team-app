// API Configuration
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api/v1'  // Development
  : 'https://your-production-api.com/api/v1';  // Production

export const WS_BASE_URL = __DEV__ 
  ? 'ws://localhost:3000'  // Development
  : 'wss://your-production-api.com';  // Production

// Authentication
export const TOKEN_STORAGE_KEY = 'auth_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';
export const USER_STORAGE_KEY = 'user_data';

// Location Services
export const LOCATION_UPDATE_INTERVAL = 5000; // 5 seconds
export const LOCATION_ACCURACY_THRESHOLD = 10; // meters
export const GPS_TIMEOUT = 10000; // 10 seconds

// Map Configuration
export const DEFAULT_MAP_REGION = {
  latitude: 50.4501,
  longitude: 30.5234,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

// Offline Storage
export const SYNC_BATCH_SIZE = 50;
export const SYNC_RETRY_ATTEMPTS = 3;
export const SYNC_RETRY_DELAY = 5000; // 5 seconds

// File Upload
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const SUPPORTED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
export const IMAGE_COMPRESSION_QUALITY = 0.8;

// Notifications
export const NOTIFICATION_CATEGORIES = {
  TASK_UPDATE: 'TASK_UPDATE',
  LOCATION_ALERT: 'LOCATION_ALERT',
  TEAM_MESSAGE: 'TEAM_MESSAGE',
  SYSTEM_ALERT: 'SYSTEM_ALERT',
} as const;

// UI Constants
export const COLORS = {
  primary: '#1976d2',
  primaryDark: '#115293',
  primaryLight: '#42a5f5',
  secondary: '#dc004e',
  secondaryDark: '#9a0036',
  secondaryLight: '#e5336d',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  background: '#f5f5f5',
  surface: '#ffffff',
  onPrimary: '#ffffff',
  onSecondary: '#ffffff',
  onSurface: '#000000',
  onBackground: '#000000',
  disabled: '#bdbdbd',
  placeholder: '#9e9e9e',
  backdrop: 'rgba(0,0,0,0.5)',
};

export const FONTS = {
  regular: 'Roboto-Regular',
  medium: 'Roboto-Medium',
  bold: 'Roboto-Bold',
  light: 'Roboto-Light',
};

export const SIZES = {
  padding: 16,
  margin: 16,
  borderRadius: 8,
  iconSize: 24,
  headerHeight: 56,
  tabBarHeight: 56,
};

// Task Status
export const TASK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ON_HOLD: 'ON_HOLD',
} as const;

// Task Priority
export const TASK_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  TEAM_LEAD: 'TEAM_LEAD',
  SURVEYOR: 'SURVEYOR',
} as const;

// Team Status
export const TEAM_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ON_BREAK: 'ON_BREAK',
  OFFLINE: 'OFFLINE',
} as const;

// Connection Status
export const CONNECTION_STATUS = {
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  RECONNECTING: 'RECONNECTING',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTHENTICATION_FAILED: 'Authentication failed. Please login again.',
  PERMISSION_DENIED: 'Permission denied. Contact your administrator.',
  LOCATION_UNAVAILABLE: 'Location services unavailable.',
  CAMERA_UNAVAILABLE: 'Camera is unavailable.',
  SYNC_FAILED: 'Failed to sync data. Will retry automatically.',
  FILE_UPLOAD_FAILED: 'Failed to upload file.',
  INVALID_CREDENTIALS: 'Invalid username or password.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Logged in successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  TASK_CREATED: 'Task created successfully',
  TASK_UPDATED: 'Task updated successfully',
  LOCATION_SHARED: 'Location shared successfully',
  FILE_UPLOADED: 'File uploaded successfully',
  DATA_SYNCED: 'Data synchronized successfully',
};

// Screen Names
export const SCREEN_NAMES = {
  // Auth Stack
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  
  // Main Stack
  HOME: 'Home',
  DASHBOARD: 'Dashboard',
  TASKS: 'Tasks',
  TASK_DETAILS: 'TaskDetails',
  TASK_FORM: 'TaskForm',
  MAPS: 'Maps',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  CAMERA: 'Camera',
  
  // Tab Navigator
  TASKS_TAB: 'TasksTab',
  MAPS_TAB: 'MapsTab',
  PROFILE_TAB: 'ProfileTab',
} as const;

export type ScreenName = typeof SCREEN_NAMES[keyof typeof SCREEN_NAMES];