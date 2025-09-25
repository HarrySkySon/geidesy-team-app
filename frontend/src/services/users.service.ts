import { apiService, ApiResponse } from './api.service';

// User-related interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'TEAM_MEMBER';
  isActive: boolean;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserWithDetails extends User {
  teamMemberships: TeamMembership[];
  assignedTasks: UserTask[];
  ledTeams: UserTeam[];
  statistics: UserStatistics;
  locationHistory?: UserLocation[];
}

export interface TeamMembership {
  id: string;
  joinedAt: string;
  team: {
    id: string;
    name: string;
    description?: string;
    status: string;
    memberCount: number;
  };
}

export interface UserTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
  team?: {
    id: string;
    name: string;
  };
}

export interface UserTeam {
  id: string;
  name: string;
  description?: string;
  status: string;
  memberCount: number;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

export interface UserStatistics {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  overdueTasks: number;
  teamCount: number;
  teamsLed?: number;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'ADMIN' | 'SUPERVISOR' | 'TEAM_MEMBER';
  isActive?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  role?: 'ADMIN' | 'SUPERVISOR' | 'TEAM_MEMBER';
  isActive?: boolean;
  profileImage?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: 'ADMIN' | 'SUPERVISOR' | 'TEAM_MEMBER';
  isActive?: boolean;
  search?: string;
  sortBy?: 'name' | 'email' | 'role' | 'createdAt' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface DetailedUserStatistics {
  user: {
    id: string;
    name: string;
  };
  tasks: {
    total: number;
    completed: number;
    active: number;
    byStatus: Record<string, Record<string, number>>;
    completionRate: number;
  };
  teams: {
    total: number;
    active: number;
    memberships: TeamMembership[];
  };
  activity: {
    recent: UserTask[];
    lastLocation: UserLocation | null;
  };
}

// Users service class
export class UsersService {

  // Get all users with filtering and pagination
  async getUsers(filters: UserFilters = {}): Promise<UsersResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = queryString ? `/users?${queryString}` : '/users';
    
    const response = await apiService.get<UsersResponse>(url);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch users');
  }

  // Get single user by ID
  async getUser(id: string): Promise<UserWithDetails> {
    const response = await apiService.get<{ user: UserWithDetails }>(`/users/${id}`);
    
    if (response.success && response.data) {
      return response.data.user;
    }
    
    throw new Error(response.error || 'Failed to fetch user');
  }

  // Create new user (Admin only)
  async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await apiService.post<{ user: User }>('/users', userData);
    
    if (response.success && response.data) {
      return response.data.user;
    }
    
    throw new Error(response.error || 'Failed to create user');
  }

  // Update user
  async updateUser(id: string, updates: UpdateUserRequest): Promise<User> {
    const response = await apiService.put<{ user: User }>(`/users/${id}`, updates);
    
    if (response.success && response.data) {
      return response.data.user;
    }
    
    throw new Error(response.error || 'Failed to update user');
  }

  // Delete user (Admin only)
  async deleteUser(id: string): Promise<void> {
    const response = await apiService.delete(`/users/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete user');
    }
  }

  // Change user password
  async changePassword(id: string, passwordData: ChangePasswordRequest): Promise<void> {
    const response = await apiService.put(`/users/${id}/password`, passwordData);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to change password');
    }
  }

  // Get user statistics
  async getUserStatistics(id: string): Promise<DetailedUserStatistics> {
    const response = await apiService.get<{ statistics: DetailedUserStatistics }>(`/users/${id}/statistics`);
    
    if (response.success && response.data) {
      return response.data.statistics;
    }
    
    throw new Error(response.error || 'Failed to fetch user statistics');
  }

  // Helper methods for filtering
  async getUsersByRole(role: 'ADMIN' | 'SUPERVISOR' | 'TEAM_MEMBER'): Promise<User[]> {
    const response = await this.getUsers({ role });
    return response.users;
  }

  async getActiveUsers(): Promise<User[]> {
    const response = await this.getUsers({ isActive: true });
    return response.users;
  }

  async searchUsers(query: string): Promise<User[]> {
    const response = await this.getUsers({ search: query });
    return response.users;
  }

  // Get supervisors and admins (for team leader assignment)
  async getPotentialTeamLeaders(): Promise<User[]> {
    const response = await this.getUsers({ 
      role: 'SUPERVISOR',
      isActive: true,
    });
    
    // Also get admins
    const adminResponse = await this.getUsers({ 
      role: 'ADMIN',
      isActive: true,
    });
    
    return [...response.users, ...adminResponse.users];
  }

  // Get team members (for task assignment)
  async getTeamMembers(): Promise<User[]> {
    const response = await this.getUsers({ 
      role: 'TEAM_MEMBER',
      isActive: true,
    });
    return response.users;
  }

  // Bulk operations
  async bulkUpdateUsers(userIds: string[], updates: Partial<UpdateUserRequest>): Promise<void> {
    const promises = userIds.map(id => this.updateUser(id, updates));
    await Promise.all(promises);
  }

  async bulkDeactivateUsers(userIds: string[]): Promise<void> {
    await this.bulkUpdateUsers(userIds, { isActive: false });
  }

  async bulkActivateUsers(userIds: string[]): Promise<void> {
    await this.bulkUpdateUsers(userIds, { isActive: true });
  }

  // Validation helpers
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'SUPERVISOR':
        return 'Supervisor';
      case 'TEAM_MEMBER':
        return 'Team Member';
      default:
        return role;
    }
  }

  getRoleColor(role: string): 'error' | 'warning' | 'info' | 'success' | 'default' {
    switch (role) {
      case 'ADMIN':
        return 'error';
      case 'SUPERVISOR':
        return 'warning';
      case 'TEAM_MEMBER':
        return 'info';
      default:
        return 'default';
    }
  }

  getUserInitials(name: string): string {
    if (!name) return 'U';
    
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    
    return name[0].toUpperCase();
  }

  formatLastLogin(lastLoginAt?: string): string {
    if (!lastLoginAt) return 'Never';
    
    const date = new Date(lastLoginAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString();
  }

  calculateCompletionRate(completedTasks: number, totalTasks: number): number {
    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  }
}

// Export singleton instance
export const usersService = new UsersService();
export default usersService;