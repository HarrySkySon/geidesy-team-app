import { Request, Response } from 'express';
import Joi from 'joi';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { tasksService } from '../services/tasks.service';
import { createError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// Validation schemas
const createTaskSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().max(1000).optional(),
  siteId: Joi.string().required(),
  teamId: Joi.string().optional(),
  priority: Joi.string().valid(...Object.values(TaskPriority)).required(),
  scheduledDate: Joi.date().optional(),
  estimatedDuration: Joi.number().min(1).max(2880).optional() // max 48 hours in minutes
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(3).max(255).optional(),
  description: Joi.string().max(1000).optional(),
  teamId: Joi.string().optional(),
  priority: Joi.string().valid(...Object.values(TaskPriority)).optional(),
  status: Joi.string().valid(...Object.values(TaskStatus)).optional(),
  scheduledDate: Joi.date().optional(),
  estimatedDuration: Joi.number().min(1).max(2880).optional(),
  actualDuration: Joi.number().min(1).max(2880).optional()
});

const taskFiltersSchema = Joi.object({
  status: Joi.string().valid(...Object.values(TaskStatus)).optional(),
  priority: Joi.string().valid(...Object.values(TaskPriority)).optional(),
  teamId: Joi.string().optional(),
  createdById: Joi.string().optional(),
  scheduledDateFrom: Joi.date().optional(),
  scheduledDateTo: Joi.date().optional(),
  search: Joi.string().max(100).optional(),
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional(),
  orderBy: Joi.string().valid('createdAt', 'scheduledDate', 'priority', 'status').optional(),
  orderDirection: Joi.string().valid('asc', 'desc').optional()
});

const locationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  radius: Joi.number().min(0.1).max(100).optional()
});

const createReportSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().max(1000).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional()
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(TaskStatus)).required(),
  actualDuration: Joi.number().min(1).max(2880).optional()
});

export class TaskController {
  async createTask(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    // Validate request
    const { error, value } = createTaskSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const taskData = {
      ...value,
      createdById: req.user.id
    };

    const task = await tasksService.createTask(taskData);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task }
    });
  }

  async getAllTasks(req: AuthenticatedRequest, res: Response) {
    // Validate query parameters
    const { error, value } = taskFiltersSchema.validate(req.query);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const { page, limit, orderBy, orderDirection, ...filters } = value;
    
    const pagination = {
      page,
      limit,
      orderBy,
      orderDirection
    };

    // If user is team member, filter tasks assigned to their teams
    if (req.user?.role === 'TEAM_MEMBER') {
      // TODO: Get user's team IDs and filter tasks
      // For now, we'll show all tasks
    }

    const result = await tasksService.getAllTasks(filters, pagination);

    res.json({
      success: true,
      data: result
    });
  }

  async getTaskById(req: Request, res: Response) {
    const { id } = req.params;

    if (!id) {
      throw createError('Task ID is required', 400);
    }

    const task = await tasksService.getTaskById(id);

    res.json({
      success: true,
      data: { task }
    });
  }

  async updateTask(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;

    if (!id) {
      throw createError('Task ID is required', 400);
    }

    // Validate request
    const { error, value } = updateTaskSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    // TODO: Add authorization check - only supervisors, admins, or assigned team members can update

    const task = await tasksService.updateTask(id, value);

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: { task }
    });
  }

  async deleteTask(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;

    if (!id) {
      throw createError('Task ID is required', 400);
    }

    // TODO: Add authorization check - only supervisors and admins can delete

    const result = await tasksService.deleteTask(id);

    res.json({
      success: true,
      message: result.message
    });
  }

  async updateTaskStatus(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;

    if (!id) {
      throw createError('Task ID is required', 400);
    }

    // Validate request
    const { error, value } = updateStatusSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const task = await tasksService.updateTask(id, {
      status: value.status,
      actualDuration: value.actualDuration
    });

    res.json({
      success: true,
      message: 'Task status updated successfully',
      data: { task }
    });
  }

  async getTasksByTeam(req: Request, res: Response) {
    const { teamId } = req.params;

    if (!teamId) {
      throw createError('Team ID is required', 400);
    }

    // Parse query filters
    const filters: any = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.priority) filters.priority = req.query.priority;

    const tasks = await tasksService.getTasksByTeam(teamId, filters);

    res.json({
      success: true,
      data: { tasks }
    });
  }

  async getTasksNearLocation(req: Request, res: Response) {
    // Validate request
    const { error, value } = locationSchema.validate(req.query);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const { latitude, longitude, radius = 10 } = value;

    const tasks = await tasksService.getTasksNearLocation(latitude, longitude, radius);

    res.json({
      success: true,
      data: { tasks }
    });
  }

  async getTaskLocation(req: Request, res: Response) {
    const { id } = req.params;

    if (!id) {
      throw createError('Task ID is required', 400);
    }

    const task = await tasksService.getTaskById(id);

    res.json({
      success: true,
      data: {
        taskId: task.id,
        location: {
          latitude: task.site.latitude,
          longitude: task.site.longitude,
          address: task.site.address,
          name: task.site.name
        }
      }
    });
  }

  async createTaskReport(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;

    if (!id) {
      throw createError('Task ID is required', 400);
    }

    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    // Validate request
    const { error, value } = createReportSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    // Import Prisma client
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id }
    });

    if (!task) {
      throw createError('Task not found', 404);
    }

    // Create report
    const report = await prisma.taskReport.create({
      data: {
        taskId: id,
        userId: req.user.id,
        title: value.title,
        description: value.description,
        latitude: value.latitude,
        longitude: value.longitude
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Task report created successfully',
      data: { report }
    });
  }

  async getTaskStatistics(req: AuthenticatedRequest, res: Response) {
    // Parse optional filters
    const filters: any = {};
    if (req.query.teamId) filters.teamId = req.query.teamId as string;
    if (req.query.createdById) filters.createdById = req.query.createdById as string;
    if (req.query.status) filters.status = req.query.status;

    const statistics = await tasksService.getTaskStatistics(filters);

    res.json({
      success: true,
      data: { statistics }
    });
  }
}

export const taskController = new TaskController();