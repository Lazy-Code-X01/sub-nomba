import { randomBytes } from 'crypto';
import { prisma } from '../../db/client';
import { CreateTenantInput } from './tenants.schema';
import { AppError } from '../../middleware/error-handler';

function generateApiKey(): string {
  return `sub_${randomBytes(24).toString('hex')}`;
}

function generateWebhookSecret(): string {
  return randomBytes(32).toString('hex');
}

export async function createTenant(input: CreateTenantInput) {
  const id = randomBytes(8).toString('hex');
  return prisma.tenant.create({
    data: {
      name:          input.name,
      email:         `legacy_${id}@placeholder.local`,
      passwordHash:  '',
      apiKey:        generateApiKey(),
      webhookUrl:    input.webhookUrl,
      webhookSecret: input.webhookSecret ?? generateWebhookSecret(),
    },
  });
}

export async function getTenant(id: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) throw new AppError(404, 'Tenant not found');
  return tenant;
}

export async function listTenants() {
  return prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function updateTenant(
  id: string,
  data: Partial<{ webhookUrl: string; webhookSecret: string; name: string }>
) {
  await getTenant(id);
  return prisma.tenant.update({ where: { id }, data });
}

export async function rotateTenantApiKey(id: string) {
  await getTenant(id);
  return prisma.tenant.update({ where: { id }, data: { apiKey: generateApiKey() } });
}
