import * as path from "node:path";

import type { ProjectContext } from "../types.js";
import { writeTextFile } from "../utils/fs.js";

export async function configFixer(context: ProjectContext): Promise<string[]> {
  const changedFiles: string[] = [];

  for (const file of context.configFiles) {
    let updated = file.content;
    const before = updated;

    if (!/optimizePackageImports\s*:/m.test(updated)) {
      updated = injectIntoExportObject(updated, 'optimizePackageImports: ["lucide-react", "@heroicons/react"],');
    }

    if (!/\bcompress\s*:/m.test(updated)) {
      updated = injectIntoExportObject(updated, "compress: true,");
    }

    if (!/images\s*:\s*\{/m.test(updated)) {
      updated = injectIntoExportObject(
        updated,
        "images: {\n    remotePatterns: []\n  },"
      );
    }

    if (updated !== before) {
      await writeTextFile(file.path, updated);
      changedFiles.push(file.relativePath);
    }
  }

  if (context.configFiles.length === 0) {
    const defaultConfigPath = path.join(context.rootPath, "next.config.js");
    const content = [
      "/** @type {import('next').NextConfig} */",
      "const nextConfig = {",
      '  optimizePackageImports: ["lucide-react", "@heroicons/react"],',
      "  compress: true,",
      "  images: {",
      "    remotePatterns: []",
      "  }",
      "};",
      "",
      "export default nextConfig;"
    ].join("\n");

    await writeTextFile(defaultConfigPath, content);
    changedFiles.push("next.config.js");
  }

  return changedFiles;
}

function injectIntoExportObject(content: string, entry: string): string {
  const objectPattern = /(const\s+\w+\s*=\s*\{)([\s\S]*?)(\n\};?)/m;
  if (objectPattern.test(content)) {
    return content.replace(objectPattern, (_match, start, middle, end) => {
      const spacer = middle.trim().length === 0 ? "\n  " : `${middle.endsWith("\n") ? "" : "\n"}  `;
      return `${start}${middle}${spacer}${entry}${end}`;
    });
  }

  const moduleExportsPattern = /(module\.exports\s*=\s*\{)([\s\S]*?)(\n\};?)/m;
  if (moduleExportsPattern.test(content)) {
    return content.replace(moduleExportsPattern, (_match, start, middle, end) => {
      const spacer = middle.trim().length === 0 ? "\n  " : `${middle.endsWith("\n") ? "" : "\n"}  `;
      return `${start}${middle}${spacer}${entry}${end}`;
    });
  }

  return `${content.trimEnd()}\n\n${entry}\n`;
}
