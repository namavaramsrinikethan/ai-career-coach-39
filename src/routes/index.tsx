import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles, FileText, Target, GraduationCap, Download, Check, Upload,
  Brain, Zap, ShieldCheck, ArrowRight, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PublicPricing } from "./dashboard.subscription";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "AI Placement Readiness Agent — Land your dream internship" },
      { name: "description", content: "Upload your resume + job link. Get ATS score, skill gaps, projects, roadmap, and an AI-rewritten resume in seconds." },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Hero />
      <LogoStrip />
      <Features />
      <HowItWorks />
      <ResumeShowcase />
      <Pricing />
      <Testimonials />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="container relative mx-auto max-w-7xl px-4 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-6 gap-1.5 border-primary/30 bg-primary/5 py-1.5 text-xs">
            <Sparkles className="h-3 w-3 text-primary" />
            Powered by AI · n8n workflow automation
          </Badge>
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Land the internship<br />
            <span className="text-gradient">you actually want.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Upload your resume + paste any job link. Our AI returns an ATS score, skill gap analysis,
            recommended projects, a learning roadmap, and a <span className="text-foreground font-medium">fully rewritten resume</span> — ready to download.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/new">
              <Button variant="hero" size="xl" className="group">
                Analyze My Resume
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="xl">View Dashboard</Button>
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> PDF exports</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> ATS-optimized</span>
          </div>
        </div>

        <div className="relative mx-auto mt-20 max-w-5xl">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-primary opacity-20 blur-3xl" />
          <Card className="relative overflow-hidden border-border/60 bg-gradient-card p-1 shadow-elegant">
            <div className="rounded-xl border border-border/60 bg-background/60 p-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-lg border border-border/60 bg-card p-5">
                  <p className="text-xs text-muted-foreground">ATS Score</p>
                  <p className="mt-2 font-display text-4xl font-bold text-gradient">78%</p>
                  <p className="mt-1 text-xs text-success">+24 after AI rewrite</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-card p-5">
                  <p className="text-xs text-muted-foreground">Skill Match</p>
                  <p className="mt-2 font-display text-4xl font-bold">64%</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {["React", "TS", "Node"].map((s) => (
                      <span key={s} className="rounded-md bg-success/15 px-2 py-0.5 text-[10px] text-success">{s}</span>
                    ))}
                    {["Next.js", "Jest"].map((s) => (
                      <span key={s} className="rounded-md bg-danger/15 px-2 py-0.5 text-[10px] text-danger">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-card p-5">
                  <p className="text-xs text-muted-foreground">AI Resume</p>
                  <p className="mt-2 font-display text-base font-medium">Ready to download</p>
                  <div className="mt-3 flex gap-2">
                    <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] text-primary">PDF</span>
                    <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] text-primary">DOCX</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function LogoStrip() {
  return (
    <section className="border-y border-border/40 bg-background/40 py-8">
      <div className="container mx-auto max-w-7xl px-4">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
          Trusted by students preparing for top placement drives
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-sm font-display font-semibold text-muted-foreground/70">
          {["IIT-Delhi", "NIT-Trichy", "BITS-Pilani", "VIT-Vellore", "DTU", "IIIT-Hyderabad"].map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

const features = [
  { icon: Brain, title: "ATS Score Analysis", desc: "Know exactly how recruiter systems will rank your resume — before you apply." },
  { icon: Target, title: "Skill Gap Detection", desc: "See missing skills, partial matches, and your strongest alignments at a glance." },
  { icon: Sparkles, title: "AI Resume Rewrite", desc: "Get a fully optimized version of your resume, color-coded by what we changed." },
  { icon: GraduationCap, title: "Learning Roadmap", desc: "Step-by-step learning path with curated resources for each missing skill." },
  { icon: Zap, title: "Project Recommendations", desc: "Build the exact projects recruiters look for in your target role." },
  { icon: ShieldCheck, title: "Download as PDF/DOCX", desc: "Export your AI-enhanced resume instantly in both formats." },
];

function Features() {
  return (
    <section id="features" className="py-24">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">Features</Badge>
          <h2 className="font-display text-4xl font-bold md:text-5xl">Everything you need to get hired</h2>
          <p className="mt-4 text-muted-foreground">
            From resume scoring to a downloadable AI-rewritten version, all in one workflow.
          </p>
        </div>
        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="group relative overflow-hidden border-border/60 bg-gradient-card p-6 transition-all hover:border-primary/40 hover:shadow-glow">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  { n: "01", icon: Upload, title: "Upload Resume", desc: "Drag & drop your PDF or DOCX resume." },
  { n: "02", icon: FileText, title: "Paste Job Link", desc: "Add the internship URL or paste a job description." },
  { n: "03", icon: Brain, title: "AI Analyzes", desc: "Our n8n + AI workflow scores, gaps, and rewrites." },
  { n: "04", icon: Download, title: "Download Resume", desc: "Get your enhanced resume in PDF or DOCX." },
];

function HowItWorks() {
  return (
    <section id="how" className="border-t border-border/40 bg-background/40 py-24">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">How it works</Badge>
          <h2 className="font-display text-4xl font-bold md:text-5xl">Four steps to a stronger resume</h2>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="relative">
              <Card className="h-full border-border/60 bg-gradient-card p-6">
                <span className="font-mono text-xs text-primary">{s.n}</span>
                <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ResumeShowcase() {
  return (
    <section className="py-24">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <Badge variant="outline" className="mb-4">AI Modified Resume</Badge>
            <h2 className="font-display text-4xl font-bold leading-tight">
              See every change, color-coded.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Our Red / Yellow / Green intelligence system marks weak areas, suggested improvements, and your strongest sections — so you always know what changed and why.
            </p>
            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3"><span className="mt-1.5 h-2 w-2 rounded-full bg-danger" /><div><p className="font-medium">Red</p><p className="text-sm text-muted-foreground">Missing skills, weak descriptions, missing keywords.</p></div></div>
              <div className="flex items-start gap-3"><span className="mt-1.5 h-2 w-2 rounded-full bg-warning" /><div><p className="font-medium">Yellow</p><p className="text-sm text-muted-foreground">Recommended improvements and stronger phrasing.</p></div></div>
              <div className="flex items-start gap-3"><span className="mt-1.5 h-2 w-2 rounded-full bg-success" /><div><p className="font-medium">Green</p><p className="text-sm text-muted-foreground">Strong sections aligned with the target job.</p></div></div>
            </div>
          </div>
          <Card className="overflow-hidden border-border/60 bg-gradient-card p-6">
            <div className="space-y-3 font-mono text-xs leading-relaxed">
              <p className="text-success">✓ Strong React fundamentals demonstrated across 3 projects</p>
              <p className="text-warning">~ Replace "Did a course on web dev" with measurable outcome</p>
              <p className="text-danger">✗ TypeScript missing — required by 92% of frontend roles</p>
              <p className="text-success">✓ Portfolio and GitHub links present</p>
              <p className="text-warning">~ Skills section needs categorization (Languages, Tools…)</p>
              <p className="text-danger">✗ No testing framework experience listed</p>
            </div>
            <div className="mt-6 flex gap-2 border-t border-border/60 pt-4">
              <Button variant="hero" size="sm"><Download className="h-3.5 w-3.5" /> PDF</Button>
              <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5" /> DOCX</Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="border-t border-border/40 bg-background/40 py-24">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">Pricing</Badge>
          <h2 className="font-display text-4xl font-bold md:text-5xl">Simple, student-friendly</h2>
          <p className="mt-3 text-muted-foreground">
            Start free. Upgrade when you're serious about placements.
          </p>
        </div>
        <div className="mt-16">
          <PublicPricing />
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  { name: "Aarav S.", role: "CSE Junior, NIT Trichy", quote: "Got 4 interviews in 2 weeks after using the rewritten resume. The skill gap analysis was eerily accurate." },
  { name: "Priya M.", role: "Final year, VIT", quote: "ATS score went from 52 to 87. The roadmap section helped me know what to actually learn." },
  { name: "Karan D.", role: "BITS Pilani", quote: "The color-coded changes are genius. I finally understood what was wrong with my resume." },
];

function Testimonials() {
  return (
    <section id="testimonials" className="py-24">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">Loved by students</Badge>
          <h2 className="font-display text-4xl font-bold md:text-5xl">Real results, real placements</h2>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="border-border/60 bg-gradient-card p-6">
              <div className="flex gap-0.5 text-warning">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="mt-4 text-sm">"{t.quote}"</p>
              <div className="mt-6">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="border-t border-border/40 py-24">
      <div className="container mx-auto max-w-4xl px-4">
        <Card className="relative overflow-hidden border-primary/30 bg-gradient-card p-12 text-center shadow-glow">
          <div className="absolute inset-0 bg-gradient-hero opacity-60" />
          <div className="relative">
            <h2 className="font-display text-4xl font-bold md:text-5xl">
              Your next offer starts here.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Free to try. 60 seconds to your first AI-rewritten resume.
            </p>
            <Link to="/new" className="mt-8 inline-block">
              <Button variant="hero" size="xl">
                Analyze My Resume <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}
