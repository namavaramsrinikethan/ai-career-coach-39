import { createFileRoute } from "@tanstack/react-router";
import crypto from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Razorpay webhook receiver — must be public (no auth) for Razorpay to POST to it.
// Configure this URL in Razorpay Dashboard → Settings → Webhooks.
// Subscribe to: payment.captured, payment.failed
//
// Idempotency: a unique index on user_subscriptions.razorpay_payment_id
// ensures the same payment can never extend Pro twice.

const PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

type RzpPaymentEntity = {
  id: string;
  order_id?: string;
  status?: string;
  notes?: Record<string, string> | null;
};

type RzpWebhookPayload = {
  event: string;
  payload?: {
    payment?: { entity?: RzpPaymentEntity };
  };
};

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

async function resolveUserId(payment: RzpPaymentEntity): Promise<string | null> {
  // Preferred: notes.user_id set when the order was created.
  const fromNotes = payment.notes?.user_id;
  if (fromNotes) return fromNotes;

  // Fallback: lookup by order_id stored on activation (if it was already activated client-side).
  if (payment.order_id) {
    const { data } = await supabaseAdmin
      .from("user_subscriptions")
      .select("user_id")
      .eq("razorpay_order_id", payment.order_id)
      .maybeSingle();
    if (data?.user_id) return data.user_id;
  }
  return null;
}

export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
          console.error("RAZORPAY_WEBHOOK_SECRET not configured");
          return new Response("Server misconfigured", { status: 500 });
        }

        const signature = request.headers.get("x-razorpay-signature");
        const raw = await request.text();

        if (!signature) {
          return new Response("Missing signature", { status: 400 });
        }
        const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
        if (!safeEqual(expected, signature)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let body: RzpWebhookPayload;
        try {
          body = JSON.parse(raw) as RzpWebhookPayload;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const payment = body.payload?.payment?.entity;
        if (!payment) {
          // Acknowledge so Razorpay doesn't keep retrying for events we don't handle.
          return new Response("ok", { status: 200 });
        }

        // Idempotency short-circuit — if we've already recorded this payment, no-op.
        const { data: existing } = await supabaseAdmin
          .from("user_subscriptions")
          .select("user_id, razorpay_payment_id")
          .eq("razorpay_payment_id", payment.id)
          .maybeSingle();
        if (existing) {
          return new Response("ok (already processed)", { status: 200 });
        }

        if (body.event === "payment.failed") {
          // Nothing to grant; log for observability.
          console.warn("Razorpay payment.failed:", payment.id, payment.order_id);
          return new Response("ok", { status: 200 });
        }

        if (body.event !== "payment.captured") {
          return new Response("ok (ignored event)", { status: 200 });
        }

        const userId = await resolveUserId(payment);
        if (!userId) {
          // Webhook arrived before activation and no notes. Acknowledge so Razorpay stops retrying.
          console.warn("Razorpay webhook: unable to resolve user for payment", payment.id);
          return new Response("ok (no user)", { status: 200 });
        }

        // Ensure a row exists for this user.
        await supabaseAdmin
          .from("user_subscriptions")
          .upsert({ user_id: userId }, { onConflict: "user_id" });

        const now = new Date();
        const periodEnd = new Date(now.getTime() + PERIOD_MS).toISOString();
        const periodKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

        const { error } = await supabaseAdmin
          .from("user_subscriptions")
          .update({
            plan: "pro",
            current_period_end: periodEnd,
            razorpay_payment_id: payment.id,
            razorpay_order_id: payment.order_id ?? null,
            last_payment_at: now.toISOString(),
            period_key: periodKey,
            analyses_used: 0,
          })
          .eq("user_id", userId);

        if (error) {
          // Unique-violation on razorpay_payment_id means another concurrent delivery won.
          if ((error as { code?: string }).code === "23505") {
            return new Response("ok (race)", { status: 200 });
          }
          console.error("Webhook DB update failed:", error);
          return new Response("DB error", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
