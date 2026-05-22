import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Download, Sparkles, Target, BookOpen, Code2, CheckCircle2, XCircle,
  ExternalLink, FileText, Lightbulb, GraduationCap, AlertTriangle, Circle, Braces, Copy,
} from "lucide-react";
import { getHistoryItem } from "@/lib/storage";
import { normalizeWebhookResponse } from "@/lib/normalize";
import { getPdfCache, getModifiedPdfDataUrl } from "@/lib/pdf-cache";
import { PdfViewer } from "@/components/pdf-viewer";
import type { AnalysisResponse, HistoryItem } from "@/lib/types";
import { toast } from "sonner";
import { RequireAuth } from "@/lib/auth";

export const Route = createFileRoute("/results/$id")({
  component: ResultsGuarded,
  head: () => ({
    meta: [
      { title: "Analysis Results — PlacementAI" },
      { name: "description", content: "Your AI placement readiness analysis." },
    ],
  }),
});

function ResultsGuarded() {
  return (
    <RequireAuth>
      <Results />
    </RequireAuth>
  );
}


function Results() {
  const { id } = useParams({ from: "/results/$id" });
  const [item, setItem] = useState<HistoryItem | null>(null);
  const [originalSource, setOriginalSource] = useState<File | string | null>(null);
  const [modifiedSource, setModifiedSource] = useState<string | null>(null);

  useEffect(() => {
    const found = getHistoryItem(id);
    if (found) setItem(found);
  }, [id]);

  useEffect(() => {
    if (!item) return;
    const cached = getPdfCache(id);
    setOriginalSource(cached?.originalFile ?? item.originalResumeBase64 ?? null);
    const cachedModified = getModifiedPdfDataUrl(id);
    setModifiedSource(cachedModified ?? item.modifiedResumePdfBase64 ?? null);
  }, [item, id]);

  if (!item) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="p-10 text-center">
          <p className="text-muted-foreground">Report not found.</p>
          <Link to="/dashboard"><Button variant="hero" className="mt-4">Back to Dashboard</Button></Link>
        </Card>
      </div>
    );
  }

  const r = item.rawResponse ? normalizeWebhookResponse(item.rawResponse) : item.result;
  const ats = Number(r.atsScore) || 0;
  const match = Number(r.skillMatchPercentage) || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Dashboard</Button></Link>
          <Link to="/new"><Button variant="hero" size="sm"><Sparkles className="h-4 w-4" /> New Analysis</Button></Link>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl space-y-8 px-4 py-10">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">{item.jobTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(item.createdAt).toLocaleString()} · {item.role}
          </p>
        </div>

        {/* Top stats */}
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="flex flex-col items-center justify-center border-border/60 bg-gradient-card p-8 shadow-glow">
            <CircularScore value={ats} label="ATS Score" />
          </Card>
          <Card className="flex flex-col items-center justify-center border-border/60 bg-gradient-card p-8">
            <CircularScore value={match} label="Skill Match" accent="secondary" />
          </Card>
          <Card className="border-border/60 bg-gradient-card p-6">
            <p className="text-xs text-muted-foreground">Quick Summary</p>
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-sm">{r.resumeAnalysis.strengths.length} strengths identified</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm">{r.resumeAnalysis.weaknesses.length} areas to improve</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-danger" />
                <span className="text-sm">{r.missingSkills.length} missing skills</span>
              </div>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <span className="text-sm">{r.recommendedProjects.length} recommended projects</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="resume" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="resume"><Sparkles className="mr-1 h-3.5 w-3.5" />AI Resume</TabsTrigger>
            <TabsTrigger value="skills"><Target className="mr-1 h-3.5 w-3.5" />Skills</TabsTrigger>
            <TabsTrigger value="projects"><Code2 className="mr-1 h-3.5 w-3.5" />Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="resume" className="mt-6"><AiResumeSection r={r} originalSource={originalSource} modifiedSource={modifiedSource} /></TabsContent>
          <TabsContent value="skills" className="mt-6"><SkillsSection r={r} /></TabsContent>
          <TabsContent value="projects" className="mt-6"><ProjectsSection r={r} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function RawSection({ raw }: { raw: unknown }) {
  const text = typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); toast.success("Copied raw response"); }
    catch { toast.error("Copy failed"); }
  };
  return (
    <Card className="border-border/60 bg-gradient-card">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
        <div>
          <p className="font-display text-sm font-semibold">Raw Webhook Response</p>
          <p className="text-xs text-muted-foreground">Exactly what your n8n "Respond to Webhook" node returned</p>
        </div>
        <Button variant="outline" size="sm" onClick={copy}><Copy className="h-3.5 w-3.5" /> Copy</Button>
      </div>
      <pre className="max-h-[640px] overflow-auto p-5 font-mono text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap break-all">
        {text || "No response captured."}
      </pre>
    </Card>
  );
}

function CircularScore({ value, label, accent = "primary" }: { value: number; label: string; accent?: "primary" | "secondary" }) {
  const radius = 70;
  const c = 2 * Math.PI * radius;
  const offset = c - (value / 100) * c;
  const color = accent === "primary" ? "var(--color-primary)" : "var(--color-primary-glow)";

  return (
    <div className="relative flex flex-col items-center">
      <svg width="170" height="170" viewBox="0 0 170 170" className="-rotate-90">
        <circle cx="85" cy="85" r={radius} stroke="var(--color-border)" strokeWidth="10" fill="none" />
        <circle
          cx="85" cy="85" r={radius}
          stroke={color} strokeWidth="10" fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-bold text-gradient">{value}%</span>
        <span className="mt-1 text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

function SkillsSection({ r }: { r: AnalysisResponse }) {
  const present = r.modifiedResume.redYellowGreenMap.green;
  const partial = r.modifiedResume.redYellowGreenMap.yellow;
  const missing = r.missingSkills;

  return (
    <div className="grid gap-5 md:grid-cols-3">
      <SkillCard title="Present Skills" tone="success" items={present} icon={CheckCircle2} />
      <SkillCard title="Partial / Improve" tone="warning" items={partial} icon={AlertTriangle} />
      <SkillCard title="Missing Skills" tone="danger" items={missing} icon={XCircle} />
    </div>
  );
}

function SkillCard({ title, tone, items, icon: Icon }: {
  title: string; tone: "success" | "warning" | "danger"; items: string[]; icon: typeof CheckCircle2;
}) {
  const toneClass = {
    success: "border-success/30 bg-success/5",
    warning: "border-warning/30 bg-warning/5",
    danger: "border-danger/30 bg-danger/5",
  }[tone];
  const dotClass = { success: "text-success", warning: "text-warning", danger: "text-danger" }[tone];

  return (
    <Card className={`border ${toneClass} p-5`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${dotClass}`} />
        <h3 className="font-display font-semibold">{title}</h3>
        <Badge variant="outline" className="ml-auto">{items.length}</Badge>
      </div>
      <ul className="mt-4 space-y-2">
        {items.length === 0 && <li className="text-sm text-muted-foreground">None</li>}
        {items.map((s) => (
          <li key={s} className="flex items-center gap-2 text-sm">
            <Circle className={`h-2 w-2 fill-current ${dotClass}`} />
            {s}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ProjectsSection({ r }: { r: AnalysisResponse }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {r.recommendedProjects.map((p, i) => (
        <Card key={i} className="group border-border/60 bg-gradient-card p-6 transition-all hover:border-primary/40 hover:shadow-glow">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Code2 className="h-5 w-5" />
            </div>
            <Badge variant="outline" className="font-mono text-[10px]">#{i + 1}</Badge>
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold">{p.name}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{p.reason}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {p.techStack.map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function RoadmapSection({ r }: { r: AnalysisResponse }) {
  return (
    <div className="space-y-5">
      {r.learningRoadmap.map((s, i) => (
        <Card key={i} className="border-border/60 bg-gradient-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-primary font-display font-bold text-primary-foreground">
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-semibold">{s.skill}</h3>
                <Badge variant="outline">{s.difficulty}</Badge>
              </div>
              <ol className="mt-4 space-y-2">
                {s.steps.map((step, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {step}
                  </li>
                ))}
              </ol>
              {s.resources.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {s.resources.map((res) => (
                    <a
                      key={res.url}
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs hover:border-primary/40 hover:text-primary"
                    >
                      <BookOpen className="h-3 w-3" /> {res.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function AiResumeSection({ r, originalSource, modifiedSource }: { r: AnalysisResponse; originalSource: File | string | null; modifiedSource: string | null }) {
  const ryg = r.modifiedResume.redYellowGreenMap;

  const download = (url: string, ext: string) => {
    if (!url) {
      toast.error(`No ${ext.toUpperCase()} download available from your webhook yet.`);
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-resume.${ext}`;
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Download CTA bar */}
      <Card className="flex flex-col items-start justify-between gap-4 border-primary/30 bg-gradient-card p-6 shadow-glow md:flex-row md:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">AI Generated Modified Resume</h3>
            <p className="text-sm text-muted-foreground">Optimized for your target role · ready to download instantly</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="hero" onClick={() => download(r.modifiedResume.downloadUrlPDF, "pdf")}>
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </Card>

      {/* RYG legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <LegendDot tone="danger" label={`Missing / Weak (${ryg.red.length})`} />
        <LegendDot tone="warning" label={`Improve (${ryg.yellow.length})`} />
        <LegendDot tone="success" label={`Strong (${ryg.green.length})`} />
      </div>

      {/* Side by side */}
      <div className="grid gap-5 lg:grid-cols-2">
        <PdfPanel title="Original Resume" subtitle="What you uploaded" source={originalSource} fallback="Original resume preview unavailable." muted />
        <PdfPanel title="AI Modified Resume" subtitle="Optimized for the target role" source={modifiedSource} fallback="AI modified resume preview unavailable." />
      </div>

      {/* RYG breakdown */}
      <div className="grid gap-5 md:grid-cols-3">
        <RygCard tone="danger" title="Red — Missing or Weak" items={ryg.red} />
        <RygCard tone="warning" title="Yellow — Improve" items={ryg.yellow} />
        <RygCard tone="success" title="Green — Strong" items={ryg.green} />
      </div>
    </div>
  );
}

function LegendDot({ tone, label }: { tone: "danger" | "warning" | "success"; label: string }) {
  const c = { danger: "bg-danger", warning: "bg-warning", success: "bg-success" }[tone];
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1">
      <span className={`h-2 w-2 rounded-full ${c}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function PdfPanel({ title, subtitle, source, fallback, muted }: {
  title: string; subtitle: string; source: File | string | null; fallback: string; muted?: boolean;
}) {
  return (
    <Card className={`overflow-hidden border-border/60 ${muted ? "bg-card/40" : "bg-gradient-card"} flex flex-col`}>
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
        <div>
          <p className="font-display text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <FileText className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <PdfViewer source={source} fallback={fallback} width={500} />
      </div>
    </Card>
  );
}

function ResumePanel({ title, subtitle, text, ryg, muted }: {
  title: string; subtitle: string; text: string;
  ryg?: AnalysisResponse["modifiedResume"]["redYellowGreenMap"];
  muted?: boolean;
}) {
  return (
    <Card className={`overflow-hidden border-border/60 ${muted ? "bg-card/40" : "bg-gradient-card"} flex flex-col`}>
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
        <div>
          <p className="font-display text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <FileText className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="max-h-[600px] flex-1 overflow-auto p-5">
        <ResumeText text={text} ryg={ryg} />
      </div>
    </Card>
  );
}

function ResumeText({ text, ryg }: { text: string; ryg?: AnalysisResponse["modifiedResume"]["redYellowGreenMap"] }) {
  if (!ryg) {
    return <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground">{text}</pre>;
  }

  // Highlight matching keywords with RYG colors
  const buildPattern = (terms: string[]) =>
    terms.length ? new RegExp(`\\b(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "gi") : null;

  const greenRe = buildPattern(ryg.green);
  const yellowRe = buildPattern(ryg.yellow);
  const redRe = buildPattern(ryg.red);

  const highlight = (line: string, key: number) => {
    const parts: Array<{ s: string; cls: string }> = [{ s: line, cls: "" }];
    const apply = (re: RegExp | null, cls: string) => {
      if (!re) return;
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].cls) continue;
        const segs = parts[i].s.split(re);
        if (segs.length <= 1) continue;
        const expanded: typeof parts = [];
        segs.forEach((seg, j) => {
          if (!seg) return;
          expanded.push({ s: seg, cls: j % 2 === 1 ? cls : "" });
        });
        parts.splice(i, 1, ...expanded);
        i += expanded.length - 1;
      }
    };
    apply(greenRe, "bg-success/20 text-success px-0.5 rounded");
    apply(yellowRe, "bg-warning/20 text-warning px-0.5 rounded");
    apply(redRe, "bg-danger/20 text-danger px-0.5 rounded");
    return (
      <div key={key} className="font-mono text-xs leading-relaxed">
        {parts.map((p, i) => (
          <span key={i} className={p.cls}>{p.s}</span>
        ))}
      </div>
    );
  };

  return <div className="space-y-1">{text.split("\n").map((line, i) => highlight(line || " ", i))}</div>;
}

function RygCard({ tone, title, items }: { tone: "danger" | "warning" | "success"; title: string; items: string[] }) {
  const toneClass = {
    danger: "border-danger/30 bg-danger/5",
    warning: "border-warning/30 bg-warning/5",
    success: "border-success/30 bg-success/5",
  }[tone];
  const dotClass = { danger: "bg-danger", warning: "bg-warning", success: "bg-success" }[tone];

  return (
    <Card className={`border ${toneClass} p-5`}>
      <h4 className="font-display text-sm font-semibold">{title}</h4>
      <ul className="mt-3 space-y-2">
        {items.length === 0 && <li className="text-sm text-muted-foreground">None</li>}
        {items.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
            {s}
          </li>
        ))}
      </ul>
    </Card>
  );
}
