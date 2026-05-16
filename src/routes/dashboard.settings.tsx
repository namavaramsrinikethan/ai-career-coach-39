import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/lib/theme";
import { getWebhookUrl, setWebhookUrl } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, toggle } = useTheme();
  const [url, setUrl] = useState("");

  useEffect(() => setUrl(getWebhookUrl()), []);

  const save = () => {
    setWebhookUrl(url.trim());
    toast.success("Webhook URL saved");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-muted-foreground">Configure your AI workflow & preferences.</p>
      </div>

      <Card className="border-border/60 bg-gradient-card p-6">
        <h2 className="font-display text-lg font-semibold">n8n Webhook</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The endpoint that processes your resume + job description and returns the analysis JSON.
        </p>
        <div className="mt-5 space-y-2">
          <Label htmlFor="webhook">Webhook URL</Label>
          <Input
            id="webhook"
            placeholder="https://your-n8n.app/webhook/placement-analysis"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to use a demo response for testing.
          </p>
        </div>
        <Button onClick={save} variant="hero" className="mt-5">Save</Button>
      </Card>

      <Card className="border-border/60 bg-gradient-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Appearance</h2>
            <p className="text-sm text-muted-foreground">Toggle dark mode.</p>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={toggle} />
        </div>
      </Card>
    </div>
  );
}
