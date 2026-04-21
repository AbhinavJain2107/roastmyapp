import { getLineNumber, isLikelyComponentFile } from "../utils/text.js";
import type { Issue, SourceFile } from "../types.js";

export function fontChecker(file: SourceFile): Issue[] {
  if (!isLikelyComponentFile(file)) {
    return [];
  }

  const issues: Issue[] = [];
  const content = file.content;

  for (const match of content.matchAll(/<link\b[^>]*href=["'][^"']*fonts\.googleapis\.com[^"']*["'][^>]*>/g)) {
    issues.push({
      file: file.relativePath,
      line: getLineNumber(content, match.index ?? 0),
      severity: "warn",
      rule: "external-google-fonts",
      message: "External Google Fonts link detected. Prefer next/font for better performance.",
      fixable: false
    });
  }

  return issues;
}
