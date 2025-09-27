import { ApiService } from './api';
import { User, AuthResponse, LoginForm } from '@types/api';

export class AuthService extends ApiService {
  // Login user
  async login(credentials: LoginForm): Promise<AuthResponse> {
    try {
      // Try the test endpoint first
      const response = await this.post<AuthResponse>('/auth/test-login', credentials);
      
      // Store tokens in localStorage
      if (response.tokens) {
        localStorage.setItem('accessToken', response.tokens.accessToken);
        localStorage.setItem('refreshToken', response.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      // Fallback to regular login endpoint when backend is fixed
      throw error;
    }
  }

  // Register user
  async register(userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role: 'ADMIN' | 'SUPERVISOR' | 'TEAM_MEMBER';
  }): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/auth/register', userData);
    
    // Store tokens in localStorage
    if (response.tokens) {
      localStorage.setItem('accessToken', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/auth/refresh', { refreshToken });
    
    // Update tokens in localStorage
    if (response.tokens) {
      localStorage.setItem('accessToken', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);
    }
    
    return response;
  }

  // Logout user
  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken');
    
    try {
      if (refreshToken) {
        await this.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  // Forgot password
  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.post('/auth/forgot-password', { email });
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.post('/auth/reset-password', { token, newPassword });
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.post('/auth/change-password', { currentPassword, newPassword });
  }

  // Get current user from localStorage
  getCurrentUser(): User | null {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        return JSON.parse(userString);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        localStorage.removeItem('user');
      }
    }
    return null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Get auth token
  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // Check user role
  hasRole(requiredRoles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? requiredRoles.includes(user.role) : false;
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.hasRole(['ADMIN']);
  }

  // Check if user is supervisor or admin
  isSupervisor(): boolean {
    return this.hasRole(['ADMIN', 'SUPERVISOR']);
  }

  // Check if user is team member
  isTeamMember(): boolean {
    return this.hasRole(['TEAM_MEMBER']);
  }
}

export const authService = new AuthService();