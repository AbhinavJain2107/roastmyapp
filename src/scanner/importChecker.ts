import { getLineNumber } from "../utils/text.js";
import type { Issue, SourceFile } from "../types.js";

export function importChecker(file: SourceFile): Issue[] {
  const issues: Issue[] = [];
  const content = file.content;

  for (const match of content.matchAll(/import\s+.+?\s+from\s+["']moment["']/g)) {
    issues.push({
      file: file.relativePath,
      line: getLineNumber(content, match.index ?? 0),
      severity: "critical",
      rule: "moment-import",
      message: "Full moment import detected. Consider a lighter date library.",
      fixable: false
    });
  }

  for (const match of content.matchAll(/import\s+.+?\s+from\s+["']lodash["']/g)) {
    issues.push({
      file: file.relativePath,
      line: getLineNumber(content, match.index ?? 0),
      severity: "warn",
      rule: "lodash-import",
      message: "Full lodash import detected. Prefer per-function imports.",
      fixable: false
    });
  }

  for (const match of content.matchAll(/import\s+.+?\s+from\s+["']react-icons["']/g)) {
    issues.push({
      file: file.relativePath,
      line: getLineNumber(content, match.index ?? 0),
      severity: "warn",
      rule: "barrel-import",
      message: "Import from react-icons root detected. Prefer a specific icon pack entry like react-icons/fi.",
      fixable: false
    });
  }

  return issues;
}
