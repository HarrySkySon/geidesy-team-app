import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId: string;
  userRole: string;
}

interface TaskUpdateData {
  taskId: string;
  status?: string;
  actualDuration?: number;
  progress?: number;
  notes?: string;
}

interface TaskAssignmentData {
  taskId: string;
  teamId: string;
  assignedBy: string;
}

export const setupTaskHandlers = (io: SocketIOServer, socket: AuthenticatedSocket) => {
  
  // Handle task status updates from field teams
  socket.on('task:status:update', async (data: TaskUpdateData) => {
    try {
      logger.info(`Task status update from user ${socket.userId}:`, data);

      // Validate required fields
      if (!data.taskId) {
        socket.emit('error', { message: 'Task ID is required' });
        return;
      }

      // TODO: Validate user has permission to update this task
      // Check if user is assigned to the task's team

      // Broadcast to supervisors and other team members
      socket.to('supervisors').emit('task:status:updated', {
        taskId: data.taskId,
        status: data.status,
        actualDuration: data.actualDuration,
        progress: data.progress,
        notes: data.notes,
        updatedBy: socket.userId,
        updatedByName: 'Team Member', // TODO: Get actual user name
        timestamp: new Date().toISOString()
      });

      // Broadcast to team members of the same team
      // TODO: Get task team and broadcast to team room
      socket.to(`task_${data.taskId}`).emit('task:status:updated', {
        taskId: data.taskId,
        status: data.status,
        actualDuration: data.actualDuration,
        progress: data.progress,
        notes: data.notes,
        updatedBy: socket.userId,
        timestamp: new Date().toISOString()
      });

      // Acknowledge the update
      socket.emit('task:status:ack', {
        taskId: data.taskId,
        status: 'updated'
      });

    } catch (error) {
      logger.error('Error handling task status update:', error);
      socket.emit('error', { message: 'Failed to update task status' });
    }
  });

  // Handle task assignment by supervisors
  socket.on('task:assign', async (data: TaskAssignmentData) => {
    try {
      logger.info(`Task assignment from user ${socket.userId}:`, data);

      // Only supervisors and admins can assign tasks
      if (socket.userRole !== 'SUPERVISOR' && socket.userRole !== 'ADMIN') {
        socket.emit('error', { message: 'Permission denied' });
        return;
      }

      // Validate required fields
      if (!data.taskId || !data.teamId) {
        socket.emit('error', { message: 'Task ID and Team ID are required' });
        return;
      }

      // Broadcast to assigned team
      socket.to(`team_${data.teamId}`).emit('task:assigned', {
        taskId: data.taskId,
        teamId: data.teamId,
        assignedBy: data.assignedBy,
        message: 'New task has been assigned to your team',
        timestamp: new Date().toISOString()
      });

      // Broadcast to other supervisors
      socket.to('supervisors').emit('task:assignment:updated', {
        taskId: data.taskId,
        teamId: data.teamId,
        assignedBy: data.assignedBy,
        timestamp: new Date().toISOString()
      });

      // Acknowledge the assignment
      socket.emit('task:assign:ack', {
        taskId: data.taskId,
        teamId: data.teamId,
        status: 'assigned'
      });

    } catch (error) {
      logger.error('Error handling task assignment:', error);
      socket.emit('error', { message: 'Failed to assign task' });
    }
  });

  // Handle task completion notifications
  socket.on('task:complete', async (data: { taskId: string; reportId?: string }) => {
    try {
      logger.info(`Task completion from user ${socket.userId}:`, data);

      // Broadcast to supervisors
      socket.to('supervisors').emit('task:completed', {
        taskId: data.taskId,
        reportId: data.reportId,
        completedBy: socket.userId,
        message: 'Task has been completed',
        timestamp: new Date().toISOString()
      });

      // Broadcast to team members
      socket.to(`task_${data.taskId}`).emit('task:completed', {
        taskId: data.taskId,
        completedBy: socket.userId,
        timestamp: new Date().toISOString()
      });

      // Acknowledge completion
      socket.emit('task:complete:ack', {
        taskId: data.taskId,
        status: 'completed'
      });

    } catch (error) {
      logger.error('Error handling task completion:', error);
      socket.emit('error', { message: 'Failed to complete task' });
    }
  });

  // Handle task report submissions
  socket.on('task:report:submit', async (data: {
    taskId: string;
    reportId: string;
    title: string;
    attachmentCount?: number;
  }) => {
    try {
      logger.info(`Task report submission from user ${socket.userId}:`, data);

      // Broadcast to supervisors
      socket.to('supervisors').emit('task:report:submitted', {
        taskId: data.taskId,
        reportId: data.reportId,
        title: data.title,
        attachmentCount: data.attachmentCount || 0,
        submittedBy: socket.userId,
        message: 'New task report submitted',
        timestamp: new Date().toISOString()
      });

      // Acknowledge submission
      socket.emit('task:report:ack', {
        reportId: data.reportId,
        status: 'submitted'
      });

    } catch (error) {
      logger.error('Error handling task report submission:', error);
      socket.emit('error', { message: 'Failed to submit report' });
    }
  });

  // Handle task priority changes
  socket.on('task:priority:change', async (data: {
    taskId: string;
    priority: string;
    reason?: string;
  }) => {
    try {
      // Only supervisors and admins can change priority
      if (socket.userRole !== 'SUPERVISOR' && socket.userRole !== 'ADMIN') {
        socket.emit('error', { message: 'Permission denied' });
        return;
      }

      logger.info(`Task priority change from user ${socket.userId}:`, data);

      // Broadcast to all relevant parties
      io.emit('task:priority:changed', {
        taskId: data.taskId,
        priority: data.priority,
        reason: data.reason,
        changedBy: socket.userId,
        timestamp: new Date().toISOString()
      });

      // Acknowledge change
      socket.emit('task:priority:ack', {
        taskId: data.taskId,
        priority: data.priority,
        status: 'updated'
      });

    } catch (error) {
      logger.error('Error handling task priority change:', error);
      socket.emit('error', { message: 'Failed to change task priority' });
    }
  });

  // Handle task comments/notes
  socket.on('task:comment:add', async (data: {
    taskId: string;
    comment: string;
    isInternal?: boolean;
  }) => {
    try {
      logger.info(`Task comment from user ${socket.userId}:`, data);

      const commentData = {
        taskId: data.taskId,
        comment: data.comment,
        isInternal: data.isInternal || false,
        authorId: socket.userId,
        timestamp: new Date().toISOString()
      };

      if (data.isInternal) {
        // Internal comments only to supervisors and admins
        socket.to('supervisors').emit('task:comment:added', commentData);
      } else {
        // Public comments to everyone involved in the task
        socket.to(`task_${data.taskId}`).emit('task:comment:added', commentData);
        socket.to('supervisors').emit('task:comment:added', commentData);
      }

      // Acknowledge comment
      socket.emit('task:comment:ack', {
        taskId: data.taskId,
        status: 'added'
      });

    } catch (error) {
      logger.error('Error handling task comment:', error);
      socket.emit('error', { message: 'Failed to add comment' });
    }
  });

  // Handle joining task-specific room
  socket.on('task:join', (data: { taskId: string }) => {
    socket.join(`task_${data.taskId}`);
    logger.info(`User ${socket.userId} joined task room: task_${data.taskId}`);
  });

  // Handle leaving task-specific room
  socket.on('task:leave', (data: { taskId: string }) => {
    socket.leave(`task_${data.taskId}`);
    logger.info(`User ${socket.userId} left task room: task_${data.taskId}`);
  });
};