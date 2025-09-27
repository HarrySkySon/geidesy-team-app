// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'TEAM_MEMBER';
  profileImage?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// Task Types
export interface Site {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  description?: string;
  clientInfo?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledDate?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  siteId: string;
  site: Site;
  teamId?: string;
  team?: Team;
  createdById: string;
  createdBy: User;
  reports?: TaskReport[];
  attachments?: TaskAttachment[];
}

export interface TaskReport {
  id: string;
  taskId: string;
  userId: string;
  title: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  user: User;
  attachments?: ReportAttachment[];
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface ReportAttachment {
  id: string;
  reportId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

// Team Types
export interface Team {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_BREAK';
  leaderId?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  members?: TeamMember[];
  tasks?: Task[];
  locations?: TeamLocation[];
  
  // Computed fields
  memberCount?: number;
  activeTasksCount?: number;
  completedTasksCount?: number;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  joinedAt: string;
  
  // Relations
  user: User;
  team: Team;
}

export interface TeamLocation {
  id: string;
  teamId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  
  // Relations
  team: Team;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  
  // Relations
  user: User;
}

// Statistics Types
export interface TaskStatistics {
  overview: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  byPriority: Record<string, number>;
  byTeam: Array<{
    teamId: string;
    taskCount: number;
    avgDuration?: number;
  }>;
}

export interface TeamStatistics {
  id: string;
  name: string;
  memberCount: number;
  activeTasksCount: number;
  completedTasksCount: number;
  totalTasksCount: number;
  averageCompletionTime?: number;
  completionRate: number;
  lastActiveAt?: string;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Filter Types
export interface TaskFilters {
  status?: Task['status'];
  priority?: Task['priority'];
  teamId?: string;
  createdById?: string;
  scheduledDateFrom?: string;
  scheduledDateTo?: string;
  search?: string;
}

export interface TeamFilters {
  status?: Team['status'];
  search?: string;
}

// Location Types
export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LocationWithDistance extends TeamLocation {
  distanceKm?: number;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface TaskForm {
  title: string;
  description?: string;
  siteId: string;
  teamId?: string;
  priority: Task['priority'];
  scheduledDate?: string;
  estimatedDuration?: number;
}

export interface TeamForm {
  name: string;
  description?: string;
  leaderId?: string;
}

export interface TaskReportForm {
  title: string;
  description?: string;
  latitude?: number;
  longitude?: number;
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
}

export interface TaskUpdateMessage extends WebSocketMessage {
  type: 'TASK_UPDATE';
  payload: {
    taskId: string;
    task: Task;
    action: 'created' | 'updated' | 'deleted' | 'status_changed';
  };
}

export interface LocationUpdateMessage extends WebSocketMessage {
  type: 'LOCATION_UPDATE';
  payload: {
    teamId: string;
    location: TeamLocation;
  };
}

export interface NotificationMessage extends WebSocketMessage {
  type: 'NOTIFICATION';
  payload: {
    notification: Notification;
  };
}