
-- Plan enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro');

-- Subscriptions table (one row per user)
CREATE TABLE public.user_subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan public.subscription_plan NOT NULL DEFAULT 'free',
  period_key text NOT NULL DEFAULT to_char((now() at time zone 'utc'), 'YYYY-MM'),
  analyses_used integer NOT NULL DEFAULT 0,
  razorpay_payment_id text,
  razorpay_order_id text,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- No client-side insert/update/delete; mutations go through server functions
-- (auth-middleware + service role admin client where needed).

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create a free subscription row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();
