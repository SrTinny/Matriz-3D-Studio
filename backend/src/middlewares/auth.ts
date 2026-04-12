import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { getAccessTokenFromRequest } from '../modules/auth/auth.security';

export type JwtUser = { id: string; role: 'USER' | 'ADMIN' };

// adiciona tipagem ao Request.user
declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtUser;
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = getAccessTokenFromRequest(req);
  if (!token) return res.status(401).json({ message: 'Token ausente' });

  try {
    const payload = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;
    const id = typeof payload.sub === 'string' ? payload.sub : undefined;
    if (!id) return res.status(401).json({ message: 'Token inválido' });

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }

    req.user = { id: user.id, role: user.role };
    return next();
  } catch {
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
}

export function adminGuard(_req: Request, res: Response, next: NextFunction) {
  if (_req.user?.role !== 'ADMIN') return res.status(403).json({ message: 'Acesso negado (admin requerido)' });
  return next();
}
