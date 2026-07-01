export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
}

export function ok<T>(data: T, message = 'success'): ApiResponse<T> {
  return { success: true, data, message };
}

export function fail(message: string, data: unknown = null): ApiResponse {
  return { success: false, data, message };
}
