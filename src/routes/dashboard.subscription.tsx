import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Crown, GraduationCap, Sparkles, CreditCard, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  getSubscription,
  upgradeToPro,
  downgradeToFree,
  PLAN_LIMITS,
} from "@/lib/subscription";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/subscription")({
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const { user } = useAuth();
  const [, force] = useState(0);
  useEffect(() => {
    const h = () => force((x) => x + 1);
    window.addEventListener("apr:subscription-change", h);
    return () => window.removeEventListener("apr:subscription-change", h);
  }, []);
  if (!user) return null;

  const sub = getSubscription(user.id);
  const isPro = sub.plan === "pro";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Subscription</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your plan, usage and billing.
        </p>
      </div>

      {/* Active plan + usage */}
      <Card className="border-border/60 bg-gradient-card p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {isPro ? <Crown className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Active plan
                </p>
                <Badge variant={isPro ? "default" : "outline"}>
                  {isPro ? "PRO" : "FREE"}
                </Badge>
              </div>
              <p className="mt-0.5 font-display text-2xl font-bold">
                {isPro ? "Pro Plan" : "Free Plan"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isPro
                  ? sub.currentPeriodEnd
                    ? `Renews ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
                    : "Billed monthly"
                  : "No subscription"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isPro ? (
              <>
                <Button variant="outline" disabled>
                  <CreditCard className="h-4 w-4" /> Manage billing
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    downgradeToFree(user.id);
                    toast.success("Switched to Free plan");
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="hero"
                onClick={() => {
                  upgradeToPro(user.id);
                  toast.success("Upgraded to Pro (demo) — Stripe coming soon");
                }}
              >
                <Zap className="h-4 w-4" /> Upgrade to Pro
              </Button>
            )}
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">This month's usage</span>
            <span className="font-mono">
              {sub.used} / {sub.limit} analyses
            </span>
          </div>
          <Progress value={(sub.used / sub.limit) * 100} />
          <p className="text-xs text-muted-foreground">
            {sub.remaining} {sub.remaining === 1 ? "analysis" : "analyses"} remaining
            this month
          </p>
        </div>
      </Card>

      {/* Plan comparison */}
      <div className="grid gap-6 md:grid-cols-2">
        <PlanCard
          plan="free"
          current={!isPro}
          onSelect={() => {
            downgradeToFree(user.id);
            toast.success("Switched to Free plan");
          }}
        />
        <PlanCard
          plan="pro"
          current={isPro}
          highlight
          onSelect={() => {
            upgradeToPro(user.id);
            toast.success("Upgraded to Pro (demo) — Stripe coming soon");
          }}
        />
      </div>

      <Card className="border-border/60 bg-card/40 p-6">
        <h3 className="font-display text-lg font-semibold">Billing management</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Invoices, payment methods, and billing history will appear here once
          payments are connected.
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" disabled>
            <CreditCard className="h-4 w-4" /> Payment methods
          </Button>
          <Button variant="outline" disabled>
            View invoices
          </Button>
        </div>
      </Card>
    </div>
  );
}

const PLAN_DETAILS = {
  free: {
    title: "FREE PLAN",
    subtitle: "Get started with basic ATS analysis",
    price: "₹0",
    per: "",
    features: [
      `${PLAN_LIMITS.free} analysis / month`,
      "ATS score + skill gaps",
      "Basic AI resume rewrite",
      "PDF download",
    ],
  },
  pro: {
    title: "PRO PLAN",
    subtitle: "For serious placement prep",
    price: "₹79",
    per: "/month",
    features: [
      `${PLAN_LIMITS.pro} analyses / month`,
      "Full AI resume rewrite",
      "PDF downloads",
      "Saved reports & history",
      "Priority AI processing",
    ],
  },
} as const;

export function PlanCard({
  plan,
  current,
  highlight,
  onSelect,
}: {
  plan: "free" | "pro";
  current?: boolean;
  highlight?: boolean;
  onSelect?: () => void;
}) {
  const p = PLAN_DETAILS[plan];
  return (
    <Card
      className={`relative overflow-hidden p-7 ${
        highlight
          ? "border-primary/50 bg-gradient-card shadow-glow"
          : "border-border/60 bg-card/60"
      }`}
    >
      {highlight && (
        <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-primary text-primary-foreground">
          Most popular
        </Badge>
      )}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold tracking-wide">{p.title}</h3>
        {plan === "pro" && (
          <Badge
            variant="outline"
            className="gap-1 border-warning/40 bg-warning/10 text-warning"
          >
            <GraduationCap className="h-3 w-3" /> Student Pricing
          </Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{p.subtitle}</p>
      <div className="mt-5 flex items-baseline gap-1">
        <span className="font-display text-4xl font-bold">{p.price}</span>
        {p.per && <span className="text-sm text-muted-foreground">{p.per}</span>}
      </div>
      <ul className="mt-6 space-y-2.5 text-sm">
        {p.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {f}
          </li>
        ))}
      </ul>
      {onSelect && (
        <Button
          variant={highlight ? "hero" : "outline"}
          className="mt-7 w-full"
          disabled={current}
          onClick={onSelect}
        >
          {current ? "Current plan" : plan === "pro" ? "Upgrade to Pro" : "Switch to Free"}
        </Button>
      )}
    </Card>
  );
}

export function PublicPricing() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <PlanCardPublic plan="free" />
      <PlanCardPublic plan="pro" highlight />
    </div>
  );
}

function PlanCardPublic({
  plan,
  highlight,
}: {
  plan: "free" | "pro";
  highlight?: boolean;
}) {
  const p = PLAN_DETAILS[plan];
  return (
    <Card
      className={`relative overflow-hidden p-7 ${
        highlight
          ? "border-primary/50 bg-gradient-card shadow-glow"
          : "border-border/60 bg-card/60"
      }`}
    >
      {highlight && (
        <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-primary text-primary-foreground">
          Most popular
        </Badge>
      )}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold tracking-wide">{p.title}</h3>
        {plan === "pro" && (
          <Badge
            variant="outline"
            className="gap-1 border-warning/40 bg-warning/10 text-warning"
          >
            <GraduationCap className="h-3 w-3" /> Student Pricing
          </Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{p.subtitle}</p>
      <div className="mt-5 flex items-baseline gap-1">
        <span className="font-display text-4xl font-bold">{p.price}</span>
        {p.per && <span className="text-sm text-muted-foreground">{p.per}</span>}
      </div>
      <ul className="mt-6 space-y-2.5 text-sm">
        {p.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {f}
          </li>
        ))}
      </ul>
      <Link to="/signup" className="mt-7 block">
        <Button variant={highlight ? "hero" : "outline"} className="w-full">
          {plan === "pro" ? "Get Pro" : "Start free"}
        </Button>
      </Link>
    </Card>
  );
}
