import axios, { AxiosInstance, AxiosResponse } from "axios";

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
}

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "https://sub.symplax.app",
  headers: {
    "Content-Type": "application/json",
  },
});

// Inject API key per-request so localStorage key takes effect immediately after signup
api.interceptors.request.use(config => {
  let key = process.env.NEXT_PUBLIC_API_KEY ?? "";
  if (typeof window !== "undefined") {
    const lsKey = localStorage.getItem("sub_api_key");
    if (lsKey) key = lsKey;
  }
  config.headers["x-api-key"] = key;
  return config;
});

// Unwrap the { success, data, message } envelope
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    if (response.data && typeof response.data === "object" && "data" in response.data) {
      response.data = response.data.data as ApiResponse;
    }
    return response;
  },
  (error) => {
    const message =
      error?.response?.data?.message ?? error?.message ?? "An unexpected error occurred";
    return Promise.reject(new Error(message));
  }
);

export default api;

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await api.get<T>(url, { params });
  return res.data;
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.post<T>(url, body);
  return res.data;
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.patch<T>(url, body);
  return res.data;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const res = await api.delete<T>(url);
  return res.data;
}
