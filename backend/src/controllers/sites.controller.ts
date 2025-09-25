import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Validation schemas
const createSiteSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional().allow('', null),
  address: Joi.string().max(200).optional().allow('', null),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  altitude: Joi.number().optional().allow(null),
  accuracy: Joi.number().min(0).optional().allow(null),
  siteType: Joi.string().valid(
    'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL', 
    'INFRASTRUCTURE', 'ENVIRONMENTAL', 'OTHER'
  ).default('OTHER'),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'PLANNED', 'COMPLETED').default('ACTIVE'),
  contactPerson: Joi.string().max(100).optional().allow('', null),
  contactPhone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().allow('', null),
  contactEmail: Joi.string().email().optional().allow('', null),
  boundaries: Joi.array().items(
    Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
    })
  ).min(3).optional(), // At least 3 points for a polygon
  notes: Joi.string().max(1000).optional().allow('', null),
});

const updateSiteSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional().allow('', null),
  address: Joi.string().max(200).optional().allow('', null),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  altitude: Joi.number().optional().allow(null),
  accuracy: Joi.number().min(0).optional().allow(null),
  siteType: Joi.string().valid(
    'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL', 
    'INFRASTRUCTURE', 'ENVIRONMENTAL', 'OTHER'
  ).optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'PLANNED', 'COMPLETED').optional(),
  contactPerson: Joi.string().max(100).optional().allow('', null),
  contactPhone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().allow('', null),
  contactEmail: Joi.string().email().optional().allow('', null),
  boundaries: Joi.array().items(
    Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
    })
  ).min(3).optional(),
  notes: Joi.string().max(1000).optional().allow('', null),
});

const getSitesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().min(1).max(100).optional(),
  siteType: Joi.string().valid(
    'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL', 
    'INFRASTRUCTURE', 'ENVIRONMENTAL', 'OTHER'
  ).optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'PLANNED', 'COMPLETED').optional(),
  sortBy: Joi.string().valid('name', 'createdAt', 'updatedAt', 'siteType', 'status').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
  // Geospatial filters
  nearLat: Joi.number().min(-90).max(90).optional(),
  nearLng: Joi.number().min(-180).max(180).optional(),
  radius: Joi.number().min(0.1).max(1000).optional(), // in kilometers
  // Bounding box filter
  swLat: Joi.number().min(-90).max(90).optional(),
  swLng: Joi.number().min(-180).max(180).optional(),
  neLat: Joi.number().min(-90).max(90).optional(),
  neLng: Joi.number().min(-180).max(180).optional(),
});

export class SitesController {

  // Get all sites with filtering and pagination
  static async getSites(req: AuthenticatedRequest, res: Response) {
    try {
      const { error, value } = getSitesSchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      const { 
        page, limit, search, siteType, status, sortBy, sortOrder,
        nearLat, nearLng, radius, swLat, swLng, neLat, neLng
      } = value;
      
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};
      
      if (siteType) {
        where.siteType = siteType;
      }
      
      if (status) {
        where.status = status;
      }
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
          { contactPerson: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Get total count for pagination
      const total = await prisma.site.count({ where });

      // Get sites
      let sites = await prisma.site.findMany({
        where,
        include: {
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      });

      // Apply geospatial filtering if requested
      if (nearLat && nearLng && radius) {
        // Filter sites within radius (simplified calculation)
        sites = sites.filter(site => {
          const distance = calculateDistance(nearLat, nearLng, site.latitude, site.longitude);
          return distance <= radius;
        });
      }

      if (swLat && swLng && neLat && neLng) {
        // Filter sites within bounding box
        sites = sites.filter(site => {
          return site.latitude >= swLat && 
                 site.latitude <= neLat && 
                 site.longitude >= swLng && 
                 site.longitude <= neLng;
        });
      }

      // Add calculated fields
      const sitesWithExtras = sites.map(site => ({
        ...site,
        taskCount: site._count.tasks,
        hasBoundaries: !!(site.boundaries && (site.boundaries as any[]).length > 0),
        coordinates: {
          latitude: site.latitude,
          longitude: site.longitude,
          altitude: site.altitude,
          accuracy: site.accuracy,
        },
      }));

      res.json({
        success: true,
        data: {
          sites: sitesWithExtras,
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
      console.error('Get sites error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Get site by ID
  static async getSiteById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Site ID is required',
        });
      }

      const site = await prisma.site.findUnique({
        where: { id },
        include: {
          tasks: {
            include: {
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              team: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });

      if (!site) {
        return res.status(404).json({
          success: false,
          error: 'Site not found',
        });
      }

      // Calculate site statistics
      const completedTasks = site.tasks.filter(task => task.status === 'COMPLETED').length;
      const activeTasks = site.tasks.filter(task => 
        ['PENDING', 'IN_PROGRESS', 'REVIEW'].includes(task.status)
      ).length;

      const siteWithStats = {
        ...site,
        statistics: {
          totalTasks: site._count.tasks,
          completedTasks,
          activeTasks,
          completionRate: site._count.tasks > 0 ? (completedTasks / site._count.tasks) * 100 : 0,
        },
        hasBoundaries: !!(site.boundaries && (site.boundaries as any[]).length > 0),
        coordinates: {
          latitude: site.latitude,
          longitude: site.longitude,
          altitude: site.altitude,
          accuracy: site.accuracy,
        },
      };

      res.json({
        success: true,
        data: { site: siteWithStats },
      });
    } catch (error) {
      console.error('Get site by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Create new site
  static async createSite(req: AuthenticatedRequest, res: Response) {
    try {
      // Check permissions
      if (!['ADMIN', 'SUPERVISOR'].includes(req.user?.role || '')) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Admin or Supervisor role required.',
        });
      }

      const { error, value } = createSiteSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      const siteData = {
        ...value,
        createdById: req.user?.id,
      };

      // Check for duplicate sites at the same location
      const existingSite = await prisma.site.findFirst({
        where: {
          AND: [
            { latitude: { gte: siteData.latitude - 0.0001, lte: siteData.latitude + 0.0001 } },
            { longitude: { gte: siteData.longitude - 0.0001, lte: siteData.longitude + 0.0001 } },
          ],
        },
      });

      if (existingSite) {
        return res.status(409).json({
          success: false,
          error: 'A site already exists at this location',
        });
      }

      const newSite = await prisma.site.create({
        data: siteData,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: { site: newSite },
        message: 'Site created successfully',
      });
    } catch (error) {
      console.error('Create site error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Update site
  static async updateSite(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Site ID is required',
        });
      }

      // Check permissions
      if (!['ADMIN', 'SUPERVISOR'].includes(req.user?.role || '')) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Admin or Supervisor role required.',
        });
      }

      const { error, value } = updateSiteSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      // Check if site exists
      const existingSite = await prisma.site.findUnique({
        where: { id },
      });

      if (!existingSite) {
        return res.status(404).json({
          success: false,
          error: 'Site not found',
        });
      }

      // Check for location conflicts if coordinates are being updated
      if ((value.latitude || value.longitude) && 
          (value.latitude !== existingSite.latitude || value.longitude !== existingSite.longitude)) {
        const conflictSite = await prisma.site.findFirst({
          where: {
            id: { not: id },
            AND: [
              { latitude: { gte: (value.latitude || existingSite.latitude) - 0.0001, 
                           lte: (value.latitude || existingSite.latitude) + 0.0001 } },
              { longitude: { gte: (value.longitude || existingSite.longitude) - 0.0001, 
                            lte: (value.longitude || existingSite.longitude) + 0.0001 } },
            ],
          },
        });

        if (conflictSite) {
          return res.status(409).json({
            success: false,
            error: 'Another site already exists at this location',
          });
        }
      }

      const updatedSite = await prisma.site.update({
        where: { id },
        data: {
          ...value,
          updatedAt: new Date(),
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: { site: updatedSite },
        message: 'Site updated successfully',
      });
    } catch (error) {
      console.error('Update site error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Delete site
  static async deleteSite(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Site ID is required',
        });
      }

      // Check permissions - only admin can delete sites
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Admin role required.',
        });
      }

      // Check if site exists
      const site = await prisma.site.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });

      if (!site) {
        return res.status(404).json({
          success: false,
          error: 'Site not found',
        });
      }

      // Check if site has active tasks
      const activeTasks = await prisma.task.count({
        where: {
          siteId: id,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      });

      if (activeTasks > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete site with active tasks. Please complete or reassign tasks first.',
        });
      }

      // Delete site
      await prisma.site.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Site deleted successfully',
      });
    } catch (error) {
      console.error('Delete site error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Get sites near a location
  static async getSitesNearLocation(req: AuthenticatedRequest, res: Response) {
    try {
      const { latitude, longitude, radius = 10, limit = 50 } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          error: 'Latitude and longitude are required',
        });
      }

      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const radiusKm = parseFloat(radius as string);
      const maxResults = parseInt(limit as string);

      if (isNaN(lat) || isNaN(lng) || isNaN(radiusKm)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid coordinates or radius',
        });
      }

      // Get all sites and filter by distance (for simplicity)
      // In production, you'd use PostGIS spatial queries
      const allSites = await prisma.site.findMany({
        include: {
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });

      const nearBySites = allSites
        .map(site => ({
          ...site,
          distance: calculateDistance(lat, lng, site.latitude, site.longitude),
        }))
        .filter(site => site.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, maxResults);

      res.json({
        success: true,
        data: {
          sites: nearBySites,
          center: { latitude: lat, longitude: lng },
          radius: radiusKm,
        },
      });
    } catch (error) {
      console.error('Get sites near location error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Get site statistics
  static async getSiteStatistics(req: AuthenticatedRequest, res: Response) {
    try {
      // Overall statistics
      const [totalSites, sitesByType, sitesByStatus, recentSites] = await Promise.all([
        prisma.site.count(),
        prisma.site.groupBy({
          by: ['siteType'],
          _count: { siteType: true },
        }),
        prisma.site.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
        prisma.site.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            name: true,
            siteType: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);

      const statistics = {
        total: totalSites,
        byType: sitesByType.reduce((acc, item) => {
          acc[item.siteType] = item._count.siteType;
          return acc;
        }, {} as Record<string, number>),
        byStatus: sitesByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>),
        recent: recentSites,
      };

      res.json({
        success: true,
        data: { statistics },
      });
    } catch (error) {
      console.error('Get site statistics error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default SitesController;