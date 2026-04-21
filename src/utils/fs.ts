import { promises as fs } from "node:fs";
import * as path from "node:path";

import type { ProjectContext, SourceFile } from "../types.js";

const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);
const CONFIG_NAMES = new Set([
  "next.config.js",
  "next.config.mjs",
  "next.config.ts"
]);
const ROOT_FILE_NAMES = new Set([
  "package.json",
  "vercel.json"
]);
const SKIP_DIRS = new Set([
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  "node_modules"
]);

export async function loadProjectContext(rootPath: string): Promise<ProjectContext> {
  const sourceFiles: SourceFile[] = [];
  const configFiles: SourceFile[] = [];
  const rootFiles: SourceFile[] = [];

  async function walk(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) {
          await walk(fullPath);
        }
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const extension = path.extname(entry.name);
      const isSource = SOURCE_EXTENSIONS.has(extension);
      const isConfig = CONFIG_NAMES.has(entry.name);

      if (!isSource && !isConfig) {
        if (currentPath !== rootPath || !ROOT_FILE_NAMES.has(entry.name)) {
          continue;
        }
      }

      const content = await fs.readFile(fullPath, "utf8");
      const file: SourceFile = {
        path: fullPath,
        relativePath: path.relative(rootPath, fullPath) || entry.name,
        content,
        extension
      };

      if (isConfig) {
        configFiles.push(file);
      } else if (currentPath === rootPath && ROOT_FILE_NAMES.has(entry.name)) {
        rootFiles.push(file);
      } else {
        sourceFiles.push(file);
      }
    }
  }

  await walk(rootPath);

  const nextProjectSignals = detectNextProjectSignals(rootFiles, configFiles, sourceFiles);

  return {
    rootPath,
    sourceFiles,
    configFiles,
    rootFiles,
    isLikelyNextProject: nextProjectSignals.length > 0,
    nextProjectSignals
  };
}

export async function writeTextFile(filePath: string, content: string): Promise<void> {
  await fs.writeFile(filePath, content, "utf8");
}

function detectNextProjectSignals(
  rootFiles: SourceFile[],
  configFiles: SourceFile[],
  sourceFiles: SourceFile[]
): string[] {
  const signals: string[] = [];

  if (configFiles.length > 0) {
    signals.push("next.config.* present");
  }

  const packageFile = rootFiles.find((file) => file.relativePath === "package.json");
  if (packageFile) {
    try {
      const parsed = JSON.parse(packageFile.content) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const dependencies = {
        ...parsed.dependencies,
        ...parsed.devDependencies
      };

      if ("next" in dependencies) {
        signals.push("next package dependency");
      }
    } catch {
      // Ignore invalid package.json during project detection.
    }
  }

  if (
    sourceFiles.some((file) =>
      /^(app\/(.*\/)?(page|layout|loading|error|not-found)\.(t|j)sx|pages\/(_app|_document|index|.*)\.(t|j)sx)$/.test(
        file.relativePath
      )
    )
  ) {
    signals.push("Next.js app/pages router files");
  }

  if (
    sourceFiles.some((file) =>
      /^\s*import\s+.+\s+from\s+["']next\/(image|script|link|font|navigation|headers)["']/m.test(file.content)
    )
  ) {
    signals.push("imports from next/* modules");
  }

  return [...new Set(signals)];
}
