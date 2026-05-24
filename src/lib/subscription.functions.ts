import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type Plan = "free" | "pro";

export const PLAN_LIMITS: Record<Plan, number> = {
  free: 1,
  pro: 10,
};

export const PLAN_LABEL: Record<Plan, string> = {
  free: "Free",
  pro: "Pro",
};

const monthKey = (d = new Date()) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

type SubRow = {
  user_id: string;
  plan: Plan;
  period_key: string;
  analyses_used: number;
  current_period_end: string | null;
  razorpay_payment_id: string | null;
};

async function ensureRow(userId: string): Promise<SubRow> {
  // Ensure row exists; also roll over the month if needed.
  const period = monthKey();
  const { data: existing } = await supabaseAdmin
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) {
    const { data: created, error } = await supabaseAdmin
      .from("user_subscriptions")
      .insert({ user_id: userId, period_key: period })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return created as unknown as SubRow;
  }

  let row = existing as unknown as SubRow;

  // If Pro period expired, downgrade.
  if (
    row.plan === "pro" &&
    row.current_period_end &&
    new Date(row.current_period_end).getTime() < Date.now()
  ) {
    const { data: downgraded, error } = await supabaseAdmin
      .from("user_subscriptions")
      .update({
        plan: "free",
        current_period_end: null,
        razorpay_payment_id: null,
        period_key: period,
        analyses_used: 0,
      })
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    row = downgraded as unknown as SubRow;
  }

  // Reset monthly counter on new period.
  if (row.period_key !== period) {
    const { data: rolled, error } = await supabaseAdmin
      .from("user_subscriptions")
      .update({ period_key: period, analyses_used: 0 })
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    row = rolled as unknown as SubRow;
  }

  return row;
}

function toResponse(row: SubRow) {
  const limit = PLAN_LIMITS[row.plan];
  return {
    plan: row.plan,
    used: row.analyses_used,
    limit,
    remaining: Math.max(0, limit - row.analyses_used),
    canAnalyze: row.analyses_used < limit,
    currentPeriodEnd: row.current_period_end,
    periodKey: row.period_key,
  };
}

export const getSubscriptionFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const row = await ensureRow(context.userId);
    return toResponse(row);
  });

export const incrementUsageFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const row = await ensureRow(context.userId);
    const limit = PLAN_LIMITS[row.plan];
    if (row.analyses_used >= limit) {
      throw new Error("Usage limit reached for this month");
    }
    const { data, error } = await supabaseAdmin
      .from("user_subscriptions")
      .update({ analyses_used: row.analyses_used + 1 })
      .eq("user_id", context.userId)
      .eq("analyses_used", row.analyses_used) // optimistic concurrency
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return toResponse(data as unknown as SubRow);
  });

export const activateProFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      razorpay_order_id: z.string().min(1),
      razorpay_payment_id: z.string().min(1),
      razorpay_signature: z.string().min(1),
    }).parse,
  )
  .handler(async ({ context, data }) => {
    const crypto = await import("node:crypto");
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error("Razorpay not configured");
    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(data.razorpay_signature);
    const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!valid) throw new Error("Payment signature verification failed");

    await ensureRow(context.userId);
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: row, error } = await supabaseAdmin
      .from("user_subscriptions")
      .update({
        plan: "pro",
        current_period_end: periodEnd,
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_order_id: data.razorpay_order_id,
        period_key: monthKey(),
        analyses_used: 0,
      })
      .eq("user_id", context.userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return toResponse(row as unknown as SubRow);
  });

export const downgradeToFreeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("user_subscriptions")
      .update({
        plan: "free",
        current_period_end: null,
        razorpay_payment_id: null,
        razorpay_order_id: null,
      })
      .eq("user_id", context.userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return toResponse(data as unknown as SubRow);
  });
