import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { fail } from '../modules/shared/response';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(fail(`Route ${req.method} ${req.path} not found`));
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(422).json(fail('Validation error', err.flatten().fieldErrors));
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json(fail(err.message));
    return;
  }

  console.error('[Unhandled error]', err);
  res.status(500).json(fail('Internal server error'));
}
