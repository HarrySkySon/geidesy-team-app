import { Router } from 'express';
import { taskController } from '../controllers/task.controller';
import { authMiddleware, authorize } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// Apply authentication to all routes
router.use(authMiddleware);

// GET /api/v1/tasks - Get all tasks
router.get('/', asyncHandler(taskController.getAllTasks));

// GET /api/v1/tasks/:id - Get task by ID
router.get('/:id', asyncHandler(taskController.getTaskById));

// POST /api/v1/tasks - Create new task (supervisors only)
router.post('/', authorize('supervisor', 'admin'), asyncHandler(taskController.createTask));

// PUT /api/v1/tasks/:id - Update task
router.put('/:id', asyncHandler(taskController.updateTask));

// DELETE /api/v1/tasks/:id - Delete task (supervisors only)
router.delete('/:id', authorize('supervisor', 'admin'), asyncHandler(taskController.deleteTask));

// POST /api/v1/tasks/:id/reports - Create task report
router.post('/:id/reports', asyncHandler(taskController.createTaskReport));

// PUT /api/v1/tasks/:id/status - Update task status
router.put('/:id/status', asyncHandler(taskController.updateTaskStatus));

// GET /api/v1/tasks/:id/location - Get task location
router.get('/:id/location', asyncHandler(taskController.getTaskLocation));

export default router;