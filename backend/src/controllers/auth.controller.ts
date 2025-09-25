import { Request, Response } from 'express';
import Joi from 'joi';
import { authService } from '../services/auth.service';
import { createError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().optional(),
  role: Joi.string().valid('ADMIN', 'SUPERVISOR', 'TEAM_MEMBER').required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

export class AuthController {
  async register(req: Request, res: Response) {
    // Validate request
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const result = await authService.register(value);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  }

  async login(req: Request, res: Response) {
    // Validate request
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const result = await authService.login(value);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken
      }
    });
  }

  async refreshToken(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      throw createError('Refresh token not provided', 401);
    }

    const result = await authService.refreshToken(refreshToken);

    // Set new refresh token as cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken
      }
    });
  }

  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logout successful'
    });
  }

  async forgotPassword(req: Request, res: Response) {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const result = await authService.forgotPassword(value.email);

    res.json({
      success: true,
      message: result.message
    });
  }

  async resetPassword(req: Request, res: Response) {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const result = await authService.resetPassword(value.token, value.newPassword);

    res.json({
      success: true,
      message: result.message
    });
  }

  async changePassword(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const result = await authService.changePassword(
      req.user.id,
      value.currentPassword,
      value.newPassword
    );

    res.json({
      success: true,
      message: result.message
    });
  }

  async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    // Get fresh user data from database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        profileImage: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({
      success: true,
      data: { user }
    });
  }
}

export const authController = new AuthController();