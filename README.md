# roastmyapp

Run one command. Find out why your Next.js app is slow.

## What It Does

`roastmyapp` scans a Next.js codebase for common performance issues like:

- bare `<img>` tags instead of `next/image`
- likely LCP images missing `priority`
- full `moment` or `lodash` imports
- unnecessary `"use client"` directives
- external Google Fonts `<link>` tags
- bare `<script>` tags instead of `next/script`
- missing `next.config.*` optimization settings

It returns a score from `0` to `100`, groups issues by severity, and can apply a few safe auto-fixes.

## Current Status

This is an MVP, but it is already useful on real Next.js apps:

- AST-backed detection for JSX image issues
- AST-backed analysis for likely unnecessary `"use client"` directives
- safer auto-fix behavior that avoids rewriting risky image cases
- terminal and JSON output for local use and CI workflows

## Local Development

Install dependencies:

```bash
npm install
```

Build the CLI:

```bash
npm run build
```

Run it against the current directory:

```bash
node dist/cli.js
```

Run it against another repo:

```bash
node dist/cli.js --path /absolute/path/to/your-next-app
```

Apply safe fixes:

```bash
node dist/cli.js --path /absolute/path/to/your-next-app --fix
```

Use JSON output:

```bash
node dist/cli.js --path /absolute/path/to/your-next-app --json
```

## Use It On Other Repos

You have three easy options.

### 1. Run It From This Repo

Build once, then point it at any local Next.js app:

```bash
node /absolute/path/to/roastmyapp/dist/cli.js --path /absolute/path/to/other-project
```

### 2. Link It Globally On Your Machine

From this repo:

```bash
npm install
npm run build
npm link
```

Then from any other repo:

```bash
roastmyapp
roastmyapp --fix
roastmyapp --json
```

Or scan a different folder directly:

```bash
roastmyapp --path /absolute/path/to/project
```

### 3. Use `npx` After Publishing

Once published to npm, anyone can run:

```bash
npx roastmyapp
```

Or:

```bash
npx roastmyapp --path /absolute/path/to/project
```

If the package name changes before publish, replace `roastmyapp` with the final npm package name.

## CLI Options

```bash
roastmyapp [path] [--path <dir>] [--json] [--fix] [--yes] [--help] [--version]
```

- `path`: optional positional path to scan
- `--path <dir>`: explicit path to scan
- `--json`: output machine-readable JSON
- `--fix`: apply safe auto-fixes
- `--yes`, `-y`: skip the confirmation prompt for `--fix`
- `--help`, `-h`: print help
- `--version`, `-v`: print the package version

Examples:

```bash
roastmyapp
roastmyapp .
roastmyapp ./apps/web
roastmyapp --path ./apps/web --json
roastmyapp --path ./apps/web --fix --yes
```

## Publishing

Before publishing:

```bash
npm run check
npm run build
npm pack
```

Then publish:

```bash
npm publish
```

`prepublishOnly` already runs the typecheck and build before publishing.

## Current Scope

This is an MVP CLI. It is useful already, but there is still room to improve:

- move more checks to AST-based analysis
- expand syntax-aware fixes beyond the current image pipeline
- add CI-friendly exit codes
- add more Next.js-specific performance rules

## Known Limitations

- It is designed for Next.js projects and may skip or warn on non-Next repos.
- Project detection can still miss unusual monorepo or custom setups.
- `"use client"` analysis is much better than a simple text scan, but some files still require manual review.
- Auto-fix is intentionally conservative and will skip risky or ambiguous JSX cases.
- Some config advice depends on hosting context, such as Vercel handling compression automatically.
- Generated code, wrappers, and indirect abstractions can hide behavior from static analysis.
