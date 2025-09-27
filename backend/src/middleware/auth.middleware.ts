import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './error.middleware';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return next(createError('Access denied. No token provided', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key') as any;
    req.user = decoded;
    next();
  } catch (error) {
    next(createError('Invalid token', 401));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Access denied', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(createError('Access denied. Insufficient permissions', 403));
    }

    next();
  };
};

export type { AuthenticatedRequest };