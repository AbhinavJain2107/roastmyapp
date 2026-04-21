import { findJsxImageNodes } from "../utils/jsx.js";
import { isLikelyComponentFile } from "../utils/text.js";
import type { Issue, SourceFile } from "../types.js";

export function imageChecker(file: SourceFile): Issue[] {
  if (!isLikelyComponentFile(file)) {
    return [];
  }

  const issues: Issue[] = [];
  for (const node of findJsxImageNodes(file)) {
    if (node.kind === "img") {
      issues.push({
        file: file.relativePath,
        line: node.line,
        severity: "critical",
        rule: "no-bare-img",
        message: node.canAutoFix
          ? "Bare <img> tag found. Prefer next/image for lazy loading and sizing."
          : "Bare <img> tag found. Prefer next/image, but this tag needs manual review before conversion.",
        fixable: node.canAutoFix
      });

      if (node.isLikelyLcp && !node.hasPriority) {
        issues.push({
          file: file.relativePath,
          line: node.line,
          severity: "critical",
          rule: "lcp-image-priority",
          message: "Likely LCP image is missing the priority prop.",
          fixable: node.canAutoFix && node.hasDataLcp
        });
      }

      continue;
    }

    if (!node.hasFill && (!node.hasWidth || !node.hasHeight)) {
      issues.push({
        file: file.relativePath,
        line: node.line,
        severity: "warn",
        rule: "image-dimensions",
        message: "next/image is missing explicit width and height (or fill).",
        fixable: false
      });
    }

    if (node.isLikelyLcp && !node.hasPriority) {
      issues.push({
        file: file.relativePath,
        line: node.line,
        severity: "critical",
        rule: "lcp-image-priority",
        message: "Likely LCP image is missing the priority prop.",
        fixable: node.hasDataLcp
      });
    }
  }

  return issues;
}
