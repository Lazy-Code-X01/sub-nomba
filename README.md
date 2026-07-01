# Sub - Subscription Billing Engine

A production-grade multi-tenant subscription billing engine built with Node.js, Express, PostgreSQL, and Redis, integrated with the Nomba payment gateway.

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express 4 |
| ORM | Prisma 5 + PostgreSQL 16 |
| Queue | BullMQ + Redis 7 |
| Validation | Zod |
| Language | TypeScript 5 |
| Tests | Jest |
| Infra | Docker + Docker Compose |

---

## Setup

### Prerequisites

- Docker & Docker Compose
- Node.js 20+

### 1. Clone and configure

```bash
cp .env.example .env
# Fill in your Nomba credentials in .env
```

### 2. Start dependencies (Postgres + Redis)

```bash
docker-compose up postgres redis -d
```

### 3. Install dependencies and run migrations

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
```

### 4. Start the development server

```bash
npm run dev
```

### 5. Run with Docker (full stack)

```bash
docker-compose up --build
```

---

## Authentication

All API requests (except `POST /api/v1/tenants` and `GET /health`) require:

```
x-api-key: <tenant_api_key>
```

The API key is returned when creating a tenant and can be rotated via `POST /api/v1/tenants/:id/rotate-key`.

## Idempotency

Mutating requests support idempotency via:

```
Idempotency-Key: <unique_key>
```

Keys expire after 24 hours. Replayed responses include `Idempotency-Replayed: true`.

---

## API Reference

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Service health check |

---

### Tenants

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/tenants` | None | Create a new tenant (returns API key) |
| GET | `/api/v1/tenants` | None | List all tenants |
| GET | `/api/v1/tenants/:id` | None | Get tenant by ID |
| PATCH | `/api/v1/tenants/:id` | None | Update tenant name / webhook config |
| POST | `/api/v1/tenants/:id/rotate-key` | None | Rotate tenant API key |

**Create tenant body:**
```json
{
  "name": "Acme Corp",
  "webhookUrl": "https://acme.com/webhooks/sub",
  "webhookSecret": "at_least_8_chars"
}
```

---

### Plans

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/plans` | x-api-key | Create a billing plan |
| GET | `/api/v1/plans` | x-api-key | List plans for tenant |
| GET | `/api/v1/plans/:id` | x-api-key | Get plan by ID |
| PATCH | `/api/v1/plans/:id` | x-api-key | Update plan |
| DELETE | `/api/v1/plans/:id` | x-api-key | Deactivate plan |
| POST | `/api/v1/plans/proration/preview` | x-api-key | Preview proration for a plan change |

**Create plan body:**
```json
{
  "name": "Pro Monthly",
  "amount": 5000,
  "currency": "NGN",
  "interval": "MONTHLY",
  "intervalCount": 1,
  "trialDays": 14
}
```

**Proration preview body:**
```json
{
  "oldPlanId": "uuid",
  "newPlanId": "uuid",
  "daysRemainingInCycle": 15,
  "billingDays": 30
}
```

**Proration response:**
```json
{
  "success": true,
  "data": {
    "creditAmount": 2500,
    "newChargeAmount": 7500
  },
  "message": "success"
}
```

**Plan intervals:** `MONTHLY` | `ANNUAL` | `CUSTOM`

---

### Customers

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/customers` | x-api-key | Create a customer |
| GET | `/api/v1/customers` | x-api-key | List customers for tenant |
| GET | `/api/v1/customers/:id` | x-api-key | Get customer by ID |
| PATCH | `/api/v1/customers/:id` | x-api-key | Update customer |
| DELETE | `/api/v1/customers/:id` | x-api-key | Delete customer |

**Create customer body:**
```json
{
  "email": "user@example.com",
  "name": "Jane Doe",
  "nombaCustomerId": "nomba_cust_abc123"
}
```

---

### Subscriptions

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/subscriptions` | x-api-key | Create a subscription |
| GET | `/api/v1/subscriptions` | x-api-key | List subscriptions (filter by `?status=`) |
| GET | `/api/v1/subscriptions/:id` | x-api-key | Get subscription by ID |
| POST | `/api/v1/subscriptions/:id/status` | x-api-key | Apply a state transition event |
| POST | `/api/v1/subscriptions/:id/cancel` | x-api-key | Cancel subscription |
| POST | `/api/v1/subscriptions/:id/pause` | x-api-key | Pause subscription |
| POST | `/api/v1/subscriptions/:id/resume` | x-api-key | Resume paused subscription |
| POST | `/api/v1/subscriptions/:id/change-plan` | x-api-key | Change subscription plan (with proration) |

**Create subscription body:**
```json
{
  "customerId": "uuid",
  "planId": "uuid",
  "startDate": "2026-01-01T00:00:00.000Z"
}
```

**Status event body:**
```json
{
  "event": "ACTIVATE"
}
```

**Allowed events:** `START_TRIAL` | `ACTIVATE` | `MARK_PAST_DUE` | `PAUSE` | `CANCEL`

**Change plan body:**
```json
{
  "newPlanId": "uuid"
}
```

**Subscription statuses:** `CREATED` -> `TRIALING` -> `ACTIVE` -> `PAST_DUE` | `PAUSED` | `CANCELLED`

---

### Invoices

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/invoices` | x-api-key | List invoices (filter by `?subscriptionId=`) |
| GET | `/api/v1/invoices/:id` | x-api-key | Get invoice by ID |
| POST | `/api/v1/invoices/:id/checkout` | x-api-key | Generate a Nomba checkout link for an invoice |
| POST | `/api/v1/invoices/:id/void` | x-api-key | Void an invoice |

**Invoice statuses:** `PENDING` | `PAID` | `FAILED` | `VOID`

---

### Webhook Events

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/webhook-events` | x-api-key | List outbound webhook events (last 100) |
| GET | `/api/v1/webhook-events/:id` | x-api-key | Get webhook event by ID |

---

### Nomba Integration

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/nomba/webhooks` | None (Nomba calls this) | Receive inbound Nomba payment events |

---

## Webhook Events Dispatched

Sub dispatches signed webhook events to your `webhookUrl` for the following events:

| Event | Trigger |
|---|---|
| `subscription.created` | New subscription created |
| `subscription.trialing` | Subscription entered trial |
| `subscription.active` | Subscription activated |
| `subscription.past_due` | Payment failed, dunning started |
| `subscription.paused` | Subscription paused |
| `subscription.cancelled` | Subscription cancelled |
| `subscription.plan_changed` | Plan upgraded/downgraded |
| `invoice.created` | New invoice generated |
| `invoice.paid` | Invoice paid successfully |
| `invoice.failed` | Charge failed |
| `invoice.voided` | Invoice voided |
| `dunning.recovered` | Dunning charge succeeded |

**Signature verification:**
```
X-Sub-Signature: <hmac-sha256-hex>
X-Sub-Timestamp: <unix-ms>
```

Compute: `HMAC-SHA256(rawBody, webhookSecret)` and compare to `X-Sub-Signature`.

---

## Dunning Schedule

When a charge fails, Sub automatically retries on the following schedule:

| Attempt | Delay |
|---|---|
| 1 | 1 day |
| 2 | 3 days |
| 3 | 7 days |
| 4 | 14 days |

After 4 failed attempts, the subscription is cancelled and a `subscription.cancelled` event is fired with `reason: dunning_exhausted`.

---

## Response Format

All endpoints return:

```json
{
  "success": true | false,
  "data": { ... } | null,
  "message": "human readable string"
}
```

Validation errors return HTTP 422 with `data` containing field-level error details.

---

## Running Tests

```bash
npm test
npm run test:coverage
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `PORT` | HTTP server port (default: 3000) |
| `NOMBA_BASE_URL` | Nomba API base URL |
| `NOMBA_CLIENT_ID` | Nomba OAuth client ID |
| `NOMBA_CLIENT_SECRET` | Nomba OAuth client secret |
| `NOMBA_ACCOUNT_ID` | Nomba parent account ID |
| `NOMBA_SUB_ACCOUNT_ID` | Nomba sub-account ID |
| `NOMBA_CHECKOUT_PATH` | Nomba checkout endpoint path |
| `NOMBA_WEBHOOK_SECRET` | Secret for verifying inbound Nomba webhook signatures |
| `APP_URL` | Public base URL of this service (used for webhook callbacks) |
