import { Router } from 'express';
import { teamController } from '../controllers/team.controller';
import { authMiddleware, authorize } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// Apply authentication to all routes
router.use(authMiddleware);

// GET /api/v1/teams - Get all teams
router.get('/', asyncHandler(teamController.getAllTeams));

// GET /api/v1/teams/:id - Get team by ID
router.get('/:id', asyncHandler(teamController.getTeamById));

// POST /api/v1/teams - Create new team (supervisors only)
router.post('/', authorize('supervisor', 'admin'), asyncHandler(teamController.createTeam));

// PUT /api/v1/teams/:id - Update team
router.put('/:id', authorize('supervisor', 'admin'), asyncHandler(teamController.updateTeam));

// DELETE /api/v1/teams/:id - Delete team (supervisors only)
router.delete('/:id', authorize('supervisor', 'admin'), asyncHandler(teamController.deleteTeam));

// GET /api/v1/teams/:id/members - Get team members
router.get('/:id/members', asyncHandler(teamController.getTeamMembers));

// POST /api/v1/teams/:id/members - Add team member
router.post('/:id/members', authorize('supervisor', 'admin'), asyncHandler(teamController.addTeamMember));

// DELETE /api/v1/teams/:id/members/:userId - Remove team member
router.delete('/:id/members/:userId', authorize('supervisor', 'admin'), asyncHandler(teamController.removeTeamMember));

// PUT /api/v1/teams/:id/location - Update team location
router.put('/:id/location', asyncHandler(teamController.updateTeamLocation));

export default router;