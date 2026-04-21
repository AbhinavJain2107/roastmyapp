import { scoreGrade } from "./scorer.js";
import type { ScanResult, Severity } from "./types.js";

const COLORS = {
  reset: "\u001b[0m",
  red: "\u001b[31m",
  yellow: "\u001b[33m",
  blue: "\u001b[34m",
  green: "\u001b[32m",
  dim: "\u001b[2m",
  bold: "\u001b[1m"
} as const;

export function renderReport(result: ScanResult): string {
  const lines: string[] = [];

  if (!result.isLikelyNextProject) {
    lines.push(`${COLORS.bold}roastmyapp${COLORS.reset}`);
    lines.push(`${COLORS.yellow}Warning:${COLORS.reset} ${result.projectWarning ?? "Target is not a Next.js project."}`);
    lines.push(`Scanned ${result.totalFiles} files in ${result.targetPath}`);
    lines.push(
      `${COLORS.dim}No performance scan was performed because the target does not look like a Next.js app.${COLORS.reset}`
    );
    return lines.join("\n");
  }

  const grade = scoreGrade(result.score);
  const issueCount = result.issues.length;

  lines.push(`${COLORS.bold}roastmyapp${COLORS.reset}`);
  lines.push(`Score: ${colorScore(result.score)} ${COLORS.dim}(${grade})${COLORS.reset}`);
  lines.push(`Scanned ${result.totalFiles} files in ${result.targetPath}`);
  lines.push(`Found ${issueCount} issue${issueCount === 1 ? "" : "s"}`);

  if (issueCount === 0) {
    lines.push(`${COLORS.green}No performance issues detected by the current ruleset.${COLORS.reset}`);
    return lines.join("\n");
  }

  lines.push("");
  lines.push(`${COLORS.bold}Top Rules${COLORS.reset}`);
  for (const summary of summarizeRules(result)) {
    lines.push(`- ${summary.rule}: ${summary.count} (${summary.severity})`);
  }

  for (const severity of ["critical", "warn", "info"] as const) {
    const group = result.issues.filter((issue) => issue.severity === severity);
    if (group.length === 0) {
      continue;
    }

    lines.push("");
    lines.push(`${severityBadge(severity)} ${severity.toUpperCase()} (${group.length})`);
    for (const issue of group) {
      const fixable = issue.fixable ? "fixable" : "manual";
      lines.push(`- ${issue.file}:${issue.line} ${issue.message} ${COLORS.dim}[${issue.rule}, ${fixable}]${COLORS.reset}`);
    }
  }

  return lines.join("\n");
}

export function renderJson(result: ScanResult): string {
  return JSON.stringify(
    {
      ...result,
      scannedAt: result.scannedAt.toISOString()
    },
    null,
    2
  );
}

function severityBadge(severity: Severity): string {
  if (severity === "critical") return `${COLORS.red}[critical]${COLORS.reset}`;
  if (severity === "warn") return `${COLORS.yellow}[warn]${COLORS.reset}`;
  return `${COLORS.blue}[info]${COLORS.reset}`;
}

function colorScore(score: number): string {
  if (score >= 90) return `${COLORS.green}${score}${COLORS.reset}`;
  if (score >= 70) return `${COLORS.blue}${score}${COLORS.reset}`;
  if (score >= 50) return `${COLORS.yellow}${score}${COLORS.reset}`;
  return `${COLORS.red}${score}${COLORS.reset}`;
}

function summarizeRules(result: ScanResult): Array<{ rule: string; count: number; severity: Severity }> {
  const counts = new Map<string, { count: number; severity: Severity }>();

  for (const issue of result.issues) {
    const existing = counts.get(issue.rule);
    if (existing) {
      existing.count += 1;
      continue;
    }

    counts.set(issue.rule, {
      count: 1,
      severity: issue.severity
    });
  }

  return [...counts.entries()]
    .map(([rule, value]) => ({
      rule,
      count: value.count,
      severity: value.severity
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);
}
