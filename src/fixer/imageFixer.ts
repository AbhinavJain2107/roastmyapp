import type { Issue, ProjectContext } from "../types.js";
import { writeTextFile } from "../utils/fs.js";
import { applyTextReplacements, getSafeImageAutoFixReplacements } from "../utils/jsx.js";

export async function imageFixer(context: ProjectContext, issues: Issue[]): Promise<string[]> {
  const changedFiles: string[] = [];
  const issueFiles = new Set(
    issues
      .filter(
        (issue) =>
          issue.fixable && (issue.rule === "no-bare-img" || issue.rule === "lcp-image-priority")
      )
      .map((issue) => issue.file)
  );

  for (const file of context.sourceFiles) {
    if (!issueFiles.has(file.relativePath)) {
      continue;
    }

    let updated = file.content;
    const before = updated;

    const replacements = getSafeImageAutoFixReplacements(file);
    updated = applyTextReplacements(updated, replacements);

    if (updated !== before && updated.includes("<Image") && !/from\s+["']next\/image["']/.test(updated)) {
      updated = `import Image from "next/image";\n${updated}`;
    }

    if (before !== updated) {
      await writeTextFile(file.path, updated);
      changedFiles.push(file.relativePath);
    }
  }

  return changedFiles;
}
