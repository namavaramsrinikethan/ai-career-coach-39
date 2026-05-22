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

const MAX_HISTORY = 5;

const persist = (items: HistoryItem[]) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
  } catch {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 1)));
    } catch {
      localStorage.removeItem(HISTORY_KEY);
    }
  }
};

export const saveHistoryItem = (item: HistoryItem) => {
  // Strip heavy payloads (base64 PDFs, raw webhook response) before persisting
  const slim: HistoryItem = {
    ...item,
    originalResumeBase64: undefined,
    modifiedResumePdfBase64: undefined,
    rawResponse: undefined,
  };
  persist([slim, ...getHistory()]);
};

export const updateHistoryItem = (id: string, patch: Partial<HistoryItem>) => {
  persist(getHistory().map((i) => (i.id === id ? { ...i, ...patch } : i)));
};

export const getHistoryItem = (id: string) => getHistory().find((i) => i.id === id);

export const getWebhookUrl = () => {
  if (typeof window === "undefined") return DEFAULT_WEBHOOK_URL;
  return localStorage.getItem(WEBHOOK_KEY) || DEFAULT_WEBHOOK_URL;
};

export const setWebhookUrl = (url: string) => localStorage.setItem(WEBHOOK_KEY, url);
