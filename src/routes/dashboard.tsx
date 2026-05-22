import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Plus, History, Bookmark, Settings, Sparkles, Moon, Sun, ArrowLeft, LogOut, CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { useAuth, RequireAuth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  component: DashboardGuarded,
  head: () => ({
    meta: [
      { title: "Dashboard — PlacementAI" },
      { name: "description", content: "Your placement readiness analytics, history, and saved reports." },
    ],
  }),
});

function DashboardGuarded() {
  return (
    <RequireAuth>
      <DashboardLayout />
    </RequireAuth>
  );
}


type NavItem = {
  to: "/new" | "/dashboard" | "/dashboard/history" | "/dashboard/saved" | "/dashboard/subscription" | "/dashboard/settings";
  label: string;
  icon: typeof Plus;
  primary?: boolean;
  exact?: boolean;
};

const navItems: NavItem[] = [
  { to: "/new", label: "New Analysis", icon: Plus, primary: true },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/history", label: "History", icon: History },
  { to: "/dashboard/saved", label: "Saved Reports", icon: Bookmark },
  { to: "/dashboard/subscription", label: "Subscription", icon: CreditCard },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

function DashboardLayout() {
  const { theme, toggle } = useTheme();
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border/40 bg-sidebar/60 backdrop-blur-xl md:flex">
        <Link to="/" className="flex h-16 items-center gap-2 border-b border-border/40 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold">PlacementAI</span>
        </Link>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const active = item.exact ? path === item.to : path.startsWith(item.to);
            if (item.primary) {
              return (
                <Link key={item.to} to={item.to}>
                  <Button variant="hero" className="mb-3 w-full justify-start">
                    <item.icon className="h-4 w-4" /> {item.label}
                  </Button>
                </Link>
              );
            }
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/40 p-4">
          <Link to="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to landing
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/40 bg-background/70 px-6 backdrop-blur-xl">
          <div className="md:hidden">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold">PlacementAI</span>
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Link to="/new">
              <Button variant="hero" size="sm" className="md:hidden">
                <Plus className="h-4 w-4" /> New
              </Button>
            </Link>
            <UserMenu />
          </div>

        </header>

        <main className="flex-1 p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function UserMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const initial = (user.email ?? "?").charAt(0).toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">
              {initial}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Signed in as</span>
            <span className="truncate text-sm font-medium">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
          <LayoutDashboard className="h-4 w-4" /> Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            await signOut();
            toast.success("Signed out");
            navigate({ to: "/" });
          }}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

