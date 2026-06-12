import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { RegisterInput, LoginInput, ResetPasswordInput } from './auth.schema';
import crypto from 'crypto';

// Simple mock for sending emails
const sendEmail = async (to: string, subject: string, html: string) => {
  console.log(`\n=========================================`);
  console.log(`[EMAIL MOCK] To: ${to}`);
  console.log(`[EMAIL MOCK] Subject: ${subject}`);
  console.log(`[EMAIL MOCK] Body: ${html}`);
  console.log(`=========================================\n`);
};

export class AuthService {
  static async register(data: RegisterInput) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw new Error('Email is already in use');
      }
      if (existingUser.username === data.username) {
        throw new Error('Username is already taken');
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        displayName: data.displayName,
        passwordHash,
      },
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.oTP.upsert({
      where: { email: user.email },
      update: { otpHash, expiresAt },
      create: { email: user.email, otpHash, expiresAt },
    });

    await sendEmail(
      user.email,
      'Verify your InkSpire account',
      `<p>Welcome to InkSpire! Your verification code is: <strong>${otp}</strong></p>`
    );

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async login(data: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new Error('Please verify your email');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshExpiresAt,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  static async logout(refreshToken: string) {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }
  }

  static async refreshTokens(token: string) {
    const existingToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!existingToken) {
      throw new Error('Invalid refresh token');
    }

    if (existingToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: existingToken.id } });
      throw new Error('Refresh token expired');
    }

    await prisma.refreshToken.delete({ where: { id: existingToken.id } });

    const accessToken = jwt.sign(
      { id: existingToken.user.id, email: existingToken.user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: existingToken.userId,
        expiresAt: refreshExpiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { success: true };

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.oTP.upsert({
      where: { email },
      update: { otpHash, expiresAt },
      create: { email, otpHash, expiresAt },
    });

    await sendEmail(
      email,
      'Password Reset',
      `<p>Your password reset code is: <strong>${otp}</strong></p>`
    );

    return { success: true };
  }

  static async resetPassword(data: ResetPasswordInput, email: string) {
    const otpRecord = await prisma.oTP.findUnique({ where: { email } });
    
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      if (otpRecord) await prisma.oTP.delete({ where: { id: otpRecord.id } });
      throw new Error('Invalid or expired OTP');
    }

    const isValid = await bcrypt.compare(data.token, otpRecord.otpHash);
    if (!isValid) throw new Error('Invalid OTP');

    const passwordHash = await bcrypt.hash(data.newPassword, 12);
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    await prisma.oTP.delete({ where: { id: otpRecord.id } });
    await prisma.refreshToken.deleteMany({ where: { user: { email } } });

    return { success: true };
  }

  static async verifyEmail(email: string, token: string) {
    const otpRecord = await prisma.oTP.findUnique({ where: { email } });
    
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      if (otpRecord) await prisma.oTP.delete({ where: { id: otpRecord.id } });
      throw new Error('Invalid or expired OTP');
    }

    const isValid = await bcrypt.compare(token, otpRecord.otpHash);
    if (!isValid) throw new Error('Invalid OTP');

    await prisma.user.update({
      where: { email },
      data: { isVerified: true },
    });

    await prisma.oTP.delete({ where: { id: otpRecord.id } });
    return { success: true };
  }
}
