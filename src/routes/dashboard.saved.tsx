import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getHistory } from "@/lib/storage";
import type { HistoryItem } from "@/lib/types";
import { ArrowRight, BookmarkCheck } from "lucide-react";

export const Route = createFileRoute("/dashboard/saved")({
  component: SavedPage,
});

function SavedPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  useEffect(() => setItems(getHistory().filter((i) => i.saved)), []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Saved Reports</h1>
        <p className="mt-1 text-muted-foreground">Reports you've bookmarked for quick access.</p>
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed bg-transparent p-12 text-center text-muted-foreground">
          No saved reports yet. Open a report and tap the bookmark icon.
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <Card key={item.id} className="flex items-center gap-4 border-border/60 bg-gradient-card p-5">
              <BookmarkCheck className="h-5 w-5 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.jobTitle}</p>
                <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
              <Badge variant="outline" className="font-mono">{item.atsScore}%</Badge>
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
