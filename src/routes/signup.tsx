import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Loader2, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({
    meta: [
      { title: "Create account — PlacementAI" },
      { name: "description", content: "Create your PlacementAI account to analyze your resume." },
    ],
  }),
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  path: ["confirm"], message: "Passwords don't match",
});

function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email, password, confirm });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await signUp(parsed.data.email, parsed.data.password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    toast.success("Account created!");
    navigate({ to: "/dashboard" });
  };

  return (
    <AuthShell title="Create your account" subtitle="Start analyzing resumes in under a minute.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field id="email" label="Email" icon={Mail} type="email" autoComplete="email"
          value={email} onChange={setEmail} placeholder="you@example.com" />
        <Field id="password" label="Password" icon={Lock} type="password" autoComplete="new-password"
          value={password} onChange={setPassword} placeholder="At least 6 characters" />
        <Field id="confirm" label="Confirm password" icon={Lock} type="password" autoComplete="new-password"
          value={confirm} onChange={setConfirm} placeholder="Repeat password" />
        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" variant="hero" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
