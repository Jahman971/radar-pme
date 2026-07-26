import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[error]', err.message, err.stack);

  const status = (err as { status?: number }).status ?? 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Une erreur interne est survenue'
    : err.message;

  res.status(status).json({ error: message });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Route introuvable' });
}
