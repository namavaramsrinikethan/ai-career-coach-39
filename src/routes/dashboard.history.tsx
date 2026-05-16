import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getHistory, updateHistoryItem } from "@/lib/storage";
import type { HistoryItem } from "@/lib/types";
import { ArrowRight, Bookmark, BookmarkCheck, Trash2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  useEffect(() => setItems(getHistory()), []);

  const toggleSave = (id: string, saved: boolean) => {
    updateHistoryItem(id, { saved });
    setItems(getHistory());
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">History</h1>
        <p className="mt-1 text-muted-foreground">All your past placement readiness analyses.</p>
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed bg-transparent p-12 text-center text-muted-foreground">
          No history yet. <Link to="/new" className="text-primary underline-offset-4 hover:underline">Run your first analysis</Link>.
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <Card key={item.id} className="flex items-center gap-4 border-border/60 bg-gradient-card p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-display font-bold text-primary">
                {item.atsScore}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.jobTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
              <Badge variant="outline">{item.role}</Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleSave(item.id, !item.saved)}
                aria-label="Save"
              >
                {item.saved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
              </Button>
              <Link to="/results/$id" params={{ id: item.id }}>
                <Button variant="outline" size="sm">Open <ArrowRight className="h-3.5 w-3.5" /></Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
