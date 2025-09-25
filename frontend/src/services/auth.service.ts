import { apiService, ApiResponse } from './api.service';

// Auth-related interfaces
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'TEAM_MEMBER';
  phone?: string;
  profileImage?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'TEAM_MEMBER';
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Auth service class
export class AuthService {
  
  // Login user
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>('/auth/login', credentials);
    
    if (response.success && response.data) {
      // Store access token
      localStorage.setItem('accessToken', response.data.accessToken);
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    }
    
    throw new Error(response.error || 'Login failed');
  }

  // Register new user
  async register(userData: RegisterRequest): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>('/auth/register', userData);
    
    if (response.success && response.data) {
      // Store access token
      localStorage.setItem('accessToken', response.data.accessToken);
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    }
    
    throw new Error(response.error || 'Registration failed');
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      // Continue with local logout even if server request fails
      console.error('Logout request failed:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      
      // Redirect to login page
      window.location.href = '/login';
    }
  }

  // Refresh access token
  async refreshToken(): Promise<string> {
    try {
      const response = await apiService.post<LoginResponse>('/auth/refresh');
      
      if (response.success && response.data) {
        const newToken = response.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        
        // Update user data if provided
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        return newToken;
      }
      
      throw new Error('Token refresh failed');
    } catch (error) {
      // Clear storage and redirect to login
      this.logout();
      throw error;
    }
  }

  // Forgot password
  async forgotPassword(email: string): Promise<void> {
    const response = await apiService.post<{ message: string }>('/auth/forgot-password', { email });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to send reset email');
    }
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await apiService.post<{ message: string }>('/auth/reset-password', {
      token,
      newPassword
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to reset password');
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await apiService.post<{ message: string }>('/auth/change-password', {
      currentPassword,
      newPassword
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to change password');
    }
  }

  // Get current user data
  async getCurrentUser(): Promise<User> {
    const response = await apiService.get<{ user: User }>('/auth/me');
    
    if (response.success && response.data) {
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data.user;
    }
    
    throw new Error(response.error || 'Failed to get user data');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  // Get stored access token
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // Get stored user data
  getStoredUser(): User | null {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
      }
    }
    return null;
  }

  // Check if user has specific role
  hasRole(role: string | string[]): boolean {
    const user = this.getStoredUser();
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    return user.role === role;
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  // Check if user is supervisor
  isSupervisor(): boolean {
    return this.hasRole(['ADMIN', 'SUPERVISOR']);
  }

  // Check if user is team member
  isTeamMember(): boolean {
    return this.hasRole('TEAM_MEMBER');
  }

  // Get user display name
  getDisplayName(): string {
    const user = this.getStoredUser();
    return user?.name || 'Unknown User';
  }

  // Get user email
  getEmail(): string {
    const user = this.getStoredUser();
    return user?.email || '';
  }

  // Clear all auth data (for logout)
  clearAuthData(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;