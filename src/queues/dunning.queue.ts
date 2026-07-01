import { Queue } from 'bullmq';
import { getRedisUrl } from '../config/redis';

export interface DunningJobData {
  invoiceId: string;
  subscriptionId: string;
  attemptNumber: number;
}

export const DUNNING_QUEUE = 'dunning';

const DUNNING_DELAYS_MS = [
  1 * 24 * 60 * 60 * 1000, // 1 day
  3 * 24 * 60 * 60 * 1000, // 3 days
  7 * 24 * 60 * 60 * 1000, // 7 days
  14 * 24 * 60 * 60 * 1000, // 14 days
];

let dunningQueue: Queue<DunningJobData> | null = null;

function getQueue(): Queue<DunningJobData> {
  if (!dunningQueue) {
    dunningQueue = new Queue<DunningJobData>(DUNNING_QUEUE, {
      connection: { url: getRedisUrl() },
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 500,
      },
    });
  }
  return dunningQueue;
}

export async function enqueueDunning(invoiceId: string, subscriptionId: string): Promise<void> {
  const queue = getQueue();

  await Promise.all(
    DUNNING_DELAYS_MS.map((delay, index) =>
      queue.add(
        `dunning:${invoiceId}:attempt:${index + 1}`,
        { invoiceId, subscriptionId, attemptNumber: index + 1 },
        { delay }
      )
    )
  );
}
