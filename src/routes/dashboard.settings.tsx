import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, toggle } = useTheme();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your preferences.</p>
      </div>

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
