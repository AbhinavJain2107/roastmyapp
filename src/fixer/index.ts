import { configFixer } from "./configFixer.js";
import { imageFixer } from "./imageFixer.js";
import { scriptFixer } from "./scriptFixer.js";
import type { FixResult, ProjectContext, ScanResult } from "../types.js";
import { loadProjectContext } from "../utils/fs.js";
import { uniqueBy } from "../utils/text.js";

export async function applyFixes(context: ProjectContext, result: ScanResult): Promise<FixResult> {
  const imageChanges = await imageFixer(context, result.issues);
  const afterImageContext = await loadProjectContext(context.rootPath);
  const scriptChanges = await scriptFixer(afterImageContext, result.issues);
  const afterScriptContext = await loadProjectContext(context.rootPath);
  const configChanges = await configFixer(afterScriptContext);

  const changedFiles = uniqueBy(
    [...imageChanges, ...scriptChanges, ...configChanges],
    (file) => file
  );

  return {
    changedFiles,
    appliedFixes: changedFiles.length
  };
}
