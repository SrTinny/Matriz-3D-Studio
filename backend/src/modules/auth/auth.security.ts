import { createHash, randomBytes } from 'crypto';
import type { Role } from '@prisma/client';
import type { CookieOptions, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export const ACCESS_COOKIE_NAME = 'ux_access';
export const REFRESH_COOKIE_NAME = 'ux_refresh';
export const CSRF_COOKIE_NAME = 'ux_csrf';

type PublicUserInput = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive?: boolean | null;
  selectedAddress?: PublicAddressInput | null;
};

type PublicAddressInput = {
  id: string;
  label: string;
  zipCode: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  complement?: string | null;
};

export function toPublicAddress(address: PublicAddressInput) {
  return {
    id: address.id,
    label: address.label,
    zipCode: address.zipCode,
    state: address.state,
    city: address.city,
    neighborhood: address.neighborhood,
    street: address.street,
    number: address.number,
    complement: address.complement ?? null,
  };
}

function withCookieDomain(options: CookieOptions): CookieOptions {
  if (!env.authCookieDomain) return options;
  return { ...options, domain: env.authCookieDomain };
}

export function toPublicUser(user: PublicUserInput) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: Boolean(user.isActive),
    selectedAddress: user.selectedAddress ? toPublicAddress(user.selectedAddress) : null,
  };
}

export function signAccessToken(userId: string, role: Role) {
  return jwt.sign({ role }, env.jwtSecret, {
    subject: userId,
    expiresIn: `${env.accessTokenMinutes}m`,
  });
}

export function createOpaqueToken() {
  return randomBytes(48).toString('hex');
}

export function createActivationToken() {
  return randomBytes(32).toString('hex');
}

export function createCsrfToken() {
  return randomBytes(24).toString('hex');
}

export function hashToken(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function accessCookieOptions(): CookieOptions {
  return withCookieDomain({
    httpOnly: true,
    secure: env.authCookieSecure,
    sameSite: env.authCookieSameSite,
    path: '/',
    maxAge: env.accessTokenMinutes * 60 * 1000,
  });
}

function refreshCookieOptions(): CookieOptions {
  return withCookieDomain({
    httpOnly: true,
    secure: env.authCookieSecure,
    sameSite: env.authCookieSameSite,
    path: '/auth',
    maxAge: env.refreshTokenDays * 24 * 60 * 60 * 1000,
  });
}

function csrfCookieOptions(): CookieOptions {
  return withCookieDomain({
    httpOnly: false,
    secure: env.authCookieSecure,
    sameSite: env.authCookieSameSite,
    path: '/',
    maxAge: env.refreshTokenDays * 24 * 60 * 60 * 1000,
  });
}

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string; csrfToken: string }
) {
  res.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, accessCookieOptions());
  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions());
  res.cookie(CSRF_COOKIE_NAME, tokens.csrfToken, csrfCookieOptions());
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE_NAME, accessCookieOptions());
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
  res.clearCookie(CSRF_COOKIE_NAME, csrfCookieOptions());
}

export function getAccessTokenFromRequest(req: Request) {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7);
  }

  const cookieToken = req.cookies?.[ACCESS_COOKIE_NAME];
  return typeof cookieToken === 'string' && cookieToken ? cookieToken : undefined;
}

export function getRefreshTokenFromRequest(req: Request) {
  const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME];
  return typeof cookieToken === 'string' && cookieToken ? cookieToken : undefined;
}

export function getClientMetadata(req: Request) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const ipAddress = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : typeof forwardedFor === 'string'
      ? forwardedFor.split(',')[0]?.trim()
      : req.ip;

  return {
    userAgent: req.headers['user-agent'] || null,
    ipAddress: ipAddress || null,
  };
}