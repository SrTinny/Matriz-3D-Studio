import 'dotenv/config';
import type { CookieOptions } from 'express';

type SameSite = NonNullable<CookieOptions['sameSite']>;

function readRequiredString(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function readOptionalString(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function readPositiveInt(name: string, defaultValue: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return defaultValue;

  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer`);
  }

  return value;
}

function readBoolean(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return defaultValue;

  if (raw === 'true' || raw === '1' || raw === 'yes') return true;
  if (raw === 'false' || raw === '0' || raw === 'no') return false;

  throw new Error(`Environment variable ${name} must be a boolean`);
}

function readSameSite(raw: string | undefined, defaultValue: SameSite): SameSite {
  const normalized = raw?.trim().toLowerCase();
  if (!normalized) return defaultValue;
  if (normalized === 'lax' || normalized === 'strict' || normalized === 'none') {
    return normalized;
  }

  throw new Error('Environment variable AUTH_COOKIE_SAME_SITE must be lax, strict or none');
}

const nodeEnv = process.env.NODE_ENV?.trim() || 'development';
const authCookieSecure = readBoolean('AUTH_COOKIE_SECURE', nodeEnv === 'production');
const defaultSameSite: SameSite = authCookieSecure ? 'none' : 'lax';

export const env = {
  nodeEnv,
  port: readPositiveInt('PORT', 3000),
  jwtSecret: readRequiredString('JWT_SECRET'),
  frontendUrl: process.env.FRONTEND_URL?.trim() || undefined,
  accessTokenMinutes: readPositiveInt('JWT_ACCESS_TOKEN_MINUTES', 15),
  refreshTokenDays: readPositiveInt('JWT_REFRESH_TOKEN_DAYS', 30),
  activationTokenHours: readPositiveInt('AUTH_ACTIVATION_TOKEN_HOURS', 24),
  authCookieSecure,
  authCookieSameSite: readSameSite(process.env.AUTH_COOKIE_SAME_SITE, defaultSameSite),
  authCookieDomain: process.env.AUTH_COOKIE_DOMAIN?.trim() || undefined,
  smtpHost: readOptionalString('SMTP_HOST') || 'smtp.gmail.com',
  smtpPort: readPositiveInt('SMTP_PORT', 587),
  smtpSecure: readBoolean('SMTP_SECURE', false),
  smtpUser: readRequiredString('SMTP_USER'),
  smtpPass: readRequiredString('SMTP_PASS'),
  smtpFrom: readOptionalString('SMTP_FROM'),
  smtpFromName: readOptionalString('SMTP_FROM_NAME') || 'Matriz 3D Studio',
};