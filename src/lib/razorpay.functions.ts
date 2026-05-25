import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "node:crypto";

const PRO_AMOUNT_PAISE = 7900; // ₹79.00

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      receipt: z.string().min(1).max(40),
      userId: z.string().min(1).max(64),
    }).parse,
  )
  .handler(async ({ data }) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error("Razorpay credentials are not configured");
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: PRO_AMOUNT_PAISE,
        currency: "INR",
        receipt: data.receipt,
        payment_capture: 1,
        notes: { user_id: data.userId },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Razorpay order create failed:", res.status, text);
      let detail = text;
      try {
        const parsed = JSON.parse(text) as { error?: { description?: string; code?: string } };
        if (parsed.error?.description) detail = parsed.error.description;
      } catch { /* noop */ }
      throw new Error(`Razorpay: ${detail}`);
    }


    const order = (await res.json()) as { id: string; amount: number; currency: string };
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    };
  });


export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      razorpay_order_id: z.string().min(1),
      razorpay_payment_id: z.string().min(1),
      razorpay_signature: z.string().min(1),
    }).parse,
  )
  .handler(async ({ data }) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error("Razorpay credentials are not configured");

    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");

    const a = Buffer.from(expected);
    const b = Buffer.from(data.razorpay_signature);
    const valid = a.length === b.length && crypto.timingSafeEqual(a, b);

    if (!valid) {
      return { verified: false as const };
    }
    return { verified: true as const, paymentId: data.razorpay_payment_id };
  });
