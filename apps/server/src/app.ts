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
import plansRouter from './modules/plans/plans.routes';
import customersRouter from './modules/customers/customers.routes';
import subscriptionsRouter from './modules/subscriptions/subscriptions.routes';
import invoicesRouter from './modules/invoices/invoices.routes';
import webhooksRouter from './modules/webhooks/webhooks.routes';

const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] }));

// Raw body required for HMAC verification
app.post('/nomba/webhooks', express.raw({ type: 'application/json' }), nombaWebhookHandler);
app.get('/nomba/webhooks', (_req, res) => res.redirect(301, 'https://sub.symplax.app'));

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/tenants', tenantsRouter);

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
