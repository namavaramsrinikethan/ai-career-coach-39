import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useRef, type DragEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FileUp, Sparkles, ArrowLeft, Loader2, FileText, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getWebhookUrl, saveHistoryItem } from "@/lib/storage";
import type { AnalysisResponse, HistoryItem } from "@/lib/types";
import { mockAnalysis } from "@/lib/mock";
import { normalizeWebhookResponse } from "@/lib/normalize";
import { setPdfCache, base64ToPdfBlob } from "@/lib/pdf-cache";
import { RequireAuth, useAuth } from "@/lib/auth";
import { getSubscription, incrementUsage } from "@/lib/subscription";

export const Route = createFileRoute("/new")({
  component: NewAnalysisGuarded,
  head: () => ({
    meta: [
      { title: "New Analysis — PlacementAI" },
      { name: "description", content: "Upload your resume and run an AI-powered placement readiness analysis." },
    ],
  }),
});

function NewAnalysisGuarded() {
  return (
    <RequireAuth>
      <NewAnalysis />
    </RequireAuth>
  );
}


const STAGES = [
  "Uploading resume...",
  "Extracting resume data...",
  "Fetching job requirements...",
  "Running AI skill analysis...",
  "Generating ATS score...",
  "Creating modified resume...",
];

const DOMAINS = [
  "Frontend",
  "Backend",
  "Full Stack",
  "AI/ML",
  "Data Science",
  "DevOps",
  "Cybersecurity",
];

const ROLE_LABELS: Record<string, string> = {
  internship: "Internship",
  fulltime: "Full-Time Job",
  placement: "Placement Drive",
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function NewAnalysis() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const sub = user ? getSubscription(user.id) : null;
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [jobUrl, setJobUrl] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [role, setRole] = useState("internship");
  const [domain, setDomain] = useState("Frontend");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (f: File | null) => {
    if (!f) return;
    const ok = /\.(pdf|docx)$/i.test(f.name);
    if (!ok) return toast.error("Please upload a PDF or DOCX file");
    if (f.size > 10 * 1024 * 1024) return toast.error("File must be under 10MB");
    setFile(f);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const submit = async () => {
    if (!file) return toast.error("Please upload your resume");
    if (!jobUrl.trim() && !jobDesc.trim()) return toast.error("Add a job URL or description");
    if (user) {
      const fresh = getSubscription(user.id);
      if (!fresh.canAnalyze) {
        toast.error(
          fresh.plan === "free"
            ? "Free plan limit reached. Upgrade to Pro for 100 analyses/month."
            : "You've used all analyses for this month."
        );
        navigate({ to: "/dashboard/subscription" });
        return;
      }
    }

    setLoading(true);
    setStage(0);
    setError(null);
    const stageTimer = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1));
    }, 900);

    try {
      const webhook = getWebhookUrl();
      let result: AnalysisResponse;
      let rawResponse: unknown = null;
      const jobTitle = jobUrl || jobDesc.slice(0, 60) || "Untitled role";

      if (webhook) {
        const resumeBase64 = await fileToBase64(file);
        const payload = {
          resumeFile: {
            name: file.name,
            type: file.type,
            size: file.size,
            base64: resumeBase64,
          },
          jobUrl,
          jobDescription: jobDesc,
          roleType: ROLE_LABELS[role] ?? role,
          domain,
          timestamp: new Date().toISOString(),
        };

        const res = await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Webhook error ${res.status}`);
        const text = await res.text();
        try { rawResponse = JSON.parse(text); } catch { rawResponse = text; }
        result = normalizeWebhookResponse(rawResponse);
      } else {
        await new Promise((r) => setTimeout(r, 4500));
        result = mockAnalysis(jobTitle);
        rawResponse = result;
        toast.info("Showing demo analysis.");
      }

      const id = crypto.randomUUID();
      const rawObj = rawResponse && typeof rawResponse === "object" ? (rawResponse as any) : {};
      const modifiedPdf =
        rawObj.pdf_base64 ?? rawObj.pdfBase64 ?? rawObj.resumePdfBase64 ?? rawObj?.json?.pdf_base64 ?? "";
      const modifiedB64Clean = typeof modifiedPdf === "string" ? modifiedPdf.replace(/^data:.*;base64,/, "") : "";
      const originalBase64 = file.type === "application/pdf" || /\.pdf$/i.test(file.name)
        ? await fileToBase64(file)
        : undefined;

      // Pass exact File + decoded Blob in-memory so results page can createObjectURL directly
      setPdfCache(id, {
        originalFile: file,
        modifiedBlob: modifiedB64Clean ? base64ToPdfBlob(modifiedB64Clean) ?? undefined : undefined,
      });

      const item: HistoryItem = {
        id,
        createdAt: new Date().toISOString(),
        role,
        jobTitle,
        atsScore: Number(result.atsScore) || 0,
        result,
        rawResponse,
        originalResumeBase64: originalBase64,
        originalResumeMime: file.type || "application/pdf",
        modifiedResumePdfBase64: modifiedB64Clean,
      };
      saveHistoryItem(item);
      clearInterval(stageTimer);
      navigate({ to: "/results/$id", params: { id } });
    } catch (e) {
      clearInterval(stageTimer);
      const msg = e instanceof Error ? e.message : "Analysis failed. Please try again.";
      setError(msg);
      setLoading(false);
      toast.error("Analysis failed. Please try again.");
    }
  };

  if (loading) return <LoadingState stage={stage} />;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Dashboard</Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold">New Analysis</h1>
          <p className="mt-2 text-muted-foreground">
            Upload your resume and a job to receive an AI-powered placement readiness report.
          </p>
        </div>

        <Card className="border-border/60 bg-gradient-card p-6 md:p-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Resume (PDF or DOCX)</Label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                  dragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-accent/30"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <FileUp className="h-6 w-6" />
                    </div>
                    <p className="font-medium">Drag & drop or click to upload</p>
                    <p className="text-xs text-muted-foreground">PDF or DOCX · Max 10MB</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Job / Internship URL</Label>
              <Input
                id="url"
                placeholder="https://company.com/careers/frontend-intern"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Job Description (optional)</Label>
              <Textarea
                id="desc"
                placeholder="Paste the full job description for the best results…"
                rows={6}
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Role Type</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="fulltime">Full-Time Job</SelectItem>
                    <SelectItem value="placement">Placement Drive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Domain</Label>
                <Select value={domain} onValueChange={setDomain}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOMAINS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
                <p className="font-medium text-destructive">Analysis failed. Please try again.</p>
                <p className="mt-1 text-xs text-muted-foreground">{error}</p>
              </div>
            )}

            <Button onClick={submit} variant="hero" size="lg" className="w-full">
              <Sparkles className="h-4 w-4" /> {error ? "Retry Analysis" : "Analyze Placement Readiness"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function LoadingState({ stage }: { stage: number }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute inset-0 bg-gradient-hero opacity-60" />
      <Card className="relative w-full max-w-md border-border/60 bg-gradient-card p-10 text-center shadow-glow">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow animate-pulse-glow">
          <Loader2 className="h-7 w-7 animate-spin text-primary-foreground" />
        </div>
        <h2 className="mt-6 font-display text-2xl font-bold">Analyzing your resume using AI...</h2>
        <p className="mt-2 text-sm text-muted-foreground">Our AI agent is processing your placement readiness report.</p>
        <ul className="mt-8 space-y-3 text-left">
          {STAGES.map((s, i) => (
            <li key={s} className="flex items-center gap-3 text-sm">
              {i < stage ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : i === stage ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <span className="h-4 w-4 rounded-full border border-border" />
              )}
              <span className={i <= stage ? "text-foreground" : "text-muted-foreground"}>{s}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
