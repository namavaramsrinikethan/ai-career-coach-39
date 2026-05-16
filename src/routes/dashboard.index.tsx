import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getHistory } from "@/lib/storage";
import type { HistoryItem } from "@/lib/types";
import { ArrowRight, FileText, Plus, Sparkles, Target, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  useEffect(() => setItems(getHistory()), []);

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
