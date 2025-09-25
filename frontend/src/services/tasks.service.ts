import { apiService, ApiResponse } from './api.service';

// Task-related interfaces
export interface Task {
  id: string;
  title: string;
  description?: string;
  siteId: string;
  teamId?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledDate?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  site: {
    id: string;
    name: string;
    address?: string;
    latitude: number;
    longitude: number;
  };
  team?: {
    id: string;
    name: string;
    leaderId?: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  reports?: TaskReport[];
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
  user: {
    id: string;
    name: string;
  };
  attachments?: ReportAttachment[];
}

export interface ReportAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  siteId: string;
  teamId?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  scheduledDate?: string;
  estimatedDuration?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  teamId?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledDate?: string;
  estimatedDuration?: number;
  actualDuration?: number;
}

export interface CreateReportRequest {
  title: string;
  description?: string;
  latitude?: number;
  longitude?: number;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  teamId?: string;
  createdById?: string;
  scheduledDateFrom?: string;
  scheduledDateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface TasksResponse {
  tasks: Task[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

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
    avgDuration: number;
  }>;
}

// Tasks service class
export class TasksService {

  // Get all tasks with filters and pagination
  async getTasks(filters: TaskFilters = {}): Promise<TasksResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = queryString ? `/tasks?${queryString}` : '/tasks';
    
    const response = await apiService.get<TasksResponse>(url);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch tasks');
  }

  // Get single task by ID
  async getTask(id: string): Promise<Task> {
    const response = await apiService.get<{ task: Task }>(`/tasks/${id}`);
    
    if (response.success && response.data) {
      return response.data.task;
    }
    
    throw new Error(response.error || 'Failed to fetch task');
  }

  // Create new task
  async createTask(taskData: CreateTaskRequest): Promise<Task> {
    const response = await apiService.post<{ task: Task }>('/tasks', taskData);
    
    if (response.success && response.data) {
      return response.data.task;
    }
    
    throw new Error(response.error || 'Failed to create task');
  }

  // Update task
  async updateTask(id: string, updates: UpdateTaskRequest): Promise<Task> {
    const response = await apiService.put<{ task: Task }>(`/tasks/${id}`, updates);
    
    if (response.success && response.data) {
      return response.data.task;
    }
    
    throw new Error(response.error || 'Failed to update task');
  }

  // Delete task
  async deleteTask(id: string): Promise<void> {
    const response = await apiService.delete(`/tasks/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete task');
    }
  }

  // Update task status
  async updateTaskStatus(
    id: string, 
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
    actualDuration?: number
  ): Promise<Task> {
    const response = await apiService.put<{ task: Task }>(`/tasks/${id}/status`, {
      status,
      actualDuration
    });
    
    if (response.success && response.data) {
      return response.data.task;
    }
    
    throw new Error(response.error || 'Failed to update task status');
  }

  // Get task location
  async getTaskLocation(id: string): Promise<{
    taskId: string;
    location: {
      latitude: number;
      longitude: number;
      address?: string;
      name: string;
    };
  }> {
    const response = await apiService.get(`/tasks/${id}/location`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to get task location');
  }

  // Create task report
  async createTaskReport(taskId: string, reportData: CreateReportRequest): Promise<TaskReport> {
    const response = await apiService.post<{ report: TaskReport }>(`/tasks/${taskId}/reports`, reportData);
    
    if (response.success && response.data) {
      return response.data.report;
    }
    
    throw new Error(response.error || 'Failed to create task report');
  }

  // Get tasks by team
  async getTasksByTeam(teamId: string, filters: Partial<TaskFilters> = {}): Promise<Task[]> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = queryString ? `/teams/${teamId}/tasks?${queryString}` : `/teams/${teamId}/tasks`;
    
    const response = await apiService.get<{ tasks: Task[] }>(url);
    
    if (response.success && response.data) {
      return response.data.tasks;
    }
    
    throw new Error(response.error || 'Failed to fetch team tasks');
  }

  // Get tasks near location
  async getTasksNearLocation(
    latitude: number,
    longitude: number,
    radius: number = 10
  ): Promise<Task[]> {
    const response = await apiService.get<{ tasks: Task[] }>('/tasks/near', {
      params: { latitude, longitude, radius }
    });
    
    if (response.success && response.data) {
      return response.data.tasks;
    }
    
    throw new Error(response.error || 'Failed to fetch nearby tasks');
  }

  // Get task statistics
  async getTaskStatistics(filters: Partial<TaskFilters> = {}): Promise<TaskStatistics> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = queryString ? `/tasks/statistics?${queryString}` : '/tasks/statistics';
    
    const response = await apiService.get<{ statistics: TaskStatistics }>(url);
    
    if (response.success && response.data) {
      return response.data.statistics;
    }
    
    throw new Error(response.error || 'Failed to fetch task statistics');
  }

  // Upload file to task report
  async uploadReportFile(
    reportId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ReportAttachment> {
    const response = await apiService.uploadFile<{ attachment: ReportAttachment }>(
      `/reports/${reportId}/files`,
      file,
      onProgress
    );
    
    if (response.success && response.data) {
      return response.data.attachment;
    }
    
    throw new Error(response.error || 'Failed to upload file');
  }

  // Download report attachment
  async downloadReportAttachment(attachmentId: string, filename: string): Promise<void> {
    await apiService.downloadFile(`/attachments/${attachmentId}`, filename);
  }
}

// Export singleton instance
export const tasksService = new TasksService();
export default tasksService;