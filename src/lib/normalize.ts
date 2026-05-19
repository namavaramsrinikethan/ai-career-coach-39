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

  const matchedSkills = toStringArray(pick(raw, ["matchedSkills", "matched_skills", "presentSkills", "present_skills"], []));
  const missingSkills = toStringArray(pick(raw, ["missingSkills", "missing_skills", "gaps"], []));

  const explicitMatch = Number(pick(raw, ["skillMatchPercentage", "skill_match", "matchPercentage", "match"], NaN));
  const computedMatch =
    matchedSkills.length + missingSkills.length > 0
      ? Math.round((matchedSkills.length / (matchedSkills.length + missingSkills.length)) * 100)
      : 0;
  const skillMatchPercentage = Number.isFinite(explicitMatch) && explicitMatch > 0 ? explicitMatch : computedMatch;

  const recommendedProjects = toArray(pick(raw, ["recommendedProjects", "recommended_projects", "projects"], [])).map(
    (p: any) => {
      if (typeof p === "string") {
        const idx = p.toLowerCase().indexOf(" with ");
        if (idx > -1) {
          const name = p.slice(0, idx).trim();
          const techStack = p.slice(idx + 6).split(/,| and /i).map((t) => t.trim()).filter(Boolean);
          return { name, techStack, reason: p };
        }
        return { name: p, techStack: [], reason: "" };
      }
      return {
        name: String(pick(p, ["name", "title"], "Untitled project")),
        techStack: toStringArray(pick(p, ["techStack", "tech_stack", "stack", "tech"], [])),
        reason: String(pick(p, ["reason", "why", "description"], "")),
      };
    },
  );

  const pdfBase64 = pick(raw, ["pdf_base64", "pdfBase64", "resumePdfBase64"], "");
  const pdfUrl =
    pick(modifiedResume, ["downloadUrlPDF", "pdfUrl", "pdf"], "") ||
    pick(raw, ["downloadUrlPDF", "pdfUrl", "pdf_url"], "") ||
    (pdfBase64 ? `data:application/pdf;base64,${String(pdfBase64).replace(/^data:.*;base64,/, "")}` : "");

  const strengths = toStringArray(
    pick(raw, ["strengths"], null) ?? pick(resumeAnalysis, ["strengths", "pros"], []),
  );
  const weaknesses = toStringArray(
    pick(raw, ["areas_to_improve", "areasToImprove", "weaknesses", "improvements"], null) ??
      pick(resumeAnalysis, ["weaknesses", "cons", "improvements"], []),
  );

  return {
    atsScore: Number(pick(raw, ["atsScore", "ats_score", "ats"], 0)) || 0,
    skillMatchPercentage,
    missingSkills,
    recommendedProjects,
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
    resumeAnalysis: { strengths, weaknesses },
    modifiedResume: {
      downloadUrlPDF: String(pdfUrl),
      downloadUrlDOCX: String(pick(modifiedResume, ["downloadUrlDOCX", "docxUrl", "docx"], "")),
      previewText: String(
        pick(modifiedResume, ["previewText", "preview", "text", "content"], "") ||
          pick(raw, ["previewText", "modifiedResumeText", "text"], "") ||
          "",
      ),
      originalText: String(pick(modifiedResume, ["originalText", "original"], "") || pick(raw, ["originalText"], "")),
      redYellowGreenMap: {
        red: toStringArray(pick(ryg, ["red"], null) ?? missingSkills),
        yellow: toStringArray(pick(ryg, ["yellow"], [])),
        green: toStringArray(pick(ryg, ["green"], null) ?? matchedSkills),
      },
    },
  };
}
