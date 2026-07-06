import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import { nombaTokenManager } from './nomba.token-manager';

export interface NombaResponse<T = unknown> {
  code: string;
  description: string;
  data: T;
}

function assertSuccess<T>(res: AxiosResponse<NombaResponse<T>>): T {
  if (res.data.code !== '00') {
    throw new Error(`[Nomba] API error (${res.data.code}): ${res.data.description}`);
  }
  return res.data.data;
}

function buildClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: env.nomba.baseUrl,
    headers: {
      'Content-Type': 'application/json',
      accountId: env.nomba.accountId,
    },
    timeout: 30_000,
  });

  instance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = await nombaTokenManager.getToken();
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  return instance;
}

export const nombaClient = buildClient();
export { assertSuccess };
