function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const env = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',
  databaseUrl: required('DATABASE_URL'),
  redisUrl: required('REDIS_URL'),
  nomba: {
    baseUrl: process.env.NOMBA_BASE_URL ?? 'https://sandbox.nomba.com',
    // Sandbox: /sandbox/checkout/order  |  Production: /v1/checkout/order
    checkoutPath: process.env.NOMBA_CHECKOUT_PATH ?? '/sandbox/checkout/order',
    clientId: required('NOMBA_CLIENT_ID'),
    clientSecret: required('NOMBA_CLIENT_SECRET'),
    accountId: required('NOMBA_ACCOUNT_ID'),
    subAccountId: process.env.NOMBA_SUB_ACCOUNT_ID ?? '',
    webhookSecret: required('NOMBA_WEBHOOK_SECRET'),
  },
} as const;
