// Client-side subscription + usage tracking.
// Stripe integration is intentionally NOT wired up yet — these helpers are
// placeholders that simulate plan state in localStorage, keyed per user.

export type Plan = "free" | "pro";

export const PLAN_LIMITS: Record<Plan, number> = {
  free: 1,
  pro: 100,
};

export const PLAN_LABEL: Record<Plan, string> = {
  free: "Free",
  pro: "Pro",
};

type UsageState = {
  plan: Plan;
  periodKey: string; // YYYY-MM
  used: number;
  // Placeholder billing fields for future Stripe wiring
  subscriptionId?: string | null;
  currentPeriodEnd?: string | null;
};

const KEY = (userId: string) => `apr_sub_v1_${userId}`;
const monthKey = (d = new Date()) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

const read = (userId: string): UsageState => {
  if (typeof window === "undefined") {
    return { plan: "free", periodKey: monthKey(), used: 0 };
  }
  try {
    const raw = localStorage.getItem(KEY(userId));
    if (raw) {
      const parsed = JSON.parse(raw) as UsageState;
      if (parsed.periodKey !== monthKey()) {
        // Auto-reset on new month
        const reset = { ...parsed, periodKey: monthKey(), used: 0 };
        localStorage.setItem(KEY(userId), JSON.stringify(reset));
        return reset;
      }
      return parsed;
    }
  } catch {
    /* noop */
  }
  const init: UsageState = { plan: "free", periodKey: monthKey(), used: 0 };
  try {
    localStorage.setItem(KEY(userId), JSON.stringify(init));
  } catch {
    /* noop */
  }
  return init;
};

const write = (userId: string, state: UsageState) => {
  try {
    localStorage.setItem(KEY(userId), JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("apr:subscription-change"));
  } catch {
    /* noop */
  }
};

export function getSubscription(userId: string) {
  const s = read(userId);
  const limit = PLAN_LIMITS[s.plan];
  return {
    ...s,
    limit,
    remaining: Math.max(0, limit - s.used),
    canAnalyze: s.used < limit,
  };
}

export function incrementUsage(userId: string) {
  const s = read(userId);
  const next = { ...s, used: s.used + 1 };
  write(userId, next);
  return next;
}

/** Activate Pro plan after a successful Razorpay payment. */
export function upgradeToPro(userId: string, paymentId: string) {
  const s = read(userId);
  write(userId, {
    ...s,
    plan: "pro",
    subscriptionId: paymentId,
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });
}


/** Placeholder — would normally call Stripe customer portal. */
export function downgradeToFree(userId: string) {
  const s = read(userId);
  write(userId, { ...s, plan: "free", subscriptionId: null, currentPeriodEnd: null });
}
