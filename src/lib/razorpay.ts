import { createRazorpayOrder } from "./razorpay.functions";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { email?: string; name?: string };
  theme?: { color?: string };
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
};

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export type CheckoutResult =
  | {
      status: "success";
      payload: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      };
    }
  | { status: "failed"; reason: string }
  | { status: "dismissed" };

export async function startRazorpayCheckout(params: {
  userId: string;
  email?: string;
}): Promise<CheckoutResult> {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    return { status: "failed", reason: "Payment SDK failed to load" };
  }

  const receipt = `pro_${params.userId.slice(0, 8)}_${Date.now().toString(36)}`.slice(0, 40);
  const order = await createRazorpayOrder({ data: { receipt, userId: params.userId } });


  return new Promise<CheckoutResult>((resolve) => {
    const rzp = new window.Razorpay!({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "Pro Plan",
      description: "Monthly Pro subscription",
      order_id: order.orderId,
      prefill: { email: params.email },
      theme: { color: "#6366f1" },
      handler: (response) => resolve({ status: "success", payload: response }),
      modal: {
        ondismiss: () => resolve({ status: "dismissed" }),
      },
    });
    rzp.open();
  });
}
