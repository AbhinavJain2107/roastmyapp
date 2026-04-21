import type { Issue, ProjectContext } from "../types.js";
import { writeTextFile } from "../utils/fs.js";

export async function scriptFixer(context: ProjectContext, issues: Issue[]): Promise<string[]> {
  const issueFiles = new Set(
    issues.filter((issue) => issue.rule === "bare-script-tag").map((issue) => issue.file)
  );
  const changedFiles: string[] = [];

  for (const file of context.sourceFiles) {
    if (!issueFiles.has(file.relativePath)) {
      continue;
    }

    let updated = file.content;
    const before = updated;

    updated = updated.replace(/<script\b(?![^>]*type=["']application\/ld\+json["'])/g, "<Script strategy=\"lazyOnload\"");

    if (updated !== before) {
      updated = updated.replace(/<\/script>/g, "</Script>");
      if (updated.includes("<Script") && !/from\s+["']next\/script["']/.test(updated)) {
        updated = `import Script from "next/script";\n${updated}`;
      }
      await writeTextFile(file.path, updated);
      changedFiles.push(file.relativePath);
    }
  }

  return changedFiles;
}
