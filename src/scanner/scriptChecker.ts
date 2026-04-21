import { getLineNumber, isLikelyComponentFile } from "../utils/text.js";
import type { Issue, SourceFile } from "../types.js";

export function scriptChecker(file: SourceFile): Issue[] {
  if (!isLikelyComponentFile(file)) {
    return [];
  }

  const issues: Issue[] = [];
  const content = file.content;

  for (const match of content.matchAll(/<script\b[^>]*>/g)) {
    const tag = match[0];
    const index = match.index ?? 0;
    if (/<\/script>/.test(content.slice(index, index + 300)) && !/\btype=["']application\/ld\+json["']/.test(tag)) {
      issues.push({
        file: file.relativePath,
        line: getLineNumber(content, index),
        severity: "warn",
        rule: "bare-script-tag",
        message: "Bare <script> tag found. Prefer next/script with a loading strategy.",
        fixable: true
      });
    }
  }

  return issues;
}
