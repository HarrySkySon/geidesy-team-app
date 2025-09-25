import { useState, useCallback, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';
import { TaskUpdateEvent, LocationUpdateEvent, UserStatusEvent } from '@services/websocket.service';

interface RealTimeState {
  taskUpdates: TaskUpdateEvent[];
  locationUpdates: Map<string, LocationUpdateEvent>;
  userStatuses: Map<string, UserStatusEvent>;
  isConnected: boolean;
}

export const useRealTimeUpdates = () => {
  const [state, setState] = useState<RealTimeState>({
    taskUpdates: [],
    locationUpdates: new Map(),
    userStatuses: new Map(),
    isConnected: false,
  });

  // Callbacks for real-time events
  const handleTaskUpdate = useCallback((event: TaskUpdateEvent) => {
    setState(prevState => ({
      ...prevState,
      taskUpdates: [event, ...prevState.taskUpdates].slice(0, 100), // Keep last 100 updates
    }));
  }, []);

  const handleLocationUpdate = useCallback((event: LocationUpdateEvent) => {
    setState(prevState => ({
      ...prevState,
      locationUpdates: new Map(prevState.locationUpdates.set(event.userId, event)),
    }));
  }, []);

  const handleUserStatusChange = useCallback((event: UserStatusEvent) => {
    setState(prevState => ({
      ...prevState,
      userStatuses: new Map(prevState.userStatuses.set(event.userId, event)),
    }));
  }, []);

  const handleConnect = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isConnected: true,
    }));
  }, []);

  const handleDisconnect = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isConnected: false,
    }));
  }, []);

  const handleError = useCallback((error: any) => {
    console.error('WebSocket error in real-time updates:', error);
  }, []);

  // Initialize WebSocket with event handlers
  const { 
    connect, 
    disconnect, 
    updateTaskStatus, 
    updateLocation, 
    updateUserStatus,
    joinTeamRoom,
    leaveTeamRoom,
  } = useWebSocket({
    onTaskUpdate: handleTaskUpdate,
    onLocationUpdate: handleLocationUpdate,
    onUserStatusChange: handleUserStatusChange,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onError: handleError,
  });

  // Helper functions
  const getLatestTaskUpdate = useCallback((taskId: string): TaskUpdateEvent | undefined => {
    return state.taskUpdates.find(update => update.taskId === taskId);
  }, [state.taskUpdates]);

  const getUserLocation = useCallback((userId: string): LocationUpdateEvent | undefined => {
    return state.locationUpdates.get(userId);
  }, [state.locationUpdates]);

  const getUserStatus = useCallback((userId: string): UserStatusEvent | undefined => {
    return state.userStatuses.get(userId);
  }, [state.userStatuses]);

  const getTeamLocations = useCallback((teamId: string): LocationUpdateEvent[] => {
    return Array.from(state.locationUpdates.values()).filter(
      location => location.teamId === teamId
    );
  }, [state.locationUpdates]);

  const getOnlineUsers = useCallback((): string[] => {
    return Array.from(state.userStatuses.entries())
      .filter(([_, status]) => status.status === 'online')
      .map(([userId]) => userId);
  }, [state.userStatuses]);

  const clearTaskUpdates = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      taskUpdates: [],
    }));
  }, []);

  const clearLocationUpdates = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      locationUpdates: new Map(),
    }));
  }, []);

  const clearUserStatuses = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      userStatuses: new Map(),
    }));
  }, []);

  // Auto-update user status based on page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateUserStatus('online');
      } else {
        updateUserStatus('busy');
      }
    };

    const handleBeforeUnload = () => {
      updateUserStatus('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Set initial status
    updateUserStatus('online');

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateUserStatus('offline');
    };
  }, [updateUserStatus]);

  return {
    // State
    taskUpdates: state.taskUpdates,
    locationUpdates: Array.from(state.locationUpdates.values()),
    userStatuses: Array.from(state.userStatuses.values()),
    isConnected: state.isConnected,

    // Connection methods
    connect,
    disconnect,

    // Update methods
    updateTaskStatus,
    updateLocation,
    updateUserStatus,
    joinTeamRoom,
    leaveTeamRoom,

    // Helper methods
    getLatestTaskUpdate,
    getUserLocation,
    getUserStatus,
    getTeamLocations,
    getOnlineUsers,

    // Clear methods
    clearTaskUpdates,
    clearLocationUpdates,
    clearUserStatuses,
  };
};

export default useRealTimeUpdates;