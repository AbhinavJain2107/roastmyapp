import type { Issue } from "./types.js";

export function scoreIssues(issues: Issue[], sourceFileCount: number): number {
  let score = 100;

  const densityFactor = Math.max(1, sourceFileCount / 100);
  const scaledCount = (rule: string): number => countRule(issues, rule) / densityFactor;

  const imgPenalty = Math.min(scaledCount("no-bare-img") * 15, 30);
  const lcpPenalty = Math.min(scaledCount("lcp-image-priority") * 15, 25);
  const momentPenalty = Math.min(scaledCount("moment-import") * 15, 25);
  const useClientPenalty = Math.min(scaledCount("unnecessary-use-client") * 5, 20);
  const fontPenalty = Math.min(scaledCount("external-google-fonts") * 5, 10);
  const scriptPenalty = Math.min(scaledCount("bare-script-tag") * 5, 15);
  const lodashPenalty = Math.min(scaledCount("lodash-import") * 5, 15);
  const barrelPenalty = Math.min(scaledCount("barrel-import") * 5, 10);
  const svgImportPenalty = Math.min(scaledCount("no-large-svg-import") * 5, 10);
  const optimizePenalty = Math.min(scaledCount("missing-optimize-package-imports") * 2, 8);
  const configPenalty =
    Math.min(scaledCount("missing-image-config") * 2, 4) +
    Math.min(scaledCount("missing-compress-config") * 2, 4) +
    Math.min(scaledCount("missing-next-config") * 2, 4);

  score -=
    imgPenalty +
    lcpPenalty +
    momentPenalty +
    useClientPenalty +
    fontPenalty +
    scriptPenalty +
    lodashPenalty +
    barrelPenalty +
    svgImportPenalty +
    optimizePenalty +
    configPenalty;

  return Math.max(0, Math.round(score));
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
