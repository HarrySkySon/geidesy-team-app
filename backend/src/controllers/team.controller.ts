import { Request, Response } from 'express';
import Joi from 'joi';
import { TeamStatus } from '@prisma/client';
import { teamsService } from '../services/teams.service';
import { createError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// Validation schemas
const createTeamSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional(),
  leaderId: Joi.string().optional()
});

const updateTeamSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(500).optional(),
  status: Joi.string().valid(...Object.values(TeamStatus)).optional(),
  leaderId: Joi.string().optional()
});

const teamFiltersSchema = Joi.object({
  status: Joi.string().valid(...Object.values(TeamStatus)).optional(),
  search: Joi.string().max(100).optional()
});

const locationUpdateSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  accuracy: Joi.number().min(0).optional()
});

const addMemberSchema = Joi.object({
  userId: Joi.string().required()
});

export class TeamController {
  async createTeam(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    // Validate request
    const { error, value } = createTeamSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const team = await teamsService.createTeam(value);

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: { team }
    });
  }

  async getAllTeams(req: Request, res: Response) {
    // Validate query parameters
    const { error, value } = teamFiltersSchema.validate(req.query);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const teams = await teamsService.getAllTeams(value);

    res.json({
      success: true,
      data: { teams }
    });
  }

  async getTeamById(req: Request, res: Response) {
    const { id } = req.params;

    if (!id) {
      throw createError('Team ID is required', 400);
    }

    const team = await teamsService.getTeamById(id);

    res.json({
      success: true,
      data: { team }
    });
  }

  async updateTeam(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;

    if (!id) {
      throw createError('Team ID is required', 400);
    }

    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    // Validate request
    const { error, value } = updateTeamSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const team = await teamsService.updateTeam(id, value);

    res.json({
      success: true,
      message: 'Team updated successfully',
      data: { team }
    });
  }

  async deleteTeam(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;

    if (!id) {
      throw createError('Team ID is required', 400);
    }

    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const result = await teamsService.deleteTeam(id);

    res.json({
      success: true,
      message: result.message
    });
  }

  async getTeamMembers(req: Request, res: Response) {
    const { id } = req.params;

    if (!id) {
      throw createError('Team ID is required', 400);
    }

    const members = await teamsService.getTeamMembers(id);

    res.json({
      success: true,
      data: { members }
    });
  }

  async addTeamMember(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;

    if (!id) {
      throw createError('Team ID is required', 400);
    }

    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    // Validate request
    const { error, value } = addMemberSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const teamMember = await teamsService.addTeamMember(id, value.userId);

    res.status(201).json({
      success: true,
      message: 'Team member added successfully',
      data: { teamMember }
    });
  }

  async removeTeamMember(req: AuthenticatedRequest, res: Response) {
    const { id, userId } = req.params;

    if (!id || !userId) {
      throw createError('Team ID and User ID are required', 400);
    }

    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const result = await teamsService.removeTeamMember(id, userId);

    res.json({
      success: true,
      message: result.message
    });
  }

  async updateTeamLocation(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;

    if (!id) {
      throw createError('Team ID is required', 400);
    }

    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    // Validate request
    const { error, value } = locationUpdateSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    // Check if user is a member of this team
    const teamMembers = await teamsService.getTeamMembers(id);
    const isMember = teamMembers.some(member => member.userId === req.user!.id);

    if (!isMember && req.user.role !== 'SUPERVISOR' && req.user.role !== 'ADMIN') {
      throw createError('Access denied. You are not a member of this team.', 403);
    }

    const location = await teamsService.updateTeamLocation(id, value);

    res.json({
      success: true,
      message: 'Team location updated successfully',
      data: { location }
    });
  }

  async getTeamLocations(req: Request, res: Response) {
    const { id } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    if (!id) {
      throw createError('Team ID is required', 400);
    }

    if (limit > 100) {
      throw createError('Limit cannot exceed 100', 400);
    }

    const locations = await teamsService.getTeamLocations(id, limit);

    res.json({
      success: true,
      data: { locations }
    });
  }

  async getTeamStatistics(req: Request, res: Response) {
    const { id } = req.params;
    
    const statistics = await teamsService.getTeamStatistics(id);

    if (id && !statistics) {
      throw createError('Team not found', 404);
    }

    res.json({
      success: true,
      data: { statistics }
    });
  }

  async getAllTeamStatistics(req: Request, res: Response) {
    const statistics = await teamsService.getTeamStatistics();

    res.json({
      success: true,
      data: { statistics }
    });
  }

  async getMyTeams(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    // For team members, get teams they belong to
    if (req.user.role === 'TEAM_MEMBER') {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const userTeams = await prisma.teamMember.findMany({
        where: { userId: req.user.id },
        include: {
          team: {
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      phone: true,
                      role: true
                    }
                  }
                }
              },
              tasks: {
                select: {
                  id: true,
                  status: true
                }
              }
            }
          }
        }
      });

      const teams = userTeams.map(ut => ({
        ...ut.team,
        memberCount: ut.team.members.length,
        activeTasksCount: ut.team.tasks.filter(task => 
          task.status === 'PENDING' || task.status === 'IN_PROGRESS'
        ).length,
        completedTasksCount: ut.team.tasks.filter(task => 
          task.status === 'COMPLETED'
        ).length
      }));

      res.json({
        success: true,
        data: { teams }
      });
    } else {
      // For supervisors and admins, get all teams
      const teams = await teamsService.getAllTeams();
      
      res.json({
        success: true,
        data: { teams }
      });
    }
  }
}

export const teamController = new TeamController();