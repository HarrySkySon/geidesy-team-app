import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware';
import { rateLimitStrict, rateLimitModerate } from '../middleware/rateLimiter.middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/users - Get all users with filtering and pagination
// Accessible by ADMIN and SUPERVISOR
router.get('/', 
  requireRoles(['ADMIN', 'SUPERVISOR']),
  rateLimitModerate,
  UserController.getUsers
);

// POST /api/users - Create new user (Admin only)
router.post('/', 
  requireRoles(['ADMIN']),
  rateLimitStrict,
  UserController.createUser
);

// GET /api/users/:id - Get user by ID
// Users can access their own profile, ADMIN/SUPERVISOR can access any
router.get('/:id', 
  rateLimitModerate,
  UserController.getUserById
);

// PUT /api/users/:id - Update user
// Users can update their own profile, ADMIN can update any
router.put('/:id', 
  rateLimitModerate,
  UserController.updateUser
);

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', 
  requireRoles(['ADMIN']),
  rateLimitStrict,
  UserController.deleteUser
);

// PUT /api/users/:id/password - Change user password
// Users can change their own password, ADMIN can change any
router.put('/:id/password', 
  rateLimitStrict,
  UserController.changePassword
);

// GET /api/users/:id/statistics - Get user statistics
// Users can view their own stats, ADMIN/SUPERVISOR can view any
router.get('/:id/statistics', 
  rateLimitModerate,
  UserController.getUserStatistics
);

export default router;