import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Validation schemas
const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().allow(null, ''),
  role: Joi.string().valid('ADMIN', 'SUPERVISOR', 'TEAM_MEMBER').optional(),
  isActive: Joi.boolean().optional(),
  profileImage: Joi.string().uri().optional().allow(null, ''),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(128).required(),
});

const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().allow(null, ''),
  role: Joi.string().valid('ADMIN', 'SUPERVISOR', 'TEAM_MEMBER').default('TEAM_MEMBER'),
  isActive: Joi.boolean().default(true),
});

const getUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  role: Joi.string().valid('ADMIN', 'SUPERVISOR', 'TEAM_MEMBER').optional(),
  isActive: Joi.boolean().optional(),
  search: Joi.string().min(1).max(100).optional(),
  sortBy: Joi.string().valid('name', 'email', 'role', 'createdAt', 'lastLoginAt').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
});

export class UserController {

  // Get all users with filtering and pagination
  static async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const { error, value } = getUsersSchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      const { page, limit, role, isActive, search, sortBy, sortOrder } = value;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};
      
      if (role) {
        where.role = role;
      }
      
      if (isActive !== undefined) {
        where.isActive = isActive;
      }
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Get total count for pagination
      const total = await prisma.user.count({ where });

      // Get users
      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          profileImage: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          // Include team memberships
          teamMemberships: {
            select: {
              id: true,
              joinedAt: true,
              team: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                },
              },
            },
          },
          // Include tasks assigned to user
          assignedTasks: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              dueDate: true,
            },
            where: {
              status: {
                notIn: ['COMPLETED', 'CANCELLED'],
              },
            },
            take: 5,
            orderBy: {
              dueDate: 'asc',
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      });

      // Calculate statistics for each user
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const [taskStats, teamCount] = await Promise.all([
            prisma.task.groupBy({
              by: ['status'],
              where: { assignedToId: user.id },
              _count: { status: true },
            }),
            prisma.teamMember.count({
              where: { userId: user.id },
            }),
          ]);

          const stats = taskStats.reduce((acc, stat) => {
            acc[stat.status.toLowerCase()] = stat._count.status;
            return acc;
          }, {} as Record<string, number>);

          return {
            ...user,
            statistics: {
              totalTasks: Object.values(stats).reduce((sum, count) => sum + count, 0),
              completedTasks: stats.completed || 0,
              activeTasks: (stats.pending || 0) + (stats.in_progress || 0) + (stats.review || 0),
              overdueTasks: await prisma.task.count({
                where: {
                  assignedToId: user.id,
                  status: { notIn: ['COMPLETED', 'CANCELLED'] },
                  dueDate: { lt: new Date() },
                },
              }),
              teamCount,
            },
          };
        })
      );

      res.json({
        success: true,
        data: {
          users: usersWithStats,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Get user by ID
  static async getUserById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
      }

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          profileImage: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          teamMemberships: {
            select: {
              id: true,
              joinedAt: true,
              team: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  status: true,
                  memberCount: true,
                },
              },
            },
          },
          assignedTasks: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              priority: true,
              dueDate: true,
              createdAt: true,
              team: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          },
          ledTeams: {
            select: {
              id: true,
              name: true,
              description: true,
              status: true,
              memberCount: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Get user statistics
      const [taskStats, locationHistory] = await Promise.all([
        prisma.task.groupBy({
          by: ['status'],
          where: { assignedToId: id },
          _count: { status: true },
        }),
        prisma.userLocation.findMany({
          where: { userId: id },
          orderBy: { timestamp: 'desc' },
          take: 10,
          select: {
            latitude: true,
            longitude: true,
            accuracy: true,
            timestamp: true,
          },
        }),
      ]);

      const stats = taskStats.reduce((acc, stat) => {
        acc[stat.status.toLowerCase()] = stat._count.status;
        return acc;
      }, {} as Record<string, number>);

      const userWithStats = {
        ...user,
        statistics: {
          totalTasks: Object.values(stats).reduce((sum, count) => sum + count, 0),
          completedTasks: stats.completed || 0,
          activeTasks: (stats.pending || 0) + (stats.in_progress || 0) + (stats.review || 0),
          overdueTasks: await prisma.task.count({
            where: {
              assignedToId: id,
              status: { notIn: ['COMPLETED', 'CANCELLED'] },
              dueDate: { lt: new Date() },
            },
          }),
          teamCount: user.teamMemberships.length,
          teamsLed: user.ledTeams.length,
        },
        locationHistory,
      };

      res.json({
        success: true,
        data: { user: userWithStats },
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Create new user (Admin only)
  static async createUser(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if user is admin
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Admin role required.',
        });
      }

      const { error, value } = createUserSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      const { name, email, password, phone, role, isActive } = value;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone,
          role,
          isActive,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      res.status(201).json({
        success: true,
        data: { user: newUser },
        message: 'User created successfully',
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Update user
  static async updateUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const currentUser = req.user;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
      }

      // Check permissions
      if (currentUser?.role !== 'ADMIN' && currentUser?.id !== id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only update your own profile or be an admin.',
        });
      }

      const { error, value } = updateUserSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      const { name, email, phone, role, isActive, profileImage } = value;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Check email uniqueness if email is being updated
      if (email && email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email },
        });

        if (emailExists) {
          return res.status(409).json({
            success: false,
            error: 'User with this email already exists',
          });
        }
      }

      // Prevent non-admins from changing role or isActive
      const updateData: any = { name, email, phone, profileImage };
      if (currentUser?.role === 'ADMIN') {
        if (role !== undefined) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          profileImage: true,
          updatedAt: true,
        },
      });

      res.json({
        success: true,
        data: { user: updatedUser },
        message: 'User updated successfully',
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Delete user (Admin only)
  static async deleteUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const currentUser = req.user;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
      }

      // Check if user is admin
      if (currentUser?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Admin role required.',
        });
      }

      // Prevent admin from deleting themselves
      if (currentUser.id === id) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete your own account',
        });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Check if user has assigned tasks
      const assignedTasks = await prisma.task.count({
        where: {
          assignedToId: id,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      });

      if (assignedTasks > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete user with active assigned tasks. Please reassign tasks first.',
        });
      }

      // Check if user is leading any teams
      const ledTeams = await prisma.team.count({
        where: { leaderId: id },
      });

      if (ledTeams > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete user who is leading teams. Please assign new team leaders first.',
        });
      }

      // Delete user (this will cascade delete team memberships, user locations, etc.)
      await prisma.user.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Change password
  static async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const currentUser = req.user;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
      }

      // Check permissions
      if (currentUser?.role !== 'ADMIN' && currentUser?.id !== id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only change your own password or be an admin.',
        });
      }

      const { error, value } = changePasswordSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      const { currentPassword, newPassword } = value;

      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          password: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Verify current password (only if not admin)
      if (currentUser?.role !== 'ADMIN' || currentUser?.id === id) {
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
          return res.status(400).json({
            success: false,
            error: 'Current password is incorrect',
          });
        }
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id },
        data: { password: hashedNewPassword },
      });

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Get user statistics
  static async getUserStatistics(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Get comprehensive statistics
      const [
        taskStats,
        teamMemberships,
        recentActivity,
        locationStats
      ] = await Promise.all([
        // Task statistics
        prisma.task.groupBy({
          by: ['status', 'priority'],
          where: { assignedToId: id },
          _count: { status: true },
        }),
        // Team memberships
        prisma.teamMember.findMany({
          where: { userId: id },
          select: {
            joinedAt: true,
            team: {
              select: {
                id: true,
                name: true,
                status: true,
                memberCount: true,
              },
            },
          },
        }),
        // Recent activity (last 30 days)
        prisma.task.findMany({
          where: {
            assignedToId: id,
            updatedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          select: {
            id: true,
            title: true,
            status: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
          take: 10,
        }),
        // Location statistics
        prisma.userLocation.findMany({
          where: { userId: id },
          orderBy: { timestamp: 'desc' },
          take: 1,
          select: {
            latitude: true,
            longitude: true,
            accuracy: true,
            timestamp: true,
          },
        }),
      ]);

      // Process task statistics
      const processedTaskStats = taskStats.reduce((acc, stat) => {
        if (!acc[stat.status]) acc[stat.status] = {};
        acc[stat.status][stat.priority] = stat._count.status;
        return acc;
      }, {} as Record<string, Record<string, number>>);

      // Calculate totals
      const totalTasks = taskStats.reduce((sum, stat) => sum + stat._count.status, 0);
      const completedTasks = processedTaskStats.COMPLETED ? 
        Object.values(processedTaskStats.COMPLETED).reduce((sum, count) => sum + count, 0) : 0;

      const statistics = {
        user,
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          active: totalTasks - completedTasks,
          byStatus: processedTaskStats,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        },
        teams: {
          total: teamMemberships.length,
          active: teamMemberships.filter(tm => tm.team.status === 'ACTIVE').length,
          memberships: teamMemberships,
        },
        activity: {
          recent: recentActivity,
          lastLocation: locationStats[0] || null,
        },
      };

      res.json({
        success: true,
        data: { statistics },
      });
    } catch (error) {
      console.error('Get user statistics error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}

export default UserController;