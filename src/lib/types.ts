export interface AnalysisResponse {
  atsScore: number | string;
  skillMatchPercentage: number | string;
  missingSkills: string[];
  recommendedProjects: Array<{
    name: string;
    techStack: string[];
    reason: string;
  }>;
  learningRoadmap: Array<{
    skill: string;
    steps: string[];
    resources: Array<{ label: string; url: string }>;
    difficulty: "Beginner" | "Intermediate" | "Advanced" | string;
  }>;
  resumeAnalysis: {
    strengths: string[];
    weaknesses: string[];
  };
  modifiedResume: {
    downloadUrlPDF: string;
    downloadUrlDOCX: string;
    previewText: string;
    originalText?: string;
    redYellowGreenMap: {
      red: string[];
      yellow: string[];
      green: string[];
    };
  };
}

export interface HistoryItem {
  id: string;
  createdAt: string;
  role: string;
  jobTitle: string;
  atsScore: number;
  result: AnalysisResponse;
  saved?: boolean;
}
