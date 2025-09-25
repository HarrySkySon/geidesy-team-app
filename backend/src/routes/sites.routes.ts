import { Router } from 'express';
import { SitesController } from '../controllers/sites.controller';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware';
import { rateLimitStrict, rateLimitModerate } from '../middleware/rateLimiter.middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/sites - Get all sites with filtering and pagination
router.get('/', 
  rateLimitModerate,
  SitesController.getSites
);

// POST /api/sites - Create new site (Admin/Supervisor only)
router.post('/', 
  requireRoles(['ADMIN', 'SUPERVISOR']),
  rateLimitModerate,
  SitesController.createSite
);

// GET /api/sites/statistics - Get site statistics
router.get('/statistics', 
  requireRoles(['ADMIN', 'SUPERVISOR']),
  rateLimitModerate,
  SitesController.getSiteStatistics
);

// GET /api/sites/nearby - Get sites near a location
router.get('/nearby', 
  rateLimitModerate,
  SitesController.getSitesNearLocation
);

// GET /api/sites/:id - Get site by ID
router.get('/:id', 
  rateLimitModerate,
  SitesController.getSiteById
);

// PUT /api/sites/:id - Update site (Admin/Supervisor only)
router.put('/:id', 
  requireRoles(['ADMIN', 'SUPERVISOR']),
  rateLimitModerate,
  SitesController.updateSite
);

// DELETE /api/sites/:id - Delete site (Admin only)
router.delete('/:id', 
  requireRoles(['ADMIN']),
  rateLimitStrict,
  SitesController.deleteSite
);

export default router;