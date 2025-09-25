import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { 
  webSocketService,
  TaskUpdateEvent,
  LocationUpdateEvent,
  NotificationEvent,
  UserStatusEvent,
  GeofenceEvent,
  TaskUpdateListener,
  LocationUpdateListener,
  NotificationListener,
  UserStatusListener,
  GeofenceListener,
  ConnectionListener,
  ErrorListener
} from '@services/websocket.service';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  onTaskUpdate?: TaskUpdateListener;
  onLocationUpdate?: LocationUpdateListener;
  onNotification?: NotificationListener;
  onUserStatusChange?: UserStatusListener;
  onGeofenceEvent?: GeofenceListener;
  onConnect?: ConnectionListener;
  onDisconnect?: ConnectionListener;
  onError?: ErrorListener;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { isAuthenticated, user } = useAuth();
  const {
    autoConnect = true,
    onTaskUpdate,
    onLocationUpdate,
    onNotification,
    onUserStatusChange,
    onGeofenceEvent,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  // Use refs to store the latest callback functions
  const callbacksRef = useRef({
    onTaskUpdate,
    onLocationUpdate,
    onNotification,
    onUserStatusChange,
    onGeofenceEvent,
    onConnect,
    onDisconnect,
    onError,
  });

  // Update refs when callbacks change
  useEffect(() => {
    callbacksRef.current = {
      onTaskUpdate,
      onLocationUpdate,
      onNotification,
      onUserStatusChange,
      onGeofenceEvent,
      onConnect,
      onDisconnect,
      onError,
    };
  }, [onTaskUpdate, onLocationUpdate, onNotification, onUserStatusChange, onGeofenceEvent, onConnect, onDisconnect, onError]);

  // Connect/disconnect based on authentication
  useEffect(() => {
    if (isAuthenticated && user && autoConnect) {
      webSocketService.connect();
    } else {
      webSocketService.disconnect();
    }

    // Cleanup on unmount
    return () => {
      if (autoConnect) {
        webSocketService.disconnect();
      }
    };
  }, [isAuthenticated, user, autoConnect]);

  // Set up event listeners
  useEffect(() => {
    const listeners = {
      taskUpdate: (event: TaskUpdateEvent) => callbacksRef.current.onTaskUpdate?.(event),
      locationUpdate: (event: LocationUpdateEvent) => callbacksRef.current.onLocationUpdate?.(event),
      notification: (event: NotificationEvent) => callbacksRef.current.onNotification?.(event),
      userStatusChange: (event: UserStatusEvent) => callbacksRef.current.onUserStatusChange?.(event),
      geofenceEvent: (event: GeofenceEvent) => callbacksRef.current.onGeofenceEvent?.(event),
      connect: () => callbacksRef.current.onConnect?.(),
      disconnect: () => callbacksRef.current.onDisconnect?.(),
      error: (error: any) => callbacksRef.current.onError?.(error),
    };

    // Add listeners
    if (onTaskUpdate) {
      webSocketService.addTaskUpdateListener(listeners.taskUpdate);
    }
    if (onLocationUpdate) {
      webSocketService.addLocationUpdateListener(listeners.locationUpdate);
    }
    if (onNotification) {
      webSocketService.addNotificationListener(listeners.notification);
    }
    if (onUserStatusChange) {
      webSocketService.addUserStatusListener(listeners.userStatusChange);
    }
    if (onGeofenceEvent) {
      webSocketService.addGeofenceListener(listeners.geofenceEvent);
    }
    if (onConnect) {
      webSocketService.addConnectListener(listeners.connect);
    }
    if (onDisconnect) {
      webSocketService.addDisconnectListener(listeners.disconnect);
    }
    if (onError) {
      webSocketService.addErrorListener(listeners.error);
    }

    // Cleanup listeners
    return () => {
      if (onTaskUpdate) {
        webSocketService.removeTaskUpdateListener(listeners.taskUpdate);
      }
      if (onLocationUpdate) {
        webSocketService.removeLocationUpdateListener(listeners.locationUpdate);
      }
      if (onNotification) {
        webSocketService.removeNotificationListener(listeners.notification);
      }
      if (onUserStatusChange) {
        webSocketService.removeUserStatusListener(listeners.userStatusChange);
      }
      if (onGeofenceEvent) {
        webSocketService.removeGeofenceListener(listeners.geofenceEvent);
      }
      if (onConnect) {
        webSocketService.removeConnectListener(listeners.connect);
      }
      if (onDisconnect) {
        webSocketService.removeDisconnectListener(listeners.disconnect);
      }
      if (onError) {
        webSocketService.removeErrorListener(listeners.error);
      }
    };
  }, [
    onTaskUpdate,
    onLocationUpdate,
    onNotification,
    onUserStatusChange,
    onGeofenceEvent,
    onConnect,
    onDisconnect,
    onError,
  ]);

  // API methods
  const connect = useCallback(() => {
    webSocketService.connect();
  }, []);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
  }, []);

  const updateTaskStatus = useCallback((taskId: string, status: string) => {
    webSocketService.updateTaskStatus(taskId, status);
  }, []);

  const updateLocation = useCallback((latitude: number, longitude: number, accuracy?: number) => {
    webSocketService.updateLocation(latitude, longitude, accuracy);
  }, []);

  const sendNotification = useCallback((userId: string, notification: Omit<NotificationEvent, 'id' | 'userId' | 'createdAt'>) => {
    webSocketService.sendNotification(userId, notification);
  }, []);

  const updateUserStatus = useCallback((status: 'online' | 'offline' | 'busy') => {
    webSocketService.updateUserStatus(status);
  }, []);

  const joinTeamRoom = useCallback((teamId: string) => {
    webSocketService.joinTeamRoom(teamId);
  }, []);

  const leaveTeamRoom = useCallback((teamId: string) => {
    webSocketService.leaveTeamRoom(teamId);
  }, []);

  const isConnected = useCallback(() => {
    return webSocketService.isConnected();
  }, []);

  return {
    // Connection status
    isConnected: isConnected(),
    
    // Connection methods
    connect,
    disconnect,
    
    // Event emission methods
    updateTaskStatus,
    updateLocation,
    sendNotification,
    updateUserStatus,
    joinTeamRoom,
    leaveTeamRoom,
    
    // Utility
    webSocketService,
  };
};

export default useWebSocket;