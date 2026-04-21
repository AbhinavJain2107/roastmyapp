export type Severity = "critical" | "warn" | "info";

export interface Issue {
  file: string;
  line: number;
  severity: Severity;
  rule: string;
  message: string;
  fixable: boolean;
}

export interface ScanResult {
  score: number;
  issues: Issue[];
  totalFiles: number;
  scannedAt: Date;
  targetPath: string;
  isLikelyNextProject: boolean;
  projectWarning?: string;
}

export interface SourceFile {
  path: string;
  relativePath: string;
  content: string;
  extension: string;
}

export interface ProjectContext {
  rootPath: string;
  sourceFiles: SourceFile[];
  configFiles: SourceFile[];
  rootFiles: SourceFile[];
  isLikelyNextProject: boolean;
  nextProjectSignals: string[];
}

export interface FixResult {
  changedFiles: string[];
  appliedFixes: number;
}

export interface CliOptions {
  path: string;
  json: boolean;
  fix: boolean;
  yes: boolean;
}
