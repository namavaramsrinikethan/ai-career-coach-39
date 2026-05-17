import type { AnalysisResponse } from "./types";

// Safely pull a value from an object using multiple possible key paths
const pick = (obj: any, keys: string[], fallback: any = undefined) => {
  for (const k of keys) {
    const parts = k.split(".");
    let cur: any = obj;
    let ok = true;
    for (const p of parts) {
      if (cur && typeof cur === "object" && p in cur) cur = cur[p];
      else { ok = false; break; }
    }
    if (ok && cur !== undefined && cur !== null && cur !== "") return cur;
  }
  return fallback;
};

const toArray = (v: any): any[] => {
  if (Array.isArray(v)) return v;
  if (v == null || v === "") return [];
  if (typeof v === "string") {
    return v.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean);
  }
  return [v];
};

const toStringArray = (v: any): string[] =>
  toArray(v).map((x) => (typeof x === "string" ? x : x?.name ?? x?.label ?? JSON.stringify(x)));

export function normalizeWebhookResponse(input: unknown): AnalysisResponse {
  // Unwrap n8n shapes: arrays, {json: {...}}, {data: {...}}, {output: {...}}
  let raw: any = input;
  if (Array.isArray(raw)) raw = raw[0] ?? {};
  if (raw && typeof raw === "object") {
    raw = raw.json ?? raw.data ?? raw.output ?? raw.result ?? raw.response ?? raw;
  }
  // If still a string that looks like JSON, try parse
  if (typeof raw === "string") {
    try { raw = JSON.parse(raw); } catch { raw = { previewText: raw }; }
  }
  raw = raw ?? {};

  const resumeAnalysis = pick(raw, ["resumeAnalysis", "analysis"], {}) || {};
  const modifiedResume = pick(raw, ["modifiedResume", "resume", "modified_resume"], {}) || {};
  const ryg = pick(modifiedResume, ["redYellowGreenMap", "ryg"], {}) || {};

  return {
    atsScore: Number(pick(raw, ["atsScore", "ats_score", "ats"], 0)) || 0,
    skillMatchPercentage:
      Number(pick(raw, ["skillMatchPercentage", "skill_match", "matchPercentage", "match"], 0)) || 0,
    missingSkills: toStringArray(pick(raw, ["missingSkills", "missing_skills", "gaps"], [])),
    recommendedProjects: toArray(pick(raw, ["recommendedProjects", "projects"], [])).map((p: any) => ({
      name: String(pick(p, ["name", "title"], "Untitled project")),
      techStack: toStringArray(pick(p, ["techStack", "tech_stack", "stack", "tech"], [])),
      reason: String(pick(p, ["reason", "why", "description"], "")),
    })),
    learningRoadmap: toArray(pick(raw, ["learningRoadmap", "roadmap", "learning"], [])).map((s: any) => ({
      skill: String(pick(s, ["skill", "name", "topic"], "Skill")),
      difficulty: String(pick(s, ["difficulty", "level"], "Beginner")),
      steps: toStringArray(pick(s, ["steps", "plan"], [])),
      resources: toArray(pick(s, ["resources", "links"], [])).map((r: any) =>
        typeof r === "string"
          ? { label: r, url: r }
          : { label: String(pick(r, ["label", "title", "name"], r?.url ?? "Resource")), url: String(pick(r, ["url", "href", "link"], "#")) },
      ),
    })),
    resumeAnalysis: {
      strengths: toStringArray(pick(resumeAnalysis, ["strengths", "pros"], [])),
      weaknesses: toStringArray(pick(resumeAnalysis, ["weaknesses", "cons", "improvements"], [])),
    },
    modifiedResume: {
      downloadUrlPDF: String(pick(modifiedResume, ["downloadUrlPDF", "pdfUrl", "pdf"], "")),
      downloadUrlDOCX: String(pick(modifiedResume, ["downloadUrlDOCX", "docxUrl", "docx"], "")),
      previewText: String(
        pick(modifiedResume, ["previewText", "preview", "text", "content"], "") ||
          pick(raw, ["previewText", "modifiedResumeText", "text"], "") ||
          "",
      ),
      originalText: String(pick(modifiedResume, ["originalText", "original"], "") || pick(raw, ["originalText"], "")),
      redYellowGreenMap: {
        red: toStringArray(pick(ryg, ["red"], [])),
        yellow: toStringArray(pick(ryg, ["yellow"], [])),
        green: toStringArray(pick(ryg, ["green"], [])),
      },
    },
  };
}
