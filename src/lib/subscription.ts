// Client-side hook for subscription state — backend is the source of truth.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  activateProFn,
  downgradeToFreeFn,
  getSubscriptionFn,
  incrementUsageFn,
  PLAN_LABEL,
  PLAN_LIMITS,
  type Plan,
} from "./subscription.functions";
import { useAuth } from "./auth";

export { PLAN_LABEL, PLAN_LIMITS };
export type { Plan };

export type SubscriptionState = {
  plan: Plan;
  used: number;
  limit: number;
  remaining: number;
  canAnalyze: boolean;
  currentPeriodEnd: string | null;
  periodKey: string;
};

export const SUBSCRIPTION_QUERY_KEY = ["subscription"] as const;

export function useSubscription() {
  const { user, loading } = useAuth();
  const getSub = useServerFn(getSubscriptionFn);
  return useQuery({
    queryKey: [...SUBSCRIPTION_QUERY_KEY, user?.id ?? null],
    queryFn: () => getSub(),
    enabled: !!user && !loading,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useIncrementUsage() {
  const inc = useServerFn(incrementUsageFn);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => inc(),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY }),
  });
}

export function useActivatePro() {
  const activate = useServerFn(activateProFn);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => activate({ data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY }),
  });
}

export function useDowngradeToFree() {
  const downgrade = useServerFn(downgradeToFreeFn);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => downgrade(),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY }),
  });
}
