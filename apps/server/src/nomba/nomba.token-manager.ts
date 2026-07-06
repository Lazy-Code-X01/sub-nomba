import axios from 'axios';
import { env } from '../config/env';

// Nomba returns expiresAt (ISO string), not expires_in (seconds).
// Both shapes are accepted for forward-compatibility.
interface NombaTokenData {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number; // seconds, not currently sent by Nomba
  expiresAt?: string; // ISO date string, what Nomba actually sends
  businessId?: string;
}

interface TokenResponse {
  code: string;
  description: string;
  data: NombaTokenData;
}

interface CachedToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
}

const REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiry

function resolveExpiresAt(data: NombaTokenData): number {
  if (data.expiresAt) return new Date(data.expiresAt).getTime();
  if (data.expires_in) return Date.now() + data.expires_in * 1000;
  // Fallback: treat token as valid for 3 hours
  return Date.now() + 3 * 60 * 60 * 1000;
}

class NombaTokenManager {
  private cached: CachedToken | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  async getToken(): Promise<string> {
    if (this.cached && Date.now() < this.cached.expiresAt - REFRESH_BUFFER_MS) {
      return this.cached.accessToken;
    }
    await this.fetchToken();
    return this.cached!.accessToken;
  }

  private async fetchToken(): Promise<void> {
    const res = await axios.post<TokenResponse>(
      `${env.nomba.baseUrl}/v1/auth/token/issue`,
      {
        grant_type: 'client_credentials',
        client_id: env.nomba.clientId,
        client_secret: env.nomba.clientSecret,
      },
      {
        headers: {
          accountId: env.nomba.accountId,
          'Content-Type': 'application/json',
        },
      }
    );

    if (res.data.code !== '00') {
      throw new Error(`[Nomba] token issue failed: ${res.data.description}`);
    }

    this.storeToken(res.data.data);
  }

  private async refreshToken(refreshToken: string): Promise<void> {
    try {
      const res = await axios.post<TokenResponse>(
        `${env.nomba.baseUrl}/v1/auth/token/refresh`,
        { refresh_token: refreshToken },
        {
          headers: {
            accountId: env.nomba.accountId,
            'Content-Type': 'application/json',
          },
        }
      );

      if (res.data.code !== '00') {
        throw new Error(res.data.description);
      }

      this.storeToken(res.data.data);
    } catch (err) {
      console.warn('[Nomba] token refresh failed, re-issuing:', (err as Error).message);
      await this.fetchToken();
    }
  }

  private storeToken(data: NombaTokenData): void {
    const expiresAt = resolveExpiresAt(data);
    this.cached = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
    };
    this.scheduleRefresh(data.refresh_token, expiresAt);
    console.log(`[Nomba] token cached, expires ${new Date(expiresAt).toISOString()}`);
  }

  private scheduleRefresh(refreshToken: string, expiresAtMs: number): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    const delay = Math.max(60_000, expiresAtMs - Date.now() - REFRESH_BUFFER_MS);
    this.refreshTimer = setTimeout(() => {
      this.refreshToken(refreshToken).catch((err) => {
        console.error('[Nomba] proactive refresh error:', (err as Error).message);
      });
    }, delay);
    this.refreshTimer.unref();
  }
}

export const nombaTokenManager = new NombaTokenManager();
