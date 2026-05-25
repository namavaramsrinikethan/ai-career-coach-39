-- Revoke any direct write privileges from client roles. All writes must go
-- through server-side code using the service role (which bypasses RLS).
REVOKE INSERT, UPDATE, DELETE ON public.user_subscriptions FROM anon, authenticated;

-- Add explicit deny RLS policies for clarity and defense-in-depth, so even if
-- table privileges are re-granted in the future, RLS still blocks client writes.
DROP POLICY IF EXISTS "No client inserts" ON public.user_subscriptions;
CREATE POLICY "No client inserts"
  ON public.user_subscriptions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "No client updates" ON public.user_subscriptions;
CREATE POLICY "No client updates"
  ON public.user_subscriptions
  FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "No client deletes" ON public.user_subscriptions;
CREATE POLICY "No client deletes"
  ON public.user_subscriptions
  FOR DELETE
  TO anon, authenticated
  USING (false);
