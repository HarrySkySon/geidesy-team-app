import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api.service';
import { 
  LoginRequest, 
  LoginResponse, 
  User, 
  ApiResponse,
} from '../types';
import { 
  TOKEN_STORAGE_KEY, 
  REFRESH_TOKEN_STORAGE_KEY, 
  USER_STORAGE_KEY 
} from '../constants';

class AuthService {
  // Login user
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await apiService.post<LoginResponse>('/auth/login', credentials);
      
      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;
        
        // Store tokens and user data
        await Promise.all([
          AsyncStorage.setItem(TOKEN_STORAGE_KEY, token),
          AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken),
          AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user)),
        ]);
        
        // Set token in API service
        await apiService.setAuthToken(token);
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed',
      };
    }
  }

  // Register new user
  async register(userData: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone?: string;
    department?: string;
    position?: string;
  }): Promise<ApiResponse<{ user: User }>> {
    try {
      const response = await apiService.post<{ user: User }>('/auth/register', userData);
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed',
      };
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate token on server
      await apiService.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of server response
      await this.clearLocalData();
    }
  }

  // Clear local authentication data
  private async clearLocalData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_STORAGE_KEY),
        AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY),
        AsyncStorage.removeItem(USER_STORAGE_KEY),
      ]);
      
      // Remove token from API service
      await apiService.removeAuthToken();
    } catch (error) {
      console.error('Error clearing local data:', error);
    }
  }

  // Get current user from storage
  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      const user = await this.getCurrentUser();
      return !!(token && user);
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  // Refresh authentication token
  async refreshToken(): Promise<ApiResponse<{ token: string; refreshToken: string }>> {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
      
      if (!refreshToken) {
        return {
          success: false,
          error: 'No refresh token available',
        };
      }

      const response = await apiService.post<{ token: string; refreshToken: string }>(
        '/auth/refresh',
        { refreshToken }
      );

      if (response.success && response.data) {
        const { token, refreshToken: newRefreshToken } = response.data;
        
        // Update stored tokens
        await Promise.all([
          AsyncStorage.setItem(TOKEN_STORAGE_KEY, token),
          AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, newRefreshToken),
        ]);
        
        // Update token in API service
        await apiService.setAuthToken(token);
      }

      return response;
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: 'Token refresh failed',
      };
    }
  }

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await apiService.put<User>('/auth/profile', updates);
      
      if (response.success && response.data) {
        // Update stored user data
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data));
      }
      
      return response;
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: 'Profile update failed',
      };
    }
  }

  // Change password
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiService.post<{ message: string }>('/auth/change-password', data);
      return response;
    } catch (error) {
      console.error('Password change error:', error);
      return {
        success: false,
        error: 'Password change failed',
      };
    }
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiService.post<{ message: string }>('/auth/forgot-password', {
        email,
      });
      return response;
    } catch (error) {
      console.error('Password reset request error:', error);
      return {
        success: false,
        error: 'Password reset request failed',
      };
    }
  }

  // Reset password with token
  async resetPassword(data: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiService.post<{ message: string }>('/auth/reset-password', data);
      return response;
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: 'Password reset failed',
      };
    }
  }

  // Verify email
  async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiService.post<{ message: string }>('/auth/verify-email', {
        token,
      });
      return response;
    } catch (error) {
      console.error('Email verification error:', error);
      return {
        success: false,
        error: 'Email verification failed',
      };
    }
  }

  // Get user permissions
  async getUserPermissions(): Promise<string[]> {
    try {
      const response = await apiService.get<{ permissions: string[] }>('/auth/permissions');
      return response.success && response.data ? response.data.permissions : [];
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  // Check specific permission
  async hasPermission(permission: string): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions();
      return permissions.includes(permission);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  // Get stored tokens
  async getStoredTokens(): Promise<{
    token: string | null;
    refreshToken: string | null;
  }> {
    try {
      const [token, refreshToken] = await Promise.all([
        AsyncStorage.getItem(TOKEN_STORAGE_KEY),
        AsyncStorage.getItem(REFRESH_TOKEN_STORAGE_KEY),
      ]);
      
      return { token, refreshToken };
    } catch (error) {
      console.error('Error getting stored tokens:', error);
      return { token: null, refreshToken: null };
    }
  }

  // Initialize auth state from storage
  async initializeAuthState(): Promise<{
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
  }> {
    try {
      const [user, token] = await Promise.all([
        this.getCurrentUser(),
        AsyncStorage.getItem(TOKEN_STORAGE_KEY),
      ]);

      const isAuthenticated = !!(user && token);

      if (isAuthenticated && token) {
        // Set token in API service
        await apiService.setAuthToken(token);
      }

      return {
        user,
        token,
        isAuthenticated,
      };
    } catch (error) {
      console.error('Error initializing auth state:', error);
      return {
        user: null,
        token: null,
        isAuthenticated: false,
      };
    }
  }

  // Upload profile image
  async uploadProfileImage(
    imageUri: string,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ profileImageUrl: string }>> {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile-image.jpg',
      } as any);

      const response = await apiService.uploadFile<{ profileImageUrl: string }>(
        '/auth/upload-profile-image',
        formData,
        onProgress
      );

      if (response.success && response.data) {
        // Update user data with new profile image URL
        const currentUser = await this.getCurrentUser();
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            profileImageUrl: response.data.profileImageUrl,
          };
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        }
      }

      return response;
    } catch (error) {
      console.error('Profile image upload error:', error);
      return {
        success: false,
        error: 'Profile image upload failed',
      };
    }
  }
}

export const authService = new AuthService();
export default authService;