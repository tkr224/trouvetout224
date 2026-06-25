import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload { userId: string; role: string; }

export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      (req as any).userId = decoded.userId;
      (req as any).userRole = decoded.role;
    }
  } catch {
    // Token invalide → on continue sans userId (visiteur anonyme)
  }
  next();
};
