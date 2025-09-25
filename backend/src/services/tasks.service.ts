import { PrismaClient, TaskStatus, TaskPriority } from '@prisma/client';
import { createError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

interface CreateTaskData {
  title: string;
  description?: string;
  siteId: string;
  teamId?: string;
  priority: TaskPriority;
  scheduledDate?: Date;
  estimatedDuration?: number;
  createdById: string;
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  teamId?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  scheduledDate?: Date;
  estimatedDuration?: number;
  actualDuration?: number;
}

interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  teamId?: string;
  createdById?: string;
  scheduledDateFrom?: Date;
  scheduledDateTo?: Date;
  search?: string;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export class TasksService {
  async createTask(data: CreateTaskData) {
    // Verify site exists
    const site = await prisma.site.findUnique({
      where: { id: data.siteId }
    });

    if (!site) {
      throw createError('Site not found', 404);
    }

    // Verify team exists if provided
    if (data.teamId) {
      const team = await prisma.team.findUnique({
        where: { id: data.teamId }
      });

      if (!team) {
        throw createError('Team not found', 404);
      }
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        siteId: data.siteId,
        teamId: data.teamId,
        priority: data.priority,
        scheduledDate: data.scheduledDate,
        estimatedDuration: data.estimatedDuration,
        createdById: data.createdById
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            leaderId: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return task;
  }

  async getAllTasks(filters: TaskFilters = {}, pagination: PaginationOptions = {}) {
    const {
      page = 1,
      limit = 10,
      orderBy = 'createdAt',
      orderDirection = 'desc'
    } = pagination;

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.priority) {
      whereClause.priority = filters.priority;
    }

    if (filters.teamId) {
      whereClause.teamId = filters.teamId;
    }

    if (filters.createdById) {
      whereClause.createdById = filters.createdById;
    }

    if (filters.scheduledDateFrom && filters.scheduledDateTo) {
      whereClause.scheduledDate = {
        gte: filters.scheduledDateFrom,
        lte: filters.scheduledDateTo
      };
    }

    if (filters.search) {
      whereClause.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { site: { name: { contains: filters.search, mode: 'insensitive' } } }
      ];
    }

    // Get tasks with pagination
    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { [orderBy]: orderDirection },
        include: {
          site: {
            select: {
              id: true,
              name: true,
              address: true,
              latitude: true,
              longitude: true
            }
          },
          team: {
            select: {
              id: true,
              name: true,
              leaderId: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          reports: {
            select: {
              id: true,
              title: true,
              createdAt: true
            }
          }
        }
      }),
      prisma.task.count({ where: whereClause })
    ]);

    return {
      tasks,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    };
  }

  async getTaskById(id: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            description: true,
            clientInfo: true
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            leaderId: true,
            members: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true
                  }
                }
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reports: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            },
            attachments: true
          }
        },
        attachments: true
      }
    });

    if (!task) {
      throw createError('Task not found', 404);
    }

    return task;
  }

  async updateTask(id: string, data: UpdateTaskData) {
    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id }
    });

    if (!existingTask) {
      throw createError('Task not found', 404);
    }

    // Verify team exists if provided
    if (data.teamId) {
      const team = await prisma.team.findUnique({
        where: { id: data.teamId }
      });

      if (!team) {
        throw createError('Team not found', 404);
      }
    }

    // Set completion date if status is being changed to completed
    const updateData: any = { ...data };
    if (data.status === TaskStatus.COMPLETED && existingTask.status !== TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    // Update task
    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        site: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            leaderId: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return task;
  }

  async deleteTask(id: string) {
    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id }
    });

    if (!existingTask) {
      throw createError('Task not found', 404);
    }

    // Delete task (cascade will handle related records)
    await prisma.task.delete({
      where: { id }
    });

    return { message: 'Task deleted successfully' };
  }

  async getTasksByTeam(teamId: string, filters: TaskFilters = {}) {
    const whereClause = {
      teamId,
      ...filters
    };

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        site: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true
          }
        },
        reports: {
          select: {
            id: true,
            title: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        scheduledDate: 'asc'
      }
    });

    return tasks;
  }

  async getTasksNearLocation(latitude: number, longitude: number, radiusKm: number = 10) {
    // Using raw SQL for geospatial query with PostGIS
    const tasks = await prisma.$queryRaw`
      SELECT 
        t.*,
        s.name as site_name,
        s.address as site_address,
        s.latitude as site_latitude,
        s.longitude as site_longitude,
        ST_Distance(
          ST_GeomFromText(CONCAT('POINT(', s.longitude, ' ', s.latitude, ')'), 4326)::geography,
          ST_GeomFromText(CONCAT('POINT(', ${longitude}, ' ', ${latitude}, ')'), 4326)::geography
        ) / 1000 as distance_km
      FROM tasks t
      JOIN sites s ON t.site_id = s.id
      WHERE ST_DWithin(
        ST_GeomFromText(CONCAT('POINT(', s.longitude, ' ', s.latitude, ')'), 4326)::geography,
        ST_GeomFromText(CONCAT('POINT(', ${longitude}, ' ', ${latitude}, ')'), 4326)::geography,
        ${radiusKm * 1000}
      )
      ORDER BY distance_km ASC
    `;

    return tasks;
  }

  async getTaskStatistics(filters: TaskFilters = {}) {
    const whereClause = filters;

    const [
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      cancelledTasks,
      priorityStats,
      teamStats
    ] = await Promise.all([
      prisma.task.count({ where: whereClause }),
      prisma.task.count({ where: { ...whereClause, status: TaskStatus.PENDING } }),
      prisma.task.count({ where: { ...whereClause, status: TaskStatus.IN_PROGRESS } }),
      prisma.task.count({ where: { ...whereClause, status: TaskStatus.COMPLETED } }),
      prisma.task.count({ where: { ...whereClause, status: TaskStatus.CANCELLED } }),
      
      // Priority statistics
      prisma.task.groupBy({
        by: ['priority'],
        where: whereClause,
        _count: { priority: true }
      }),

      // Team statistics
      prisma.task.groupBy({
        by: ['teamId'],
        where: { ...whereClause, teamId: { not: null } },
        _count: { teamId: true },
        _avg: { actualDuration: true }
      })
    ]);

    return {
      overview: {
        total: totalTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks,
        completed: completedTasks,
        cancelled: cancelledTasks
      },
      byPriority: priorityStats.reduce((acc, stat) => {
        acc[stat.priority] = stat._count.priority;
        return acc;
      }, {} as Record<string, number>),
      byTeam: teamStats.map(stat => ({
        teamId: stat.teamId,
        taskCount: stat._count.teamId,
        avgDuration: stat._avg.actualDuration
      }))
    };
  }
}

export const tasksService = new TasksService();