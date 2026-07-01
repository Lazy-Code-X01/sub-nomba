import { NextFunction, Request, Response } from 'express';
import { prisma } from '../db/client';

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export async function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey || typeof idempotencyKey !== 'string') {
    next();
    return;
  }

  const tenantId = req.tenant?.id;
  if (!tenantId) {
    next();
    return;
  }

  try {
    const existing = await prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey },
    });

    if (existing) {
      if (new Date() < existing.expiresAt) {
        res.setHeader('Idempotency-Replayed', 'true');
        res.json(existing.response);
        return;
      }
      // Key is expired; delete it so the request proceeds as a fresh call
      await prisma.idempotencyKey.delete({ where: { key: idempotencyKey } });
    }

    // Intercept the response to persist it
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      prisma.idempotencyKey
        .create({
          data: {
            key: idempotencyKey,
            tenantId,
            response: body as object,
            expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
          },
        })
        .catch((err) => console.error('[Idempotency] persist error:', err.message));
      return originalJson(body);
    };

    next();
  } catch (err) {
    next(err);
  }
}
