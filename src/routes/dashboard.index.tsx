import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getHistory } from "@/lib/storage";
import { getSubscription } from "@/lib/subscription";
import { useAuth } from "@/lib/auth";
import type { HistoryItem } from "@/lib/types";
import { ArrowRight, Crown, FileText, Plus, Sparkles, Target, TrendingUp, Zap } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const { user } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [, force] = useState(0);
  useEffect(() => {
    setItems(getHistory());
    const h = () => force((x) => x + 1);
    window.addEventListener("apr:subscription-change", h);
    return () => window.removeEventListener("apr:subscription-change", h);
  }, []);
  const sub = user ? getSubscription(user.id) : null;

  const avgAts = items.length
    ? Math.round(items.reduce((a, i) => a + i.atsScore, 0) / items.length)
    : 0;

  const stats = [
    { label: "Total Analyses", value: items.length, icon: FileText },
    { label: "Average ATS", value: avgAts ? `${avgAts}%` : "—", icon: Target },
    { label: "Saved Reports", value: items.filter((i) => i.saved).length, icon: Sparkles },
    { label: "Best Score", value: items.length ? `${Math.max(...items.map((i) => i.atsScore))}%` : "—", icon: TrendingUp },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Welcome back</h1>
          <p className="mt-1 text-muted-foreground">Here's your placement readiness overview.</p>
        </div>
        <Link to="/new">
          <Button variant="hero"><Plus className="h-4 w-4" /> New Analysis</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/60 bg-gradient-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-3 font-display text-3xl font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      {sub && (
        <Card className="border-border/60 bg-gradient-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {sub.plan === "pro" ? <Crown className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-display text-lg font-semibold">
                    {sub.plan === "pro" ? "Pro Plan" : "Free Plan"}
                  </p>
                  <Badge variant={sub.plan === "pro" ? "default" : "outline"} className="text-[10px]">
                    {sub.plan.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {sub.remaining} of {sub.limit} {sub.limit === 1 ? "analysis" : "analyses"} remaining this month
                </p>
              </div>
            </div>
            <div className="flex w-full max-w-xs flex-col gap-2 sm:items-end">
              <Progress value={(sub.used / sub.limit) * 100} className="w-full" />
              <Link to="/dashboard/subscription">
                <Button variant={sub.plan === "pro" ? "outline" : "hero"} size="sm">
                  {sub.plan === "pro" ? "Manage plan" : <><Zap className="h-3.5 w-3.5" /> Upgrade to Pro</>}
                </Button>
              </Link>
            </div>
          </div>
          {!sub.canAnalyze && sub.plan === "free" && (
            <div className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
              You've used your free analysis for this month. Upgrade to Pro for 10 analyses/month.
            </div>
          )}
        </Card>
      )}

      <Card className="border-border/60 bg-gradient-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold">Recent Analyses</h2>
            <p className="text-sm text-muted-foreground">Your last placement readiness reports</p>
          </div>
          <Link to="/dashboard/history">
            <Button variant="ghost" size="sm">View all <ArrowRight className="h-3.5 w-3.5" /></Button>
          </Link>
        </div>

        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-6 divide-y divide-border/60">
            {items.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                to="/results/$id"
                params={{ id: item.id }}
                className="flex items-center justify-between gap-4 py-4 transition-colors hover:bg-accent/40"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.jobTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()} · {item.role}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono">{item.atsScore}%</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Sparkles className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">No analyses yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Upload your resume and run your first AI placement analysis.
      </p>
      <Link to="/new" className="mt-6">
        <Button variant="hero"><Plus className="h-4 w-4" /> Start your first analysis</Button>
      </Link>
    </div>
  );
}
