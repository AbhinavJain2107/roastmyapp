import { clientChecker } from "./clientChecker.js";
import { configChecker } from "./configChecker.js";
import { fontChecker } from "./fontChecker.js";
import { imageChecker } from "./imageChecker.js";
import { importChecker } from "./importChecker.js";
import { scriptChecker } from "./scriptChecker.js";
import { scoreIssues } from "../scorer.js";
import type { ProjectContext, ScanResult } from "../types.js";

export function scanProject(context: ProjectContext): ScanResult {
  if (!context.isLikelyNextProject) {
    return {
      score: 0,
      issues: [],
      totalFiles: context.sourceFiles.length + context.configFiles.length,
      scannedAt: new Date(),
      targetPath: context.rootPath,
      isLikelyNextProject: false,
      projectWarning:
        "This directory does not appear to be a Next.js project. roastmyapp is designed for Next.js apps."
    };
  }

  const issues = [
    ...context.sourceFiles.flatMap((file) => imageChecker(file)),
    ...context.sourceFiles.flatMap((file) => importChecker(file)),
    ...context.sourceFiles.flatMap((file) => clientChecker(file)),
    ...context.sourceFiles.flatMap((file) => fontChecker(file)),
    ...context.sourceFiles.flatMap((file) => scriptChecker(file)),
    ...configChecker(context)
  ];

  return {
    score: scoreIssues(issues, context.sourceFiles.length),
    issues,
    totalFiles: context.sourceFiles.length + context.configFiles.length,
    scannedAt: new Date(),
    targetPath: context.rootPath,
    isLikelyNextProject: true
  };
}
