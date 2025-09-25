import { io, Socket } from 'socket.io-client';
import { authService } from './auth.service';

// WebSocket event types
export interface TaskUpdateEvent {
  taskId: string;
  status: string;
  updatedBy: string;
  updatedAt: string;
}

export interface LocationUpdateEvent {
  userId: string;
  teamId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

export interface NotificationEvent {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  userId: string;
  createdAt: string;
}

export interface UserStatusEvent {
  userId: string;
  status: 'online' | 'offline' | 'busy';
  lastSeen: string;
}

export interface GeofenceEvent {
  type: 'enter' | 'exit';
  userId: string;
  teamId: string;
  geofenceId: string;
  geofenceName: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

// Event listener types
export type TaskUpdateListener = (event: TaskUpdateEvent) => void;
export type LocationUpdateListener = (event: LocationUpdateEvent) => void;
export type NotificationListener = (event: NotificationEvent) => void;
export type UserStatusListener = (event: UserStatusEvent) => void;
export type GeofenceListener = (event: GeofenceEvent) => void;
export type ConnectionListener = () => void;
export type ErrorListener = (error: any) => void;

export class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isAuthenticated = false;
  private currentUserId: string | null = null;

  // Event listeners storage
  private taskUpdateListeners: TaskUpdateListener[] = [];
  private locationUpdateListeners: LocationUpdateListener[] = [];
  private notificationListeners: NotificationListener[] = [];
  private userStatusListeners: UserStatusListener[] = [];
  private geofenceListeners: GeofenceListener[] = [];
  private connectListeners: ConnectionListener[] = [];
  private disconnectListeners: ConnectionListener[] = [];
  private errorListeners: ErrorListener[] = [];

  // Initialize WebSocket connection
  connect(): void {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    const token = authService.getAccessToken();
    if (!token) {
      console.warn('No access token available for WebSocket connection');
      return;
    }

    const user = authService.getStoredUser();
    if (!user) {
      console.warn('No user data available for WebSocket connection');
      return;
    }

    this.currentUserId = user.id;

    // Create socket connection
    this.socket = io(process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3001', {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventListeners();
  }

  // Disconnect WebSocket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isAuthenticated = false;
      this.reconnectAttempts = 0;
      console.log('WebSocket disconnected');
    }
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Setup internal event listeners
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.notifyConnectListeners();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isAuthenticated = false;
      this.notifyDisconnectListeners();
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.notifyErrorListeners(error);
    });

    // Authentication events
    this.socket.on('authenticated', () => {
      console.log('WebSocket authenticated');
      this.isAuthenticated = true;
      
      // Join user-specific room
      if (this.currentUserId) {
        this.socket?.emit('join_user_room', this.currentUserId);
      }
    });

    this.socket.on('authentication_error', (error) => {
      console.error('WebSocket authentication error:', error);
      this.notifyErrorListeners(error);
      this.disconnect();
    });

    // Business logic events
    this.socket.on('task_updated', (event: TaskUpdateEvent) => {
      console.log('Task updated:', event);
      this.notifyTaskUpdateListeners(event);
    });

    this.socket.on('task_assigned', (event: TaskUpdateEvent) => {
      console.log('Task assigned:', event);
      this.notifyTaskUpdateListeners(event);
    });

    this.socket.on('location_update', (event: LocationUpdateEvent) => {
      console.log('Location update:', event);
      this.notifyLocationUpdateListeners(event);
    });

    this.socket.on('notification', (event: NotificationEvent) => {
      console.log('Notification received:', event);
      this.notifyNotificationListeners(event);
    });

    this.socket.on('user_status_changed', (event: UserStatusEvent) => {
      console.log('User status changed:', event);
      this.notifyUserStatusListeners(event);
    });

    this.socket.on('geofence_event', (event: GeofenceEvent) => {
      console.log('Geofence event:', event);
      this.notifyGeofenceListeners(event);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.notifyErrorListeners(error);
    });
  }

  // Event listener management
  addTaskUpdateListener(listener: TaskUpdateListener): void {
    this.taskUpdateListeners.push(listener);
  }

  removeTaskUpdateListener(listener: TaskUpdateListener): void {
    const index = this.taskUpdateListeners.indexOf(listener);
    if (index > -1) {
      this.taskUpdateListeners.splice(index, 1);
    }
  }

  addLocationUpdateListener(listener: LocationUpdateListener): void {
    this.locationUpdateListeners.push(listener);
  }

  removeLocationUpdateListener(listener: LocationUpdateListener): void {
    const index = this.locationUpdateListeners.indexOf(listener);
    if (index > -1) {
      this.locationUpdateListeners.splice(index, 1);
    }
  }

  addNotificationListener(listener: NotificationListener): void {
    this.notificationListeners.push(listener);
  }

  removeNotificationListener(listener: NotificationListener): void {
    const index = this.notificationListeners.indexOf(listener);
    if (index > -1) {
      this.notificationListeners.splice(index, 1);
    }
  }

  addUserStatusListener(listener: UserStatusListener): void {
    this.userStatusListeners.push(listener);
  }

  removeUserStatusListener(listener: UserStatusListener): void {
    const index = this.userStatusListeners.indexOf(listener);
    if (index > -1) {
      this.userStatusListeners.splice(index, 1);
    }
  }

  addGeofenceListener(listener: GeofenceListener): void {
    this.geofenceListeners.push(listener);
  }

  removeGeofenceListener(listener: GeofenceListener): void {
    const index = this.geofenceListeners.indexOf(listener);
    if (index > -1) {
      this.geofenceListeners.splice(index, 1);
    }
  }

  addConnectListener(listener: ConnectionListener): void {
    this.connectListeners.push(listener);
  }

  removeConnectListener(listener: ConnectionListener): void {
    const index = this.connectListeners.indexOf(listener);
    if (index > -1) {
      this.connectListeners.splice(index, 1);
    }
  }

  addDisconnectListener(listener: ConnectionListener): void {
    this.disconnectListeners.push(listener);
  }

  removeDisconnectListener(listener: ConnectionListener): void {
    const index = this.disconnectListeners.indexOf(listener);
    if (index > -1) {
      this.disconnectListeners.splice(index, 1);
    }
  }

  addErrorListener(listener: ErrorListener): void {
    this.errorListeners.push(listener);
  }

  removeErrorListener(listener: ErrorListener): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  // Emit events to server
  updateTaskStatus(taskId: string, status: string): void {
    if (!this.socket?.connected) {
      console.warn('WebSocket not connected, cannot update task status');
      return;
    }

    this.socket.emit('update_task_status', {
      taskId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  updateLocation(latitude: number, longitude: number, accuracy?: number): void {
    if (!this.socket?.connected || !this.currentUserId) {
      console.warn('WebSocket not connected or user not identified, cannot update location');
      return;
    }

    this.socket.emit('location_update', {
      userId: this.currentUserId,
      latitude,
      longitude,
      accuracy,
      timestamp: new Date().toISOString(),
    });
  }

  sendNotification(userId: string, notification: Omit<NotificationEvent, 'id' | 'userId' | 'createdAt'>): void {
    if (!this.socket?.connected) {
      console.warn('WebSocket not connected, cannot send notification');
      return;
    }

    this.socket.emit('send_notification', {
      ...notification,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  updateUserStatus(status: 'online' | 'offline' | 'busy'): void {
    if (!this.socket?.connected || !this.currentUserId) {
      console.warn('WebSocket not connected or user not identified, cannot update status');
      return;
    }

    this.socket.emit('user_status_update', {
      userId: this.currentUserId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  joinTeamRoom(teamId: string): void {
    if (!this.socket?.connected) {
      console.warn('WebSocket not connected, cannot join team room');
      return;
    }

    this.socket.emit('join_team_room', teamId);
  }

  leaveTeamRoom(teamId: string): void {
    if (!this.socket?.connected) {
      console.warn('WebSocket not connected, cannot leave team room');
      return;
    }

    this.socket.emit('leave_team_room', teamId);
  }

  // Notification methods
  private notifyTaskUpdateListeners(event: TaskUpdateEvent): void {
    this.taskUpdateListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in task update listener:', error);
      }
    });
  }

  private notifyLocationUpdateListeners(event: LocationUpdateEvent): void {
    this.locationUpdateListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in location update listener:', error);
      }
    });
  }

  private notifyNotificationListeners(event: NotificationEvent): void {
    this.notificationListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  private notifyUserStatusListeners(event: UserStatusEvent): void {
    this.userStatusListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in user status listener:', error);
      }
    });
  }

  private notifyGeofenceListeners(event: GeofenceEvent): void {
    this.geofenceListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in geofence listener:', error);
      }
    });
  }

  private notifyConnectListeners(): void {
    this.connectListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in connect listener:', error);
      }
    });
  }

  private notifyDisconnectListeners(): void {
    this.disconnectListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in disconnect listener:', error);
      }
    });
  }

  private notifyErrorListeners(error: any): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }

  // Cleanup method
  cleanup(): void {
    this.taskUpdateListeners = [];
    this.locationUpdateListeners = [];
    this.notificationListeners = [];
    this.userStatusListeners = [];
    this.geofenceListeners = [];
    this.connectListeners = [];
    this.disconnectListeners = [];
    this.errorListeners = [];
    this.disconnect();
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;