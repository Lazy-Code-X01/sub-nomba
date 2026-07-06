# Sub — Subscription Billing Engine

A production-grade multi-tenant subscription billing engine integrated with Nomba, with a merchant dashboard frontend.

## Structure

```
sub/
├── apps/
│   ├── server/   — Node.js + Express API, BullMQ, Prisma/PostgreSQL
│   └── client/   — Next.js 14 merchant dashboard
└── package.json  — workspace root
```

## Quick Start

### Backend (apps/server)

See [apps/server/README.md](apps/server/README.md) for full setup instructions.

```bash
cd apps/server
cp .env.example .env   # fill in credentials
docker-compose up postgres redis -d
npm install
npm run prisma:migrate
npm run dev
```

### Dashboard (apps/client)

```bash
cd apps/client
cp .env.example .env.local   # fill in API URL and key
npm install
npm run dev
```

## Running from root

```bash
npm run server   # starts apps/server dev server
npm run client   # starts apps/client dev server
npm test         # runs apps/server test suite
```
