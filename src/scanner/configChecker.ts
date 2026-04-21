import type { Issue, ProjectContext } from "../types.js";

export function configChecker(context: ProjectContext): Issue[] {
  const issues: Issue[] = [];
  const isLikelyVercelProject = detectLikelyVercelProject(context);

  if (context.configFiles.length === 0) {
    issues.push({
      file: "next.config.js",
      line: 1,
      severity: "info",
      rule: "missing-next-config",
      message: "No Next.js config file found. Consider adding one for package import optimization.",
      fixable: true
    });
    return issues;
  }

  for (const file of context.configFiles) {
    if (!/optimizePackageImports\s*:/m.test(file.content)) {
      issues.push({
        file: file.relativePath,
        line: 1,
        severity: "info",
        rule: "missing-optimize-package-imports",
        message: "optimizePackageImports is not configured.",
        fixable: true
      });
    }

    if (!/images\s*:\s*\{/m.test(file.content)) {
      issues.push({
        file: file.relativePath,
        line: 1,
        severity: "info",
        rule: "missing-image-config",
        message: "No images config found. Review remotePatterns/domains and image optimization defaults.",
        fixable: true
      });
    }

    if (!/\bcompress\s*:/m.test(file.content) && !isLikelyVercelProject) {
      issues.push({
        file: file.relativePath,
        line: 1,
        severity: "info",
        rule: "missing-compress-config",
        message: "compress is not explicitly configured in next.config.*.",
        fixable: true
      });
    }
  }

  return issues;
}

function detectLikelyVercelProject(context: ProjectContext): boolean {
  if (context.rootFiles.some((file) => file.relativePath === "vercel.json")) {
    return true;
  }

  const packageFile = context.rootFiles.find((file) => file.relativePath === "package.json");
  if (!packageFile) {
    return false;
  }

  try {
    const parsed = JSON.parse(packageFile.content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };

    const dependencies = {
      ...parsed.dependencies,
      ...parsed.devDependencies
    };

    if ("vercel" in dependencies) {
      return true;
    }

    return Object.values(parsed.scripts ?? {}).some((script) => /\bvercel\b/.test(script));
  } catch {
    return false;
  }
}
