import { NextFunction, Request, Response } from 'express';
import { prisma } from '../db/client';
import { AppError } from './error-handler';
import { Tenant } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      tenant: Tenant;
    }
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || typeof apiKey !== 'string') {
      throw new AppError(401, 'Missing x-api-key header');
    }

    const tenant = await prisma.tenant.findUnique({ where: { apiKey } });
    if (!tenant) {
      throw new AppError(401, 'Invalid API key');
    }

    req.tenant = tenant;
    next();
  } catch (err) {
    next(err);
  }
}
