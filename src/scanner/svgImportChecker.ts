import * as fs from "node:fs";
import * as path from "node:path";

import { getLineNumber } from "../utils/text.js";
import type { Issue, SourceFile } from "../types.js";

const SVG_IMPORT_PATTERN = /import\s+.+?\s+from\s+["']([^"']+\.svg)["']/g;
const MAX_SVG_SIZE_BYTES = 5 * 1024;
const RULE_NAME = "no-large-svg-import";

export function svgImportChecker(file: SourceFile): Issue[] {
  const issues: Issue[] = [];
  const content = file.content;
  const currentDir = path.dirname(file.path);

  for (const match of content.matchAll(SVG_IMPORT_PATTERN)) {
    const importPath = match[1];
    if (!importPath) {
      continue;
    }

    // Defensive guard: the regex already excludes remote URLs, but skip
    // explicitly anyway so any future tweak to the pattern is safe.
    if (/^https?:\/\//i.test(importPath)) {
      continue;
    }

    const svgAbsolutePath = path.resolve(currentDir, importPath);

    let sizeBytes: number;
    try {
      sizeBytes = fs.statSync(svgAbsolutePath).size;
    } catch {
      // File missing, unreadable, or behind an unresolved alias.
      // Skip silently to avoid noisy false positives.
      continue;
    }

    if (sizeBytes <= MAX_SVG_SIZE_BYTES) {
      continue;
    }

    const sizeKb = (sizeBytes / 1024).toFixed(1);

    issues.push({
      file: file.relativePath,
      line: getLineNumber(content, match.index ?? 0),
      severity: "warn",
      rule: RULE_NAME,
      message: `Large inline SVG import: "${importPath}" is ${sizeKb}KB, which exceeds the 5KB limit. Use next/image or an SVGR loader instead.`,
      fixable: false
    });
  }

  return issues;
}
