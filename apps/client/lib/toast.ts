export type ToastType = "error" | "success" | "info";

export interface ToastItem {
  id:      string;
  type:    ToastType;
  message: string;
}

type Handler = (item: ToastItem) => void;

const handlers: Handler[] = [];

function emit(type: ToastType, message: string) {
  const item: ToastItem = { id: Math.random().toString(36).slice(2), type, message };
  handlers.forEach(h => h(item));
}

export const toast = {
  error:   (message: string) => emit("error",   message),
  success: (message: string) => emit("success", message),
  info:    (message: string) => emit("info",    message),
};

export function subscribe(handler: Handler) {
  handlers.push(handler);
  return () => { handlers.splice(handlers.indexOf(handler), 1); };
}
