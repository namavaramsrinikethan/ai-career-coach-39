import type { HistoryItem } from "./types";

const HISTORY_KEY = "apr_history_v1";
const WEBHOOK_KEY = "apr_webhook_url";
export const DEFAULT_WEBHOOK_URL =
  "https://tracing-structure-average.ngrok-free.dev/webhook/ac971683-7629-4cf2-bae4-ff06db503878";

export const getHistory = (): HistoryItem[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
};

export const saveHistoryItem = (item: HistoryItem) => {
  const items = getHistory();
  items.unshift(item);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 50)));
};

export const updateHistoryItem = (id: string, patch: Partial<HistoryItem>) => {
  const items = getHistory().map((i) => (i.id === id ? { ...i, ...patch } : i));
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
};

export const getHistoryItem = (id: string) => getHistory().find((i) => i.id === id);

export const getWebhookUrl = () => {
  if (typeof window === "undefined") return DEFAULT_WEBHOOK_URL;
  return localStorage.getItem(WEBHOOK_KEY) || DEFAULT_WEBHOOK_URL;
};

export const setWebhookUrl = (url: string) => localStorage.setItem(WEBHOOK_KEY, url);
