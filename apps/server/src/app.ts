import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { authMiddleware } from './middleware/auth';
import { idempotencyMiddleware } from './middleware/idempotency';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { nombaWebhookHandler } from './nomba/nomba.webhooks';
import { startDunningWorker } from './queues/dunning.processor';
import { startBillingWorker } from './queues/billing.queue';

import tenantsRouter from './modules/tenants/tenants.routes';
import authRouter from './modules/auth/auth.routes';
import plansRouter from './modules/plans/plans.routes';
import customersRouter from './modules/customers/customers.routes';
import subscriptionsRouter from './modules/subscriptions/subscriptions.routes';
import invoicesRouter from './modules/invoices/invoices.routes';
import webhooksRouter from './modules/webhooks/webhooks.routes';

const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] }));

// Raw body required for HMAC verification
app.post('/nomba/webhooks', express.raw({ type: 'application/json' }), nombaWebhookHandler);
app.get('/nomba/webhooks', (_req, res) => {
  res.status(200).send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Payment Successful</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f1117;color:#e2e8f0;min-height:100vh;display:flex;align-items:center;justify-content:center}.card{background:#1a1d27;border:1px solid #2d3148;border-radius:16px;padding:48px 40px;text-align:center;max-width:400px;width:90%}.icon{width:64px;height:64px;background:#16a34a22;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px}.icon svg{width:32px;height:32px;color:#22c55e}h1{font-size:20px;font-weight:600;margin-bottom:8px}p{font-size:14px;color:#94a3b8;line-height:1.5}</style></head><body><div class="card"><div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><h1>Payment Successful</h1><p>Your payment has been confirmed. You can close this tab.</p></div></body></html>`);
});

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/tenants', tenantsRouter);
app.use('/api/v1/auth', authRouter);

// All routes below require tenant API key auth + idempotency support
app.use('/api/v1', authMiddleware, idempotencyMiddleware);

app.use('/api/v1/plans', plansRouter);
app.use('/api/v1/customers', customersRouter);
app.use('/api/v1/subscriptions', subscriptionsRouter);
app.use('/api/v1/invoices', invoicesRouter);
app.use('/api/v1/webhook-events', webhooksRouter);

app.use(notFoundHandler);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  startDunningWorker();
  startBillingWorker();

  app.listen(env.port, () => {
    console.log(`[Sub] server running on port ${env.port}`);
  });
}

export default app;
