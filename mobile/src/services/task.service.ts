import { Task, TaskStatus, TaskFilterParams, PaginatedResponse } from '../types';
import apiService from './api.service';

class TaskService {
  private readonly endpoint = '/tasks';

  async getTasks(filters: TaskFilterParams): Promise<PaginatedResponse<Task>> {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters.searchQuery) params.append('search', filters.searchQuery);
    if (filters.dateRange?.start) params.append('startDate', filters.dateRange.start);
    if (filters.dateRange?.end) params.append('endDate', filters.dateRange.end);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
    
    const response = await apiService.get<PaginatedResponse<Task>>(url);
    return response;
  }

  async getTaskById(id: string): Promise<Task> {
    const response = await apiService.get<Task>(`${this.endpoint}/${id}`);
    return response;
  }

  async createTask(taskData: Partial<Task>): Promise<Task> {
    const response = await apiService.post<Task>(this.endpoint, taskData);
    return response;
  }

  async updateTask(id: string, updateData: Partial<Task>): Promise<Task> {
    const response = await apiService.put<Task>(`${this.endpoint}/${id}`, updateData);
    return response;
  }

  async deleteTask(id: string): Promise<void> {
    await apiService.delete(`${this.endpoint}/${id}`);
  }

  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    const response = await apiService.patch<Task>(`${this.endpoint}/${id}/status`, { status });
    return response;
  }

  async assignTask(id: string, userId: string): Promise<Task> {
    const response = await apiService.patch<Task>(`${this.endpoint}/${id}/assign`, { assignedTo: userId });
    return response;
  }

  async addTaskComment(id: string, comment: string): Promise<Task> {
    const response = await apiService.post<Task>(`${this.endpoint}/${id}/comments`, { comment });
    return response;
  }

  async uploadTaskFile(id: string, file: FormData): Promise<Task> {
    const response = await apiService.post<Task>(`${this.endpoint}/${id}/files`, file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  }

  async getMyTasks(filters: Partial<TaskFilterParams> = {}): Promise<PaginatedResponse<Task>> {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.searchQuery) params.append('search', filters.searchQuery);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}/my?${queryString}` : `${this.endpoint}/my`;
    
    const response = await apiService.get<PaginatedResponse<Task>>(url);
    return response;
  }

  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    const response = await apiService.get<Task[]>(`${this.endpoint}/status/${status}`);
    return response;
  }

  async getTaskStatistics(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  }> {
    const response = await apiService.get<any>(`${this.endpoint}/statistics`);
    return response;
  }
}

export const taskService = new TaskService();
export default taskService;