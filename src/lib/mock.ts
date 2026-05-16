import type { AnalysisResponse } from "./types";

export const mockAnalysis = (jobTitle = "Frontend Engineer Intern"): AnalysisResponse => ({
  atsScore: 78,
  skillMatchPercentage: 64,
  missingSkills: ["TypeScript", "Next.js", "Jest", "GraphQL", "Docker"],
  recommendedProjects: [
    {
      name: "AI-Powered Resume Analyzer",
      techStack: ["React", "TypeScript", "OpenAI API", "TailwindCSS"],
      reason: "Demonstrates AI integration + TypeScript proficiency missing from your resume.",
    },
    {
      name: "Real-time Collaborative Whiteboard",
      techStack: ["Next.js", "WebSockets", "Postgres", "Prisma"],
      reason: "Covers Next.js + backend skills required by the JD.",
    },
    {
      name: "E-commerce Dashboard with Tests",
      techStack: ["React", "Jest", "RTL", "GraphQL"],
      reason: "Builds Jest + GraphQL exposure directly aligned to the role.",
    },
  ],
  learningRoadmap: [
    {
      skill: "TypeScript",
      difficulty: "Intermediate",
      steps: ["Learn primitives & generics", "Convert one React project to TS", "Type a REST API client"],
      resources: [
        { label: "TS Handbook", url: "https://www.typescriptlang.org/docs/handbook/intro.html" },
        { label: "Total TypeScript", url: "https://www.totaltypescript.com/" },
      ],
    },
    {
      skill: "Next.js",
      difficulty: "Intermediate",
      steps: ["App router basics", "Data fetching & caching", "Deploy on Vercel"],
      resources: [{ label: "Next.js Learn", url: "https://nextjs.org/learn" }],
    },
    {
      skill: "Testing (Jest + RTL)",
      difficulty: "Beginner",
      steps: ["Unit test pure functions", "Component tests with RTL", "Add CI test step"],
      resources: [{ label: "Testing Library Docs", url: "https://testing-library.com/" }],
    },
  ],
  resumeAnalysis: {
    strengths: [
      "Clear project descriptions with measurable impact",
      "Strong React fundamentals",
      "Good academic record highlighted up front",
    ],
    weaknesses: [
      "No TypeScript anywhere despite JD requiring it",
      "Bullet points start with weak verbs",
      "Skills section lacks categorization",
    ],
  },
  modifiedResume: {
    downloadUrlPDF: "",
    downloadUrlDOCX: "",
    previewText: `JANE DOE
Frontend Engineer Intern Candidate
jane@example.com · github.com/janedoe · linkedin.com/in/janedoe

SUMMARY
Frontend-focused CS undergrad with hands-on experience building responsive React + TypeScript apps. Shipped 3 production projects, contributed to open-source UI libraries, and passionate about AI-powered developer tools.

SKILLS
Languages: TypeScript, JavaScript, Python
Frameworks: React, Next.js, TailwindCSS
Testing: Jest, React Testing Library
Tools: Git, Docker, Vite, Figma

EXPERIENCE
Open-Source Contributor — Radix UI (2024)
• Migrated 4 components to TypeScript strict mode, reducing runtime errors by 31%.
• Authored Jest tests covering 92% of new code paths.

PROJECTS
AI Resume Analyzer — React, TypeScript, OpenAI
• Built a Next.js app that parses resumes and returns ATS scores in <2s.
• Deployed on Vercel; 1.2k MAU within 3 months.

EDUCATION
B.Tech, Computer Science — XYZ University (2022–2026), CGPA 8.7`,
    originalText: `Jane Doe
jane@example.com

Objective: Looking for a frontend developer internship.

Skills: HTML, CSS, JavaScript, React, basic Git.

Experience:
- Built some websites for college fest
- Did a course on web dev

Projects:
- Portfolio website
- Todo app

Education: B.Tech CSE, XYZ University, ongoing.`,
    redYellowGreenMap: {
      red: ["No TypeScript listed", "Missing Next.js experience", "No testing skills"],
      yellow: ["Weak action verbs in bullets", "Skills not categorized", "Objective is generic"],
      green: ["Strong React fundamentals", "Has portfolio + projects", "Good academic standing"],
    },
  },
});
