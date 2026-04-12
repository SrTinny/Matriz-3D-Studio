import { NextFunction, Request, Response } from 'express';

interface AppError extends Error {
  status?: number;
  code?: string;
}

// manter 4 parâmetros para o Express reconhecer como middleware de erro
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  let status = err.status ?? 500;
  let message = err.message || 'Internal Server Error';

  // Prisma connection/auth errors: return a clearer actionable message in local dev.
  if (
    err.code === 'P1000' ||
    err.code === 'P1001' ||
    /Authentication failed against database server/i.test(message) ||
    /Can.t reach database server/i.test(message)
  ) {
    status = 503;
    message = 'Falha ao conectar no banco de dados. Verifique o DATABASE_URL e confirme se o PostgreSQL local está ativo.';
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error('[ERROR]', err);
  }

  res.status(status).json({ message });
}
