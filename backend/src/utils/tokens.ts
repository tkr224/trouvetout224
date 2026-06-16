// src/utils/tokens.ts
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

export const generateTokens = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });

  const accessToken = jwt.sign(
    { userId, role: user?.role },
    process.env.JWT_SECRET as string,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any }
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({ data: { token: refreshToken, userId, expiresAt } });

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = async (token: string): Promise<string | null> => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;
    const stored = await prisma.refreshToken.findFirst({
      where: { token, userId: decoded.userId, expiresAt: { gte: new Date() } },
    });
    if (!stored) return null;
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    return decoded.userId;
  } catch {
    return null;
  }
};
