import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', asyncHandler(authController.login));

// POST /api/v1/auth/register  
router.post('/register', asyncHandler(authController.register));

// POST /api/v1/auth/logout
router.post('/logout', asyncHandler(authController.logout));

// POST /api/v1/auth/refresh
router.post('/refresh', asyncHandler(authController.refreshToken));

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', asyncHandler(authController.forgotPassword));

// POST /api/v1/auth/reset-password
router.post('/reset-password', asyncHandler(authController.resetPassword));

export default router;