import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { setupTaskHandlers } from './task.handlers';
import { setupLocationHandlers } from './location.handlers';

interface AuthenticatedSocket extends Socket {
  userId: string;
  userRole: string;
}

export const initializeWebSocket = (io: SocketIOServer) => {
  // Authentication middleware for WebSocket
  io.use((socket: any, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User connected: ${socket.userId} (${socket.userRole})`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Join user to role-based rooms
    if (socket.userRole === 'SUPERVISOR' || socket.userRole === 'ADMIN') {
      socket.join('supervisors');
      logger.info(`User ${socket.userId} joined supervisors room`);
    }

    // TODO: Join user to their team rooms
    // if (socket.userRole === 'TEAM_MEMBER') {
    //   const userTeams = await getUserTeams(socket.userId);
    //   userTeams.forEach(teamId => {
    //     socket.join(`team_${teamId}`);
    //   });
    // }

    // Setup specialized handlers
    setupTaskHandlers(io, socket);
    setupLocationHandlers(io, socket);

    // Handle general notifications
    socket.on('notification:read', (data: { notificationId: string }) => {
      logger.info(`Notification read by user ${socket.userId}:`, data);
      
      // TODO: Mark notification as read in database
      
      socket.emit('notification:read:ack', {
        notificationId: data.notificationId,
        status: 'read'
      });
    });

    // Handle user status updates
    socket.on('user:status:update', (data: { status: 'online' | 'offline' | 'busy' | 'away' }) => {
      logger.info(`User status update from ${socket.userId}:`, data);

      // Broadcast to supervisors and team members
      socket.to('supervisors').emit('user:status:updated', {
        userId: socket.userId,
        status: data.status,
        timestamp: new Date().toISOString()
      });

      // TODO: Broadcast to team members
    });

    // Handle team room joining
    socket.on('team:join', (data: { teamId: string }) => {
      socket.join(`team_${data.teamId}`);
      logger.info(`User ${socket.userId} joined team room: team_${data.teamId}`);
      
      socket.emit('team:joined', {
        teamId: data.teamId,
        status: 'joined'
      });
    });

    // Handle team room leaving
    socket.on('team:leave', (data: { teamId: string }) => {
      socket.leave(`team_${data.teamId}`);
      logger.info(`User ${socket.userId} left team room: team_${data.teamId}`);
      
      socket.emit('team:left', {
        teamId: data.teamId,
        status: 'left'
      });
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${socket.userId}, reason: ${reason}`);
      
      // Broadcast user offline status
      socket.to('supervisors').emit('user:status:updated', {
        userId: socket.userId,
        status: 'offline',
        timestamp: new Date().toISOString()
      });
    });

    // Handle errors
    socket.on('error', (error: any) => {
      logger.error(`WebSocket error for user ${socket.userId}:`, error);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to Surveying Team Management System',
      userId: socket.userId,
      role: socket.userRole,
      timestamp: new Date().toISOString()
    });
  });

  // Helper functions for broadcasting
  const broadcastToUser = (userId: string, event: string, data: any) => {
    io.to(`user_${userId}`).emit(event, data);
    logger.info(`Broadcasting to user ${userId}:`, { event, data });
  };

  const broadcastToTeam = (teamId: string, event: string, data: any) => {
    io.to(`team_${teamId}`).emit(event, data);
    logger.info(`Broadcasting to team ${teamId}:`, { event, data });
  };

  const broadcastToSupervisors = (event: string, data: any) => {
    io.to('supervisors').emit(event, data);
    logger.info(`Broadcasting to supervisors:`, { event, data });
  };

  const broadcastToAll = (event: string, data: any) => {
    io.emit(event, data);
    logger.info(`Broadcasting to all users:`, { event, data });
  };

  // Connection statistics
  const getConnectionStats = () => {
    const sockets = io.sockets.sockets;
    const connectedUsers = Array.from(sockets.values()).map((socket: any) => ({
      userId: socket.userId,
      userRole: socket.userRole,
      connectedAt: socket.handshake.time
    }));

    return {
      totalConnections: sockets.size,
      connectedUsers,
      supervisorCount: connectedUsers.filter(u => u.userRole === 'SUPERVISOR' || u.userRole === 'ADMIN').length,
      teamMemberCount: connectedUsers.filter(u => u.userRole === 'TEAM_MEMBER').length
    };
  };

  return {
    broadcastToUser,
    broadcastToTeam,
    broadcastToSupervisors,
    broadcastToAll,
    getConnectionStats
  };
};