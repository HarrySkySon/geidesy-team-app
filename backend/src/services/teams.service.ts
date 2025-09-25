import { PrismaClient, TeamStatus } from '@prisma/client';
import { createError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

interface CreateTeamData {
  name: string;
  description?: string;
  leaderId?: string;
}

interface UpdateTeamData {
  name?: string;
  description?: string;
  status?: TeamStatus;
  leaderId?: string;
}

interface TeamLocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface TeamFilters {
  status?: TeamStatus;
  search?: string;
}

export class TeamsService {
  async createTeam(data: CreateTeamData) {
    // Verify leader exists if provided
    if (data.leaderId) {
      const leader = await prisma.user.findUnique({
        where: { id: data.leaderId }
      });

      if (!leader) {
        throw createError('Team leader not found', 404);
      }

      if (leader.role !== 'TEAM_MEMBER') {
        throw createError('Team leader must be a team member', 400);
      }
    }

    // Create team
    const team = await prisma.team.create({
      data: {
        name: data.name,
        description: data.description,
        leaderId: data.leaderId
      },
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
        }
      }
    });

    // Add leader as team member if specified
    if (data.leaderId) {
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: data.leaderId
        }
      });

      // Fetch team with updated members
      const updatedTeam = await this.getTeamById(team.id);
      return updatedTeam;
    }

    return team;
  }

  async getAllTeams(filters: TeamFilters = {}) {
    const whereClause: any = {};

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.search) {
      whereClause.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const teams = await prisma.team.findMany({
      where: whereClause,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Add computed fields
    const teamsWithStats = teams.map(team => ({
      ...team,
      memberCount: team.members.length,
      activeTasksCount: team.tasks.filter(task => 
        task.status === 'PENDING' || task.status === 'IN_PROGRESS'
      ).length,
      completedTasksCount: team.tasks.filter(task => 
        task.status === 'COMPLETED'
      ).length
    }));

    return teamsWithStats;
  }

  async getTeamById(id: string) {
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                profileImage: true,
                lastLoginAt: true
              }
            }
          },
          orderBy: {
            joinedAt: 'asc'
          }
        },
        tasks: {
          include: {
            site: {
              select: {
                id: true,
                name: true,
                address: true,
                latitude: true,
                longitude: true
              }
            }
          },
          orderBy: {
            scheduledDate: 'asc'
          }
        },
        locations: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 10 // Last 10 location updates
        }
      }
    });

    if (!team) {
      throw createError('Team not found', 404);
    }

    // Add computed fields
    const teamWithStats = {
      ...team,
      memberCount: team.members.length,
      activeTasksCount: team.tasks.filter(task => 
        task.status === 'PENDING' || task.status === 'IN_PROGRESS'
      ).length,
      completedTasksCount: team.tasks.filter(task => 
        task.status === 'COMPLETED'
      ).length,
      lastLocation: team.locations[0] || null
    };

    return teamWithStats;
  }

  async updateTeam(id: string, data: UpdateTeamData) {
    // Check if team exists
    const existingTeam = await prisma.team.findUnique({
      where: { id }
    });

    if (!existingTeam) {
      throw createError('Team not found', 404);
    }

    // Verify leader exists if provided
    if (data.leaderId) {
      const leader = await prisma.user.findUnique({
        where: { id: data.leaderId }
      });

      if (!leader) {
        throw createError('Team leader not found', 404);
      }

      if (leader.role !== 'TEAM_MEMBER') {
        throw createError('Team leader must be a team member', 400);
      }

      // Check if leader is already a team member
      const isTeamMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: id,
            userId: data.leaderId
          }
        }
      });

      if (!isTeamMember) {
        // Add leader as team member
        await prisma.teamMember.create({
          data: {
            teamId: id,
            userId: data.leaderId
          }
        });
      }
    }

    // Update team
    const team = await prisma.team.update({
      where: { id },
      data,
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
        }
      }
    });

    return team;
  }

  async deleteTeam(id: string) {
    // Check if team exists
    const existingTeam = await prisma.team.findUnique({
      where: { id },
      include: {
        tasks: {
          select: { id: true }
        }
      }
    });

    if (!existingTeam) {
      throw createError('Team not found', 404);
    }

    // Check if team has active tasks
    const activeTasks = await prisma.task.findMany({
      where: {
        teamId: id,
        status: {
          in: ['PENDING', 'IN_PROGRESS']
        }
      }
    });

    if (activeTasks.length > 0) {
      throw createError('Cannot delete team with active tasks', 400);
    }

    // Delete team (cascade will handle team members)
    await prisma.team.delete({
      where: { id }
    });

    return { message: 'Team deleted successfully' };
  }

  async getTeamMembers(teamId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                profileImage: true,
                lastLoginAt: true
              }
            }
          },
          orderBy: {
            joinedAt: 'asc'
          }
        }
      }
    });

    if (!team) {
      throw createError('Team not found', 404);
    }

    return team.members;
  }

  async addTeamMember(teamId: string, userId: string) {
    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      throw createError('Team not found', 404);
    }

    // Verify user exists and is a team member
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    if (user.role !== 'TEAM_MEMBER') {
      throw createError('Only team members can be added to teams', 400);
    }

    // Check if user is already a team member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId
        }
      }
    });

    if (existingMember) {
      throw createError('User is already a member of this team', 400);
    }

    // Add team member
    const teamMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            profileImage: true
          }
        }
      }
    });

    return teamMember;
  }

  async removeTeamMember(teamId: string, userId: string) {
    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      throw createError('Team not found', 404);
    }

    // Check if user is a team member
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId
        }
      }
    });

    if (!teamMember) {
      throw createError('User is not a member of this team', 404);
    }

    // Check if user is the team leader
    if (team.leaderId === userId) {
      throw createError('Cannot remove team leader. Change team leader first.', 400);
    }

    // Remove team member
    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId
        }
      }
    });

    return { message: 'Team member removed successfully' };
  }

  async updateTeamLocation(teamId: string, locationData: TeamLocationData) {
    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      throw createError('Team not found', 404);
    }

    // Create location record
    const location = await prisma.teamLocation.create({
      data: {
        teamId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy
      }
    });

    return location;
  }

  async getTeamLocations(teamId: string, limit: number = 50) {
    const locations = await prisma.teamLocation.findMany({
      where: { teamId },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit
    });

    return locations;
  }

  async getTeamStatistics(teamId?: string) {
    const whereClause = teamId ? { id: teamId } : {};

    const teams = await prisma.team.findMany({
      where: whereClause,
      include: {
        members: {
          select: { id: true }
        },
        tasks: {
          select: {
            status: true,
            actualDuration: true,
            completedAt: true
          }
        }
      }
    });

    const statistics = teams.map(team => {
      const completedTasks = team.tasks.filter(task => task.status === 'COMPLETED');
      const avgDuration = completedTasks.length > 0
        ? completedTasks.reduce((sum, task) => sum + (task.actualDuration || 0), 0) / completedTasks.length
        : 0;

      return {
        teamId: team.id,
        name: team.name,
        memberCount: team.members.length,
        totalTasks: team.tasks.length,
        completedTasks: completedTasks.length,
        activeTasks: team.tasks.filter(task => 
          task.status === 'PENDING' || task.status === 'IN_PROGRESS'
        ).length,
        averageTaskDuration: Math.round(avgDuration),
        status: team.status
      };
    });

    if (teamId) {
      return statistics[0] || null;
    }

    return statistics;
  }
}

export const teamsService = new TeamsService();