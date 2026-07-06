import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { prisma } from '../../db/client';
import { AppError } from '../../middleware/error-handler';
import { SignupInput, LoginInput } from './auth.schema';

const SALT_ROUNDS = 12;

function generateApiKey(): string {
  return `sub_live_${randomBytes(24).toString('hex')}`;
}

function generateWebhookSecret(): string {
  return randomBytes(32).toString('hex');
}

export async function signup(input: SignupInput) {
  const existing = await prisma.tenant.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError(409, 'An account with that email already exists');

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const tenant = await prisma.tenant.create({
    data: {
      name:          input.name,
      email:         input.email.toLowerCase(),
      passwordHash,
      apiKey:        generateApiKey(),
      webhookUrl:    input.webhookUrl,
      webhookSecret: input.webhookSecret ?? generateWebhookSecret(),
    },
  });

  return {
    tenantId:      tenant.id,
    tenantName:    tenant.name,
    email:         tenant.email,
    apiKey:        tenant.apiKey,
    webhookSecret: tenant.webhookSecret,
  };
}

export async function login(input: LoginInput) {
  const tenant = await prisma.tenant.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (!tenant) throw new AppError(401, 'Invalid email or password');

  const valid = await bcrypt.compare(input.password, tenant.passwordHash);
  if (!valid) throw new AppError(401, 'Invalid email or password');

  return {
    tenantId:      tenant.id,
    tenantName:    tenant.name,
    email:         tenant.email,
    apiKey:        tenant.apiKey,
    webhookSecret: tenant.webhookSecret,
  };
}
