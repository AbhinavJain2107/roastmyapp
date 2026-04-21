import type { Issue } from "./types.js";

export function scoreIssues(issues: Issue[]): number {
  let score = 100;

  const imgPenalty = Math.min(countRule(issues, "no-bare-img") * 15, 30);
  const lcpPenalty = countRule(issues, "lcp-image-priority") * 15;
  const momentPenalty = countRule(issues, "moment-import") * 15;
  const useClientPenalty = Math.min(countRule(issues, "unnecessary-use-client") * 5, 20);
  const fontPenalty = countRule(issues, "external-google-fonts") * 5;
  const scriptPenalty = Math.min(countRule(issues, "bare-script-tag") * 5, 15);
  const lodashPenalty = countRule(issues, "lodash-import") * 5;
  const barrelPenalty = Math.min(countRule(issues, "barrel-import") * 5, 10);
  const optimizePenalty = countRule(issues, "missing-optimize-package-imports") * 2;
  const configPenalty =
    countRule(issues, "missing-image-config") * 2 +
    countRule(issues, "missing-compress-config") * 2 +
    countRule(issues, "missing-next-config") * 2;

  score -=
    imgPenalty +
    lcpPenalty +
    momentPenalty +
    useClientPenalty +
    fontPenalty +
    scriptPenalty +
    lodashPenalty +
    barrelPenalty +
    optimizePenalty +
    configPenalty;

  return Math.max(0, score);
}

export function scoreGrade(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs work";
  return "Critical";
}

function countRule(issues: Issue[], rule: string): number {
  return issues.filter((issue) => issue.rule === rule).length;
}
