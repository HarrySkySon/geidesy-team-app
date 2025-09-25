import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { teamsService } from '../services/teams.service';

interface AuthenticatedSocket extends Socket {
  userId: string;
  userRole: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp?: string;
}

interface TeamLocationUpdate extends LocationData {
  teamId: string;
}

export const setupLocationHandlers = (io: SocketIOServer, socket: AuthenticatedSocket) => {
  
  // Handle location updates from team members
  socket.on('location:update', async (data: LocationData) => {
    try {
      // Validate location data
      if (!data.latitude || !data.longitude) {
        socket.emit('error', { message: 'Latitude and longitude are required' });
        return;
      }

      if (data.latitude < -90 || data.latitude > 90) {
        socket.emit('error', { message: 'Invalid latitude value' });
        return;
      }

      if (data.longitude < -180 || data.longitude > 180) {
        socket.emit('error', { message: 'Invalid longitude value' });
        return;
      }

      logger.info(`Location update from user ${socket.userId}:`, {
        userId: socket.userId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy
      });

      // TODO: Get user's team(s) and update team location
      // For now, we'll broadcast to supervisors
      
      const locationUpdate = {
        userId: socket.userId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        altitude: data.altitude,
        heading: data.heading,
        speed: data.speed,
        timestamp: data.timestamp || new Date().toISOString()
      };

      // Broadcast to supervisors and admins
      socket.to('supervisors').emit('location:user:updated', locationUpdate);

      // If user is part of a team, broadcast to team members
      // TODO: Implement team membership check and broadcast to team

      // Acknowledge the location update
      socket.emit('location:update:ack', {
        status: 'updated',
        timestamp: locationUpdate.timestamp
      });

    } catch (error) {
      logger.error('Error handling location update:', error);
      socket.emit('error', { message: 'Failed to update location' });
    }
  });

  // Handle team location updates (for team leaders or supervisors)
  socket.on('location:team:update', async (data: TeamLocationUpdate) => {
    try {
      // Validate team location data
      if (!data.teamId || !data.latitude || !data.longitude) {
        socket.emit('error', { message: 'Team ID, latitude and longitude are required' });
        return;
      }

      // Check if user has permission to update team location
      if (socket.userRole === 'TEAM_MEMBER') {
        // TODO: Verify user is a member of this team
        // const isTeamMember = await checkTeamMembership(socket.userId, data.teamId);
        // if (!isTeamMember) {
        //   socket.emit('error', { message: 'Access denied' });
        //   return;
        // }
      }

      logger.info(`Team location update from user ${socket.userId}:`, {
        teamId: data.teamId,
        latitude: data.latitude,
        longitude: data.longitude
      });

      // Store team location in database
      try {
        await teamsService.updateTeamLocation(data.teamId, {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy
        });
      } catch (dbError) {
        logger.error('Error storing team location:', dbError);
        // Continue with broadcasting even if storage fails
      }

      const teamLocationUpdate = {
        teamId: data.teamId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        updatedBy: socket.userId,
        timestamp: new Date().toISOString()
      };

      // Broadcast to supervisors
      socket.to('supervisors').emit('location:team:updated', teamLocationUpdate);

      // Broadcast to team members
      socket.to(`team_${data.teamId}`).emit('location:team:updated', teamLocationUpdate);

      // Acknowledge the update
      socket.emit('location:team:update:ack', {
        teamId: data.teamId,
        status: 'updated',
        timestamp: teamLocationUpdate.timestamp
      });

    } catch (error) {
      logger.error('Error handling team location update:', error);
      socket.emit('error', { message: 'Failed to update team location' });
    }
  });

  // Handle location sharing requests
  socket.on('location:share:request', (data: { targetUserId: string; message?: string }) => {
    try {
      logger.info(`Location sharing request from ${socket.userId} to ${data.targetUserId}`);

      // Send location sharing request to target user
      socket.to(`user_${data.targetUserId}`).emit('location:share:requested', {
        fromUserId: socket.userId,
        message: data.message || 'Someone is requesting your location',
        timestamp: new Date().toISOString()
      });

      // Acknowledge the request
      socket.emit('location:share:request:ack', {
        targetUserId: data.targetUserId,
        status: 'sent'
      });

    } catch (error) {
      logger.error('Error handling location share request:', error);
      socket.emit('error', { message: 'Failed to send location share request' });
    }
  });

  // Handle location sharing responses
  socket.on('location:share:response', (data: {
    requesterId: string;
    accepted: boolean;
    location?: LocationData;
  }) => {
    try {
      logger.info(`Location sharing response from ${socket.userId}:`, {
        requesterId: data.requesterId,
        accepted: data.accepted
      });

      if (data.accepted && data.location) {
        // Share location with requester
        socket.to(`user_${data.requesterId}`).emit('location:shared', {
          fromUserId: socket.userId,
          location: data.location,
          timestamp: new Date().toISOString()
        });
      } else {
        // Notify requester that location sharing was denied
        socket.to(`user_${data.requesterId}`).emit('location:share:denied', {
          fromUserId: socket.userId,
          timestamp: new Date().toISOString()
        });
      }

      // Acknowledge the response
      socket.emit('location:share:response:ack', {
        requesterId: data.requesterId,
        status: data.accepted ? 'shared' : 'denied'
      });

    } catch (error) {
      logger.error('Error handling location share response:', error);
      socket.emit('error', { message: 'Failed to respond to location share request' });
    }
  });

  // Handle geofence events
  socket.on('location:geofence:enter', (data: {
    geofenceId: string;
    geofenceName: string;
    location: LocationData;
  }) => {
    try {
      logger.info(`Geofence enter event from user ${socket.userId}:`, data);

      // Broadcast to supervisors
      socket.to('supervisors').emit('location:geofence:entered', {
        userId: socket.userId,
        geofenceId: data.geofenceId,
        geofenceName: data.geofenceName,
        location: data.location,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error handling geofence enter event:', error);
    }
  });

  socket.on('location:geofence:exit', (data: {
    geofenceId: string;
    geofenceName: string;
    location: LocationData;
  }) => {
    try {
      logger.info(`Geofence exit event from user ${socket.userId}:`, data);

      // Broadcast to supervisors
      socket.to('supervisors').emit('location:geofence:exited', {
        userId: socket.userId,
        geofenceId: data.geofenceId,
        geofenceName: data.geofenceName,
        location: data.location,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error handling geofence exit event:', error);
    }
  });

  // Handle emergency location broadcasts
  socket.on('location:emergency', (data: {
    location: LocationData;
    message?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }) => {
    try {
      logger.warn(`Emergency location broadcast from user ${socket.userId}:`, data);

      const emergencyData = {
        userId: socket.userId,
        location: data.location,
        message: data.message || 'Emergency situation reported',
        severity: data.severity,
        timestamp: new Date().toISOString()
      };

      // Broadcast to all supervisors and admins immediately
      socket.to('supervisors').emit('location:emergency:alert', emergencyData);

      // Also broadcast to team members if in a team
      // TODO: Get user's team and broadcast to team members

      // Acknowledge emergency broadcast
      socket.emit('location:emergency:ack', {
        status: 'broadcasted',
        timestamp: emergencyData.timestamp
      });

    } catch (error) {
      logger.error('Error handling emergency location broadcast:', error);
      socket.emit('error', { message: 'Failed to broadcast emergency location' });
    }
  });

  // Handle location tracking start/stop
  socket.on('location:tracking:start', (data: { teamId?: string; interval?: number }) => {
    try {
      logger.info(`Location tracking started by user ${socket.userId}`, data);

      // TODO: Store tracking preferences
      
      socket.emit('location:tracking:started', {
        status: 'started',
        interval: data.interval || 30000, // Default 30 seconds
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error starting location tracking:', error);
      socket.emit('error', { message: 'Failed to start location tracking' });
    }
  });

  socket.on('location:tracking:stop', () => {
    try {
      logger.info(`Location tracking stopped by user ${socket.userId}`);

      // TODO: Clear tracking preferences

      socket.emit('location:tracking:stopped', {
        status: 'stopped',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error stopping location tracking:', error);
      socket.emit('error', { message: 'Failed to stop location tracking' });
    }
  });
};