-- Add email and passwordHash to Tenant
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "email" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT NOT NULL DEFAULT '';

-- Assign unique placeholder emails to existing rows so the unique index can be created
UPDATE "Tenant" SET "email" = 'legacy_' || id || '@placeholder.local' WHERE "email" = '';

-- Now create the unique index
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_email_key" ON "Tenant"("email");

-- Remove defaults
ALTER TABLE "Tenant" ALTER COLUMN "email" DROP DEFAULT;
ALTER TABLE "Tenant" ALTER COLUMN "passwordHash" DROP DEFAULT;
