#!/usr/bin/env node
import * as path from "node:path";
import * as process from "node:process";
import * as readline from "node:readline/promises";
import { createRequire } from "node:module";

import { applyFixes } from "./fixer/index.js";
import { renderJson, renderReport } from "./reporter.js";
import { scanProject } from "./scanner/index.js";
import type { CliOptions } from "./types.js";
import { loadProjectContext } from "./utils/fs.js";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json") as { version?: string };

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const targetPath = path.resolve(process.cwd(), options.path);
  const context = await loadProjectContext(targetPath);
  let result = scanProject(context);

  if (options.fix && result.isLikelyNextProject) {
    const shouldProceed = options.yes || (await confirmFix(result.issues.length));
    if (shouldProceed) {
      const fixResult = await applyFixes(context, result);
      const refreshedContext = await loadProjectContext(targetPath);
      result = scanProject(refreshedContext);

      if (!options.json) {
        process.stdout.write(
          `Applied ${fixResult.appliedFixes} file-level fix${fixResult.appliedFixes === 1 ? "" : "es"}.\n`
        );
        if (fixResult.changedFiles.length > 0) {
          process.stdout.write(`${fixResult.changedFiles.map((file) => `- ${file}`).join("\n")}\n\n`);
        }
      }
    }
  }

  process.stdout.write(options.json ? `${renderJson(result)}\n` : `${renderReport(result)}\n`);
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    path: ".",
    json: false,
    fix: false,
    yes: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--fix") {
      options.fix = true;
      continue;
    }
    if (arg === "--yes" || arg === "-y") {
      options.yes = true;
      continue;
    }
    if (arg === "--path") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--path requires a value");
      }
      options.path = value;
      index += 1;
      continue;
    }
    if (arg === "--version" || arg === "-v") {
      process.stdout.write(`${packageJson.version ?? "0.0.0"}\n`);
      process.exit(0);
    }
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    options.path = arg;
  }

  return options;
}

async function confirmFix(issueCount: number): Promise<boolean> {
  if (issueCount === 0) {
    return false;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await rl.question(`Apply safe fixes for up to ${issueCount} detected issues? (y/N) `);
  rl.close();
  return answer.trim().toLowerCase() === "y";
}

function printHelp(): void {
  const lines = [
    "roastmyapp",
    "",
    "Usage:",
    "  roastmyapp [path] [--path <dir>] [--json] [--fix] [--yes]",
    "",
    "Options:",
    "  path          Scan the current directory or a provided project path",
    "  --path <dir>  Scan a specific directory",
    "  --json        Output JSON",
    "  --fix         Apply safe auto-fixes",
    "  --yes, -y     Skip the confirmation prompt for --fix",
    "  --version, -v Show version",
    "  --help, -h    Show help"
  ];

  process.stdout.write(`${lines.join("\n")}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`roastmyapp failed: ${message}\n`);
  process.exit(1);
});
