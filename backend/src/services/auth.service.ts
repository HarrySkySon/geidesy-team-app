import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'TEAM_MEMBER';
}

interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export class AuthService {
  private generateTokens(payload: TokenPayload) {
    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
  }

  async register(data: RegisterData) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw createError('User with this email already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        name: data.name,
        phone: data.phone,
        role: data.role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true
      }
    });

    // Generate tokens
    const tokens = this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    return {
      user,
      tokens
    };
  }

  async login(data: LoginData) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        role: true,
        phone: true,
        isActive: true
      }
    });

    if (!user) {
      throw createError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw createError('Account is deactivated', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw createError('Invalid email or password', 401);
    }

    // Generate tokens
    const tokens = this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone
      },
      tokens
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as TokenPayload;

      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true }
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw createError('Invalid or expired refresh token', 401);
      }

      // Generate new tokens
      const tokens = this.generateTokens({
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      });

      // Update refresh token in database
      await prisma.refreshToken.update({
        where: { token: refreshToken },
        data: {
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      return {
        user: {
          id: storedToken.user.id,
          email: storedToken.user.email,
          name: storedToken.user.name,
          role: storedToken.user.role,
          phone: storedToken.user.phone
        },
        tokens
      };
    } catch (error) {
      throw createError('Invalid refresh token', 401);
    }
  }

  async logout(refreshToken: string) {
    // Remove refresh token from database
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken }
    });
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists or not
      return { message: 'If user exists, password reset email will be sent' };
    }

    // Generate reset token (in real app, you'd send email)
    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // In production, send email with reset link containing the token
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return { message: 'Password reset instructions sent to email' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id: decoded.id },
        data: { passwordHash: hashedPassword }
      });

      // Invalidate all refresh tokens for this user
      await prisma.refreshToken.deleteMany({
        where: { userId: decoded.id }
      });

      return { message: 'Password reset successful' };
    } catch (error) {
      throw createError('Invalid or expired reset token', 400);
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true }
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw createError('Current password is incorrect', 400);
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedNewPassword }
    });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId }
    });

    return { message: 'Password changed successfully' };
  }
}

export const authService = new AuthService();