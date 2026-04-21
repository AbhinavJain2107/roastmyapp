import { analyzeUseClient } from "../utils/jsx.js";
import type { Issue, SourceFile } from "../types.js";

export function clientChecker(file: SourceFile): Issue[] {
  const analysis = analyzeUseClient(file);
  if (!analysis.hasUseClientDirective) {
    return [];
  }

  if (!analysis.likelyNeedsClient) {
    return [
      {
        file: file.relativePath,
        line: analysis.directiveLine,
        severity: "warn",
        rule: "unnecessary-use-client",
        message:
          '"use client" may be unnecessary; this file does not directly use client hooks, event handlers, browser APIs, or client-only imports.',
        fixable: false
      }
    ];
  }

  return [];
}
