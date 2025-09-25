import { useState, useCallback, useEffect } from 'react';
import { NotificationEvent } from '@services/websocket.service';
import { useWebSocket } from './useWebSocket';

export interface NotificationState {
  notifications: NotificationEvent[];
  unreadCount: number;
}

export const useNotifications = () => {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
  });

  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());

  // Handle incoming notifications from WebSocket
  const handleNotification = useCallback((notification: NotificationEvent) => {
    setState(prevState => ({
      notifications: [notification, ...prevState.notifications].slice(0, 50), // Keep only last 50
      unreadCount: prevState.unreadCount + 1,
    }));

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  }, []);

  // Set up WebSocket listener
  const { sendNotification } = useWebSocket({
    onNotification: handleNotification,
  });

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    if (!readNotifications.has(notificationId)) {
      setReadNotifications(prev => new Set([...prev, notificationId]));
      setState(prevState => ({
        ...prevState,
        unreadCount: Math.max(0, prevState.unreadCount - 1),
      }));
    }
  }, [readNotifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    const unreadIds = state.notifications
      .filter(n => !readNotifications.has(n.id))
      .map(n => n.id);
    
    setReadNotifications(prev => new Set([...prev, ...unreadIds]));
    setState(prevState => ({
      ...prevState,
      unreadCount: 0,
    }));
  }, [state.notifications, readNotifications]);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setState({
      notifications: [],
      unreadCount: 0,
    });
    setReadNotifications(new Set());
  }, []);

  // Get notifications with read status
  const getNotificationsWithReadStatus = useCallback(() => {
    return state.notifications.map(notification => ({
      ...notification,
      isRead: readNotifications.has(notification.id),
    }));
  }, [state.notifications, readNotifications]);

  // Remove specific notification
  const removeNotification = useCallback((notificationId: string) => {
    setState(prevState => {
      const wasUnread = !readNotifications.has(notificationId);
      return {
        notifications: prevState.notifications.filter(n => n.id !== notificationId),
        unreadCount: wasUnread ? Math.max(0, prevState.unreadCount - 1) : prevState.unreadCount,
      };
    });
    setReadNotifications(prev => {
      const newSet = new Set(prev);
      newSet.delete(notificationId);
      return newSet;
    });
  }, [readNotifications]);

  return {
    // State
    notifications: getNotificationsWithReadStatus(),
    unreadCount: state.unreadCount,
    
    // Actions
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification,
    sendNotification,
  };
};

export default useNotifications;