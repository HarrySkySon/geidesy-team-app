// Base Types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// User Types
export interface User extends BaseEntity {
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  department?: string;
  position?: string;
  profileImageUrl?: string;
  lastLogin?: string;
}

export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'TEAM_LEAD' | 'SURVEYOR';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

// Authentication Types
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Task Types
export interface Task extends BaseEntity {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completedAt?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  assignedToId?: string;
  assignedTo?: User;
  teamId?: string;
  team?: Team;
  siteId?: string;
  site?: Site;
  createdById: string;
  createdBy?: User;
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
}

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  assignedToId?: string;
  teamId?: string;
  siteId?: string;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  status?: TaskStatus;
  completedAt?: string;
}

// Team Types
export interface Team extends BaseEntity {
  name: string;
  description?: string;
  status: TeamStatus;
  leaderId?: string;
  leader?: User;
  members?: TeamMember[];
  currentLocation?: Location;
  lastActiveAt?: string;
}

export type TeamStatus = 'ACTIVE' | 'INACTIVE' | 'ON_BREAK' | 'OFFLINE';

export interface TeamMember extends BaseEntity {
  userId: string;
  user?: User;
  teamId: string;
  role: 'LEADER' | 'MEMBER';
  joinedAt: string;
  status: 'ACTIVE' | 'INACTIVE';
}

// Site Types
export interface Site extends BaseEntity {
  name: string;
  description?: string;
  address?: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  siteType: SiteType;
  status: SiteStatus;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  boundaries?: SiteBoundaryPoint[];
  notes?: string;
  createdById: string;
  createdBy?: User;
  taskCount?: number;
  hasBoundaries?: boolean;
}

export type SiteType = 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'AGRICULTURAL' | 'INFRASTRUCTURE' | 'ENVIRONMENTAL' | 'OTHER';
export type SiteStatus = 'ACTIVE' | 'INACTIVE' | 'PLANNED' | 'COMPLETED';

export interface SiteBoundaryPoint {
  latitude: number;
  longitude: number;
}

// Location Types
export interface Location {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface LocationUpdate {
  userId: string;
  teamId?: string;
  location: Location;
  status: 'ACTIVE' | 'INACTIVE';
}

// File Types
export interface TaskAttachment extends BaseEntity {
  taskId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface UploadedFile {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  taskId?: string;
}

// Comment Types
export interface TaskComment extends BaseEntity {
  taskId: string;
  content: string;
  authorId: string;
  author?: User;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  TasksTab: undefined;
  MapsTab: undefined;
  ProfileTab: undefined;
};

export type TasksStackParamList = {
  Tasks: undefined;
  TaskDetails: { taskId: string };
  TaskForm: { taskId?: string };
};

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
}

export interface TaskUpdateMessage {
  type: 'TASK_UPDATE';
  payload: {
    taskId: string;
    task: Task;
    updatedBy: string;
  };
}

export interface LocationUpdateMessage {
  type: 'LOCATION_UPDATE';
  payload: LocationUpdate;
}

export interface NotificationMessage {
  type: 'NOTIFICATION';
  payload: {
    id: string;
    title: string;
    body: string;
    data?: any;
  };
}

// Notification Types
export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: any;
  read: boolean;
  createdAt: string;
  type: NotificationType;
}

export type NotificationType = 'TASK_UPDATE' | 'LOCATION_ALERT' | 'TEAM_MESSAGE' | 'SYSTEM_ALERT';

// Camera Types
export interface CameraResult {
  uri: string;
  width: number;
  height: number;
  type: 'image' | 'video';
  exif?: any;
  base64?: string;
}

// Settings Types
export interface AppSettings {
  notifications: {
    enabled: boolean;
    taskUpdates: boolean;
    locationAlerts: boolean;
    teamMessages: boolean;
  };
  location: {
    trackingEnabled: boolean;
    shareLocation: boolean;
    updateInterval: number;
  };
  offline: {
    autoSync: boolean;
    syncInterval: number;
    keepOfflineData: number; // days
  };
  camera: {
    quality: number;
    includeExif: boolean;
    saveToGallery: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  language: string;
}

// Redux Store Types
export interface RootState {
  auth: AuthState;
  tasks: TasksState;
  teams: TeamsState;
  locations: LocationsState;
  notifications: NotificationsState;
  settings: SettingsState;
  offline: OfflineState;
}

export interface TasksState {
  tasks: Task[];
  currentTask: Task | null;
  loading: boolean;
  error: string | null;
  filters: TaskFilters;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToMe?: boolean;
  teamId?: string;
  search?: string;
}

export interface TeamsState {
  teams: Team[];
  currentTeam: Team | null;
  members: TeamMember[];
  loading: boolean;
  error: string | null;
}

export interface LocationsState {
  currentLocation: Location | null;
  teamLocations: { [teamId: string]: Location };
  tracking: boolean;
  shareLocation: boolean;
  error: string | null;
}

export interface NotificationsState {
  notifications: NotificationData[];
  unreadCount: number;
  permissions: boolean;
}

export interface SettingsState {
  settings: AppSettings;
  loading: boolean;
  error: string | null;
}

export interface OfflineState {
  isOffline: boolean;
  pendingSync: any[];
  lastSync: string | null;
  syncInProgress: boolean;
}

// Form Types
export interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: Date | null;
  assignedToId: string;
  teamId: string;
  siteId: string;
  useCurrentLocation: boolean;
  latitude: number | null;
  longitude: number | null;
  address: string;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Connection Status
export type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'RECONNECTING';

// Permission Types
export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface Permissions {
  location: PermissionStatus;
  camera: PermissionStatus;
  mediaLibrary: PermissionStatus;
  notifications: PermissionStatus;
}