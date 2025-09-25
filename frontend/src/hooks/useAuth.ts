import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/index';
import {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
  changePassword,
  forgotPassword,
  resetPassword,
  clearError,
  selectAuth,
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectAuthError,
  selectUserRole,
  selectIsAdmin,
  selectIsSupervisor,
  selectIsTeamMember,
  selectUserName,
  selectUserEmail,
} from '@store/slices/authSlice';
import { LoginRequest, RegisterRequest } from '@services/auth.service';

// Custom hook for authentication
export const useAuth = () => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const auth = useAppSelector(selectAuth);
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectAuthError);
  const userRole = useAppSelector(selectUserRole);
  const isAdmin = useAppSelector(selectIsAdmin);
  const isSupervisor = useAppSelector(selectIsSupervisor);
  const isTeamMember = useAppSelector(selectIsTeamMember);
  const userName = useAppSelector(selectUserName);
  const userEmail = useAppSelector(selectUserEmail);

  // Actions
  const login = useCallback(async (credentials: LoginRequest) => {
    const result = await dispatch(loginUser(credentials));
    return result;
  }, [dispatch]);

  const register = useCallback(async (userData: RegisterRequest) => {
    const result = await dispatch(registerUser(userData));
    return result;
  }, [dispatch]);

  const logout = useCallback(async () => {
    const result = await dispatch(logoutUser());
    return result;
  }, [dispatch]);

  const refreshUserData = useCallback(async () => {
    const result = await dispatch(getCurrentUser());
    return result;
  }, [dispatch]);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const result = await dispatch(changePassword({ currentPassword, newPassword }));
    return result;
  }, [dispatch]);

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    const result = await dispatch(forgotPassword(email));
    return result;
  }, [dispatch]);

  const resetUserPassword = useCallback(async (token: string, newPassword: string) => {
    const result = await dispatch(resetPassword({ token, newPassword }));
    return result;
  }, [dispatch]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Permission checks
  const hasRole = useCallback((roles: string | string[]): boolean => {
    if (!user) return false;
    
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    
    return user.role === roles;
  }, [user]);

  const canAccess = useCallback((requiredRoles: string | string[]): boolean => {
    return isAuthenticated && hasRole(requiredRoles);
  }, [isAuthenticated, hasRole]);

  const canManageUsers = useCallback((): boolean => {
    return canAccess(['ADMIN']);
  }, [canAccess]);

  const canManageTasks = useCallback((): boolean => {
    return canAccess(['ADMIN', 'SUPERVISOR']);
  }, [canAccess]);

  const canManageTeams = useCallback((): boolean => {
    return canAccess(['ADMIN', 'SUPERVISOR']);
  }, [canAccess]);

  const canViewAllTasks = useCallback((): boolean => {
    return canAccess(['ADMIN', 'SUPERVISOR']);
  }, [canAccess]);

  const canCreateTasks = useCallback((): boolean => {
    return canAccess(['ADMIN', 'SUPERVISOR']);
  }, [canAccess]);

  const canDeleteTasks = useCallback((): boolean => {
    return canAccess(['ADMIN', 'SUPERVISOR']);
  }, [canAccess]);

  const canViewReports = useCallback((): boolean => {
    return canAccess(['ADMIN', 'SUPERVISOR']);
  }, [canAccess]);

  const canUpdateTaskStatus = useCallback((): boolean => {
    return isAuthenticated; // All authenticated users can update task status
  }, [isAuthenticated]);

  // User info helpers
  const getUserDisplayName = useCallback((): string => {
    return user?.name || 'Unknown User';
  }, [user]);

  const getUserInitials = useCallback((): string => {
    if (!user?.name) return 'U';
    
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    
    return user.name[0].toUpperCase();
  }, [user]);

  const getProfileImageUrl = useCallback((): string | null => {
    return user?.profileImage || null;
  }, [user]);

  // Validation helpers
  const validateAuthState = useCallback((): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return false;
    }
    
    return true;
  }, [isAuthenticated, user]);

  return {
    // State
    auth,
    user,
    isAuthenticated,
    isLoading,
    error,
    userRole,
    userName,
    userEmail,
    
    // Role checks
    isAdmin,
    isSupervisor,
    isTeamMember,
    hasRole,
    canAccess,
    
    // Permission checks
    canManageUsers,
    canManageTasks,
    canManageTeams,
    canViewAllTasks,
    canCreateTasks,
    canDeleteTasks,
    canViewReports,
    canUpdateTaskStatus,
    
    // Actions
    login,
    register,
    logout,
    refreshUserData,
    updatePassword,
    sendPasswordResetEmail,
    resetUserPassword,
    clearAuthError,
    
    // Helpers
    getUserDisplayName,
    getUserInitials,
    getProfileImageUrl,
    validateAuthState,
  };
};

export default useAuth;