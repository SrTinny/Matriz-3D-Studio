import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { sendActivationEmail } from '../../config/mailer';
import { addressSchema, activateSchema, registerSchema, loginSchema } from './auth.schemas';
import {
  addDays,
  addHours,
  clearAuthCookies,
  createActivationToken,
  createCsrfToken,
  createOpaqueToken,
  getClientMetadata,
  getRefreshTokenFromRequest,
  hashToken,
  setAuthCookies,
  signAccessToken,
  toPublicAddress,
  toPublicUser,
} from './auth.security';

type RequestWithUser = Request & { user: { id: string; role: 'USER' | 'ADMIN' } };

const addressSelect = {
  id: true,
  label: true,
  zipCode: true,
  state: true,
  city: true,
  neighborhood: true,
  street: true,
  number: true,
  complement: true,
} as const;

function requireUser(req: Request): asserts req is RequestWithUser {
  if (!req.user) {
    throw new Error('authMiddleware not applied: req.user is missing');
  }
}

function normalizeAddressInput(input: {
  label: string;
  zipCode: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  complement?: string | undefined;
}) {
  return {
    label: input.label.trim(),
    zipCode: input.zipCode.replace(/\D/g, '').slice(0, 8),
    state: input.state.trim().toUpperCase(),
    city: input.city.trim(),
    neighborhood: input.neighborhood.trim(),
    street: input.street.trim(),
    number: input.number.trim(),
    complement: input.complement?.trim() ? input.complement.trim() : null,
  };
}

async function buildAccountPayload(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      selectedAddress: { select: addressSelect },
      addresses: {
        select: addressSelect,
        orderBy: [{ createdAt: 'desc' }],
      },
    },
  });

  if (!user) return null;

  return {
    user: toPublicUser(user),
    addresses: user.addresses.map(toPublicAddress),
  };
}

async function revokeRefreshFamily(family: string, reason: string, now: Date) {
  await prisma.refreshTokenSession.updateMany({
    where: { family, revokedAt: null },
    data: { revokedAt: now, revokedReason: reason },
  });
}

async function activateAccount(token: string) {
  const normalizedToken = token.trim();

  if (!normalizedToken) {
    return { status: 400, message: 'Token inválido ou expirado' };
  }

  const user = await prisma.user.findUnique({ where: { activationToken: normalizedToken } });
  if (!user) {
    return { status: 400, message: 'Token inválido ou expirado' };
  }

  if (!user.activationTokenExpiresAt || user.activationTokenExpiresAt <= new Date()) {
    await prisma.user.update({
      where: { id: user.id },
      data: { activationToken: null, activationTokenExpiresAt: null },
    });

    return { status: 400, message: 'Token inválido ou expirado' };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isActive: true, activationToken: null, activationTokenExpiresAt: null },
  });

  return { status: 200, message: 'Conta ativada com sucesso. Você já pode fazer login.' };
}

// POST /auth/register
export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dados inválidos', errors: parsed.error.flatten() });
  }
  const { name, email, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ message: 'E-mail já registrado' });

  const passwordHash = await bcrypt.hash(password, 12);
  const activationToken = createActivationToken();
  const activationTokenExpiresAt = addHours(new Date(), env.activationTokenHours);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      role: 'USER',
      isActive: false,
      activationToken,
      activationTokenExpiresAt,
    },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  const activationUrl = `${env.frontendUrl || 'http://localhost:3001'}/register?token=${encodeURIComponent(activationToken)}`;

  try {
    await sendActivationEmail({
      to: user.email,
      name: user.name,
      token: activationToken,
      activationUrl,
    });
  } catch (error) {
    console.error('Erro ao enviar e-mail de ativação', error);
    await prisma.user.delete({ where: { id: user.id } });

    return res.status(502).json({
      message: 'Não foi possível enviar o e-mail de ativação. Tente novamente.',
    });
  }

  return res.status(201).json({
    message: 'Usuário registrado. Verifique seu e-mail para validar a conta com o token recebido.',
    user: toPublicUser(user),
  });
}

// POST /auth/login
export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dados inválidos', errors: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { selectedAddress: { select: addressSelect } },
  });
  if (!user) return res.status(401).json({ message: 'Credenciais inválidas' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Credenciais inválidas' });

  if (!user.isActive) {
    return res.status(403).json({
      message: 'Conta não ativada. Verifique seu e-mail e valide o token antes de entrar.',
    });
  }

  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = createOpaqueToken();
  const csrfToken = createCsrfToken();
  const metadata = getClientMetadata(req);

  await prisma.refreshTokenSession.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      family: randomUUID(),
      tokenHash: hashToken(refreshToken),
      expiresAt: addDays(new Date(), env.refreshTokenDays),
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
    },
  });

  setAuthCookies(res, { accessToken, refreshToken, csrfToken });

  return res.json({
    message: 'Login realizado com sucesso',
    user: toPublicUser(user),
  });
}

// GET /auth/me
export async function me(req: Request, res: Response) {
  requireUser(req);

  const payload = await buildAccountPayload(req.user.id);

  if (!payload) {
    clearAuthCookies(res);
    return res.status(401).json({ message: 'Sessão inválida' });
  }

  return res.json(payload);
}

// POST /auth/refresh
export async function refreshSession(req: Request, res: Response) {
  const refreshToken = getRefreshTokenFromRequest(req);
  if (!refreshToken) {
    clearAuthCookies(res);
    return res.status(401).json({ message: 'Sessão inválida' });
  }

  const now = new Date();
  const session = await prisma.refreshTokenSession.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true, isActive: true, selectedAddress: { select: addressSelect } },
      },
    },
  });

  if (!session) {
    clearAuthCookies(res);
    return res.status(401).json({ message: 'Sessão inválida' });
  }

  if (session.revokedAt) {
    await revokeRefreshFamily(session.family, 'reuse-detected', now);
    clearAuthCookies(res);
    return res.status(401).json({ message: 'Sessão inválida' });
  }

  if (session.expiresAt <= now) {
    await prisma.refreshTokenSession.update({
      where: { id: session.id },
      data: { revokedAt: now, revokedReason: 'expired' },
    });
    clearAuthCookies(res);
    return res.status(401).json({ message: 'Sessão expirada' });
  }

  if (!session.user.isActive) {
    await revokeRefreshFamily(session.family, 'user-inactive', now);
    clearAuthCookies(res);
    return res.status(401).json({ message: 'Sessão inválida' });
  }

  const nextRefreshToken = createOpaqueToken();
  const nextRefreshTokenHash = hashToken(nextRefreshToken);
  const accessToken = signAccessToken(session.user.id, session.user.role);
  const csrfToken = createCsrfToken();
  const metadata = getClientMetadata(req);

  await prisma.$transaction([
    prisma.refreshTokenSession.update({
      where: { id: session.id },
      data: {
        revokedAt: now,
        revokedReason: 'rotated',
        replacedByTokenHash: nextRefreshTokenHash,
      },
    }),
    prisma.refreshTokenSession.create({
      data: {
        id: randomUUID(),
        userId: session.user.id,
        family: session.family,
        tokenHash: nextRefreshTokenHash,
        expiresAt: addDays(now, env.refreshTokenDays),
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
      },
    }),
  ]);

  setAuthCookies(res, { accessToken, refreshToken: nextRefreshToken, csrfToken });

  return res.json({ user: toPublicUser(session.user) });
}

// POST /auth/logout
export async function logout(req: Request, res: Response) {
  const refreshToken = getRefreshTokenFromRequest(req);
  const now = new Date();

  if (refreshToken) {
    await prisma.refreshTokenSession.updateMany({
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: now, revokedReason: 'logout' },
    });
  }

  clearAuthCookies(res);
  return res.status(204).send();
}

// GET /auth/activate/:token
export async function activate(req: Request, res: Response) {
  const result = await activateAccount(String(req.params.token || ''));
  return res.status(result.status).json({ message: result.message });
}

// POST /auth/activate
export async function activateByToken(req: Request, res: Response) {
  const parsed = activateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Dados inválidos', errors: parsed.error.flatten() });
  }

  const result = await activateAccount(parsed.data.token);
  return res.status(result.status).json({ message: result.message });
}

// POST /auth/addresses
export async function createAddress(req: Request, res: Response) {
  requireUser(req);

  const parsed = addressSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dados de endereco inválidos', errors: parsed.error.flatten() });
  }

  const created = await prisma.address.create({
    data: {
      userId: req.user.id,
      ...normalizeAddressInput(parsed.data),
    },
    select: { id: true },
  });

  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { selectedAddressId: true } });
  if (!user?.selectedAddressId) {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { selectedAddressId: created.id },
    });
  }

  const payload = await buildAccountPayload(req.user.id);
  return res.status(201).json(payload);
}

// PUT /auth/addresses/:id
export async function updateAddress(req: Request, res: Response) {
  requireUser(req);

  const parsed = addressSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dados de endereco inválidos', errors: parsed.error.flatten() });
  }

  const addressId = String(req.params.id || '');
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId: req.user.id },
    select: { id: true },
  });

  if (!existing) {
    return res.status(404).json({ message: 'Endereco não encontrado' });
  }

  await prisma.address.update({
    where: { id: addressId },
    data: normalizeAddressInput(parsed.data),
  });

  const payload = await buildAccountPayload(req.user.id);
  return res.json(payload);
}

// POST /auth/addresses/:id/select
export async function selectAddress(req: Request, res: Response) {
  requireUser(req);

  const addressId = String(req.params.id || '');
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: req.user.id },
    select: { id: true },
  });

  if (!address) {
    return res.status(404).json({ message: 'Endereco não encontrado' });
  }

  await prisma.user.update({
    where: { id: req.user.id },
    data: { selectedAddressId: address.id },
  });

  const payload = await buildAccountPayload(req.user.id);
  return res.json(payload);
}

// DELETE /auth/addresses/:id
export async function deleteAddress(req: Request, res: Response) {
  requireUser(req);

  const addressId = String(req.params.id || '');
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: req.user.id },
    select: { id: true },
  });

  if (!address) {
    return res.status(404).json({ message: 'Endereco não encontrado' });
  }

  await prisma.$transaction(async (tx) => {
    const currentUser = await tx.user.findUnique({
      where: { id: req.user.id },
      select: { selectedAddressId: true },
    });

    await tx.address.delete({ where: { id: address.id } });

    if (currentUser?.selectedAddressId === address.id) {
      const nextAddress = await tx.address.findFirst({
        where: { userId: req.user.id },
        orderBy: [{ createdAt: 'asc' }],
        select: { id: true },
      });

      await tx.user.update({
        where: { id: req.user.id },
        data: { selectedAddressId: nextAddress?.id ?? null },
      });
    }
  });

  const payload = await buildAccountPayload(req.user.id);
  return res.json(payload);
}
