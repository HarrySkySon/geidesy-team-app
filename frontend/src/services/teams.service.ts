import { apiService, ApiResponse } from './api.service';

// Team-related interfaces
export interface Team {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_BREAK';
  leaderId?: string;
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
  memberCount: number;
  activeTasksCount: number;
  completedTasksCount: number;
  lastLocation?: TeamLocation;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    profileImage?: string;
    lastLoginAt?: string;
  };
}

export interface TeamLocation {
  id: string;
  teamId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  leaderId?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_BREAK';
  leaderId?: string;
}

export interface TeamFilters {
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_BREAK';
  search?: string;
}

export interface LocationUpdateRequest {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface TeamStatistics {
  teamId: string;
  name: string;
  memberCount: number;
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  averageTaskDuration: number;
  status: string;
}

// Teams service class
export class TeamsService {

  // Get all teams
  async getTeams(filters: TeamFilters = {}): Promise<Team[]> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = queryString ? `/teams?${queryString}` : '/teams';
    
    const response = await apiService.get<{ teams: Team[] }>(url);
    
    if (response.success && response.data) {
      return response.data.teams;
    }
    
    throw new Error(response.error || 'Failed to fetch teams');
  }

  // Get single team by ID
  async getTeam(id: string): Promise<Team> {
    const response = await apiService.get<{ team: Team }>(`/teams/${id}`);
    
    if (response.success && response.data) {
      return response.data.team;
    }
    
    throw new Error(response.error || 'Failed to fetch team');
  }

  // Create new team
  async createTeam(teamData: CreateTeamRequest): Promise<Team> {
    const response = await apiService.post<{ team: Team }>('/teams', teamData);
    
    if (response.success && response.data) {
      return response.data.team;
    }
    
    throw new Error(response.error || 'Failed to create team');
  }

  // Update team
  async updateTeam(id: string, updates: UpdateTeamRequest): Promise<Team> {
    const response = await apiService.put<{ team: Team }>(`/teams/${id}`, updates);
    
    if (response.success && response.data) {
      return response.data.team;
    }
    
    throw new Error(response.error || 'Failed to update team');
  }

  // Delete team
  async deleteTeam(id: string): Promise<void> {
    const response = await apiService.delete(`/teams/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete team');
    }
  }

  // Get team members
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const response = await apiService.get<{ members: TeamMember[] }>(`/teams/${teamId}/members`);
    
    if (response.success && response.data) {
      return response.data.members;
    }
    
    throw new Error(response.error || 'Failed to fetch team members');
  }

  // Add team member
  async addTeamMember(teamId: string, userId: string): Promise<TeamMember> {
    const response = await apiService.post<{ teamMember: TeamMember }>(`/teams/${teamId}/members`, {
      userId
    });
    
    if (response.success && response.data) {
      return response.data.teamMember;
    }
    
    throw new Error(response.error || 'Failed to add team member');
  }

  // Remove team member
  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    const response = await apiService.delete(`/teams/${teamId}/members/${userId}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to remove team member');
    }
  }

  // Update team location
  async updateTeamLocation(teamId: string, location: LocationUpdateRequest): Promise<TeamLocation> {
    const response = await apiService.put<{ location: TeamLocation }>(`/teams/${teamId}/location`, location);
    
    if (response.success && response.data) {
      return response.data.location;
    }
    
    throw new Error(response.error || 'Failed to update team location');
  }

  // Get team locations (location history)
  async getTeamLocations(teamId: string, limit: number = 50): Promise<TeamLocation[]> {
    const response = await apiService.get<{ locations: TeamLocation[] }>(`/teams/${teamId}/locations`, {
      params: { limit }
    });
    
    if (response.success && response.data) {
      return response.data.locations;
    }
    
    throw new Error(response.error || 'Failed to fetch team locations');
  }

  // Get team statistics
  async getTeamStatistics(teamId?: string): Promise<TeamStatistics | TeamStatistics[]> {
    const url = teamId ? `/teams/${teamId}/statistics` : '/teams/statistics';
    const response = await apiService.get<{ statistics: TeamStatistics | TeamStatistics[] }>(url);
    
    if (response.success && response.data) {
      return response.data.statistics;
    }
    
    throw new Error(response.error || 'Failed to fetch team statistics');
  }

  // Get all team statistics
  async getAllTeamStatistics(): Promise<TeamStatistics[]> {
    const response = await apiService.get<{ statistics: TeamStatistics[] }>('/teams/statistics');
    
    if (response.success && response.data) {
      return response.data.statistics;
    }
    
    throw new Error(response.error || 'Failed to fetch team statistics');
  }

  // Get my teams (for current user)
  async getMyTeams(): Promise<Team[]> {
    const response = await apiService.get<{ teams: Team[] }>('/teams/my');
    
    if (response.success && response.data) {
      return response.data.teams;
    }
    
    throw new Error(response.error || 'Failed to fetch user teams');
  }

  // Get teams by status
  async getTeamsByStatus(status: 'ACTIVE' | 'INACTIVE' | 'ON_BREAK'): Promise<Team[]> {
    return this.getTeams({ status });
  }

  // Search teams
  async searchTeams(query: string): Promise<Team[]> {
    return this.getTeams({ search: query });
  }

  // Get active teams
  async getActiveTeams(): Promise<Team[]> {
    return this.getTeamsByStatus('ACTIVE');
  }

  // Get team with tasks
  async getTeamWithTasks(teamId: string): Promise<Team & { tasks: any[] }> {
    const response = await apiService.get<{ team: Team & { tasks: any[] } }>(`/teams/${teamId}?include=tasks`);
    
    if (response.success && response.data) {
      return response.data.team;
    }
    
    throw new Error(response.error || 'Failed to fetch team with tasks');
  }

  // Check if user is team member
  async isTeamMember(teamId: string, userId?: string): Promise<boolean> {
    try {
      const members = await this.getTeamMembers(teamId);
      const currentUserId = userId || this.getCurrentUserId();
      return members.some(member => member.userId === currentUserId);
    } catch (error) {
      return false;
    }
  }

  // Check if user is team leader
  async isTeamLeader(teamId: string, userId?: string): Promise<boolean> {
    try {
      const team = await this.getTeam(teamId);
      const currentUserId = userId || this.getCurrentUserId();
      return team.leaderId === currentUserId;
    } catch (error) {
      return false;
    }
  }

  // Get current user ID from auth service
  private getCurrentUserId(): string {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        return userData.id;
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    throw new Error('User not authenticated');
  }
}

// Export singleton instance
export const teamsService = new TeamsService();
export default teamsService;