import IORedis from 'ioredis';
import { env } from './env';

let redisInstance: IORedis | null = null;

export function getRedis(): IORedis {
  if (!redisInstance) {
    redisInstance = new IORedis(env.redisUrl, {
      maxRetriesPerRequest: null,
    });
    redisInstance.on('error', (err) => {
      console.error('[Redis] connection error:', err.message);
    });
  }
  return redisInstance;
}

// BullMQ requires a URL string — it bundles its own ioredis internally.
export function getRedisUrl(): string {
  return env.redisUrl;
}
