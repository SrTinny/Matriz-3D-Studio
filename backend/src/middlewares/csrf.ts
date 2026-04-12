import { NextFunction, Request, Response } from 'express';
import {
  ACCESS_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from '../modules/auth/auth.security';

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (!unsafeMethods.has(req.method.toUpperCase())) {
    return next();
  }

  const hasBearerHeader = typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer ');
  const hasAuthCookie = Boolean(req.cookies?.[ACCESS_COOKIE_NAME] || req.cookies?.[REFRESH_COOKIE_NAME]);

  if (hasBearerHeader || !hasAuthCookie) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerValue = req.headers['x-csrf-token'];
  const headerToken = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: 'Falha na validacao CSRF' });
  }

  return next();
}