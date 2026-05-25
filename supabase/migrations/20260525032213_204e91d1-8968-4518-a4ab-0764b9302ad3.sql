ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS last_payment_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS user_subscriptions_razorpay_payment_id_key
  ON public.user_subscriptions (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;