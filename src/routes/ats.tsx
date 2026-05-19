import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState, type DragEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, FileUp, FileText, X, Loader2, Sparkles, CheckCircle2,
  AlertTriangle, Download, Code2, Target, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { getWebhookUrl } from "@/lib/storage";

export const Route = createFileRoute("/ats")({
  component: AtsPage,
  head: () => ({
    meta: [
      { title: "ATS Resume Score — PlacementAI" },
      { name: "description", content: "Get an instant ATS score, matched skills, gaps, and a tailored resume." },
    ],
  }),
});

interface AtsProject {
  name?: string;
  title?: string;
  description?: string;
  reason?: string;
  tech_stack?: string[];
  techStack?: string[];
}

interface AtsResult {
  ats_score: number;
  ats_level: string;
  matched_skills: string[];
  missing_skills: string[];
  strengths: string[];
  areas_to_improve: string[];
  recommended_projects: AtsProject[];
  pdf_base64?: string;
}

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = r.result as string;
      resolve(s.split(",")[1] ?? s);
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

const asArray = (v: unknown): any[] => (Array.isArray(v) ? v : v == null ? [] : [v]);
const asStrings = (v: unknown): string[] =>
  asArray(v).map((x) => (typeof x === "string" ? x : x?.name ?? x?.label ?? JSON.stringify(x)));

function normalize(input: unknown): AtsResult {
  let raw: any = input;
  if (Array.isArray(raw)) raw = raw[0] ?? {};
  if (raw && typeof raw === "object") raw = raw.json ?? raw.data ?? raw.output ?? raw.result ?? raw.response ?? raw;
  if (typeof raw === "string") { try { raw = JSON.parse(raw); } catch { raw = {}; } }
  raw = raw ?? {};
  return {
    ats_score: Number(raw.ats_score ?? raw.atsScore ?? 0) || 0,
    ats_level: String(raw.ats_level ?? raw.atsLevel ?? ""),
    matched_skills: asStrings(raw.matched_skills ?? raw.matchedSkills),
    missing_skills: asStrings(raw.missing_skills ?? raw.missingSkills),
    strengths: asStrings(raw.strengths),
    areas_to_improve: asStrings(raw.areas_to_improve ?? raw.areasToImprove ?? raw.weaknesses),
    recommended_projects: asArray(raw.recommended_projects ?? raw.recommendedProjects),
    pdf_base64: raw.pdf_base64 ?? raw.pdfBase64 ?? raw.modifiedResume?.pdf_base64,
  };
}

function scoreTone(score: number) {
  if (score >= 75) return { ring: "var(--color-success)", text: "text-success", bg: "bg-success/10" };
  if (score >= 50) return { ring: "var(--color-warning)", text: "text-warning", bg: "bg-warning/10" };
  return { ring: "var(--color-danger)", text: "text-danger", bg: "bg-danger/10" };
}

function downloadPdfFromBase64(base64: string, filename = "ai-resume.pdf") {
  try {
    const clean = base64.replace(/^data:application\/pdf;base64,/, "");
    const bin = atob(clean);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  } catch {
    toast.error("Could not decode PDF data.");
  }
}

function AtsPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [jobDesc, setJobDesc] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AtsResult | null>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!/\.pdf$/i.test(f.name)) return toast.error("Please upload a PDF");
    if (f.size > 10 * 1024 * 1024) return toast.error("File must be under 10MB");
    setFile(f);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const submit = async () => {
    if (!file) return toast.error("Please upload your resume PDF");
    if (!jobDesc.trim()) return toast.error("Paste the job description");
    setLoading(true); setError(null); setResult(null);
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch(getWebhookUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeFile: { name: file.name, type: file.type, size: file.size, base64 },
          jobDescription: jobDesc,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(`Webhook error ${res.status}`);
      const text = await res.text();
      let payload: unknown;
      try { payload = JSON.parse(text); } catch { payload = text; }
      setResult(normalize(payload));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      toast.error("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Dashboard</Button></Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> ATS Resume Score
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl space-y-8 px-4 py-10">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Instant ATS Score</h1>
          <p className="mt-2 text-muted-foreground">Upload your resume and paste a job description — AI returns your score, skill match, and a tailored resume PDF.</p>
        </div>

        <Card className="border-border/60 bg-gradient-card p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Resume (PDF)</Label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative h-full min-h-[180px] cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/30"}`}
              >
                <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <FileUp className="h-6 w-6" />
                    </div>
                    <p className="font-medium">Drag & drop or click to upload</p>
                    <p className="text-xs text-muted-foreground">PDF only · Max 10MB</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jd">Job Description</Label>
              <Textarea id="jd" rows={9} placeholder="Paste the full job description here…" value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} className="min-h-[180px]" />
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
              <p className="font-medium text-destructive">Request failed</p>
              <p className="mt-1 text-xs text-muted-foreground">{error}</p>
            </div>
          )}

          <Button onClick={submit} variant="hero" size="lg" className="mt-6 w-full" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</> : <><Sparkles className="h-4 w-4" /> Get ATS Score</>}
          </Button>
        </Card>

        {result && <ResultView r={result} />}
      </div>
    </div>
  );
}

function ResultView({ r }: { r: AtsResult }) {
  const tone = useMemo(() => scoreTone(r.ats_score), [r.ats_score]);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center border-border/60 bg-gradient-card p-8 shadow-glow lg:col-span-1">
          <ScoreRing value={r.ats_score} ring={tone.ring} />
          <div className={`mt-5 rounded-full px-4 py-1 text-xs font-semibold ${tone.bg} ${tone.text}`}>
            {r.ats_level || "Score"}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">ATS Compatibility</p>
        </Card>

        <Card className="border-border/60 bg-gradient-card p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="font-display font-semibold">Skill Coverage</h3>
          </div>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <SkillBlock title="Matched Skills" tone="success" items={r.matched_skills} icon={CheckCircle2} />
            <SkillBlock title="Missing Skills" tone="danger" items={r.missing_skills} icon={X} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-success/30 bg-success/5 p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <h3 className="font-display font-semibold">Strengths</h3>
            <Badge variant="outline" className="ml-auto">{r.strengths.length}</Badge>
          </div>
          <ul className="mt-4 space-y-3">
            {r.strengths.length === 0 && <li className="text-sm text-muted-foreground">None reported</li>}
            {r.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {s}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="border-warning/30 bg-warning/5 p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h3 className="font-display font-semibold">Areas to Improve</h3>
            <Badge variant="outline" className="ml-auto">{r.areas_to_improve.length}</Badge>
          </div>
          <ul className="mt-4 space-y-3">
            {r.areas_to_improve.length === 0 && <li className="text-sm text-muted-foreground">None reported</li>}
            {r.areas_to_improve.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" /> {s}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {r.recommended_projects.length > 0 && (
        <div>
          <h3 className="font-display text-xl font-semibold">Recommended Projects</h3>
          <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {r.recommended_projects.map((p, i) => {
              const stack = p.tech_stack ?? p.techStack ?? [];
              return (
                <Card key={i} className="group border-border/60 bg-gradient-card p-6 transition-all hover:border-primary/40 hover:shadow-glow">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Code2 className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">#{i + 1}</Badge>
                  </div>
                  <h4 className="mt-4 font-display text-lg font-semibold">{p.name ?? p.title ?? "Project"}</h4>
                  <p className="mt-2 text-sm text-muted-foreground">{p.description ?? p.reason ?? ""}</p>
                  {stack.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {stack.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <Card className="flex flex-col items-start justify-between gap-4 border-primary/30 bg-gradient-card p-6 shadow-glow md:flex-row md:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">AI-Modified Resume</h3>
            <p className="text-sm text-muted-foreground">{r.pdf_base64 ? "Optimized PDF ready to download" : "No PDF returned by the workflow"}</p>
          </div>
        </div>
        <Button
          variant="hero"
          disabled={!r.pdf_base64}
          onClick={() => r.pdf_base64 && downloadPdfFromBase64(r.pdf_base64)}
        >
          <Download className="h-4 w-4" /> Download Resume
        </Button>
      </Card>
    </div>
  );
}

function SkillBlock({ title, tone, items, icon: Icon }: { title: string; tone: "success" | "danger"; items: string[]; icon: typeof CheckCircle2 }) {
  const dot = tone === "success" ? "text-success" : "text-danger";
  const badge = tone === "success"
    ? "border-success/40 bg-success/10 text-success"
    : "border-danger/40 bg-danger/10 text-danger";
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${dot}`} />
        <p className="text-sm font-medium">{title}</p>
        <Badge variant="outline" className="ml-auto">{items.length}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {items.length === 0 && <span className="text-xs text-muted-foreground">None</span>}
        {items.map((s, i) => (
          <span key={i} className={`rounded-md border px-2 py-0.5 text-xs ${badge}`}>{s}</span>
        ))}
      </div>
    </div>
  );
}

function ScoreRing({ value, ring }: { value: number; ring: string }) {
  const radius = 80;
  const c = 2 * Math.PI * radius;
  const offset = c - (Math.max(0, Math.min(100, value)) / 100) * c;
  return (
    <div className="relative flex items-center justify-center">
      <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90">
        <circle cx="100" cy="100" r={radius} stroke="var(--color-border)" strokeWidth="14" fill="none" />
        <circle
          cx="100" cy="100" r={radius} stroke={ring} strokeWidth="14" fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl font-bold" style={{ color: ring }}>{value}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}
