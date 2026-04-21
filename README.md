# roastmyapp

[![npm version](https://img.shields.io/npm/v/roastmyapp.svg)](https://www.npmjs.com/package/roastmyapp)

Run one command and find out why your Next.js app is slow.

NPM: https://www.npmjs.com/package/roastmyapp

## Why roastmyapp

When a Next.js app feels slow, it is usually caused by a handful of repeat issues.
roastmyapp gives you a fast, practical report with a score, clear issue groups, and safe fixes for selected cases.

## Quick Start

Run in the current folder:

```bash
npx roastmyapp
```

Run in another folder:

```bash
npx roastmyapp --path ./apps/web
```

JSON output (for CI):

```bash
npx roastmyapp --path ./apps/web --json
```

Apply safe fixes without prompt:

```bash
npx roastmyapp --path ./apps/web --fix --yes
```

## Example Output

```text
roastmyapp
Score: 82 (Good)
Scanned 128 files in /Users/you/apps/web
Found 6 issues

Top Rules
- no-bare-img: 2 (critical)
- unnecessary-use-client: 2 (warn)
- missing-next-config: 1 (info)

[critical] CRITICAL (2)
- app/page.tsx:18 Bare <img> tag found. Prefer next/image for lazy loading and sizing. [no-bare-img, fixable]

[warn] WARN (2)
- components/Hero.tsx:1 "use client" may be unnecessary; this file does not directly use client hooks, event handlers, browser APIs, or client-only imports. [unnecessary-use-client, manual]
```

## What It Checks

- bare `<img>` tags instead of `next/image`
- likely LCP images missing `priority`
- full `moment`, `lodash`, and root `react-icons` imports
- unnecessary `"use client"` directives
- external Google Fonts `<link>` tags
- bare `<script>` tags instead of `next/script`
- missing `next.config.*` optimization settings

It returns a score from `0` to `100`, groups issues by severity, and can apply safe auto-fixes for selected rules.

## Install Options

Run without install:

```bash
npx roastmyapp
```

Install globally:

```bash
npm install -g roastmyapp
roastmyapp --help
```

## CLI Options

```bash
roastmyapp [path] [--path <dir>] [--json] [--fix] [--yes] [--help] [--version]
```

- `path`: optional positional path to scan
- `--path <dir>`: explicit path to scan
- `--json`: machine-readable output
- `--fix`: apply safe auto-fixes
- `--yes`, `-y`: skip fix confirmation prompt
- `--help`, `-h`: show help
- `--version`, `-v`: show version

## Local Development

```bash
npm install
npm run build
node dist/cli.js
```

Run against another repo:

```bash
node dist/cli.js --path /absolute/path/to/your-next-app
```

Run tests for release confidence:

```bash
npm run check
```

## Publishing (Maintainers)

Recommended preflight:

```bash
npm pack
```

Publish:

```bash
npm publish
```

Note: `prepublishOnly` already runs typecheck and build.

## Limitations

- Designed for Next.js projects; non-Next projects may be skipped.
- Some project layouts can be hard to detect (for example unusual monorepos).
- `"use client"` suggestions can still require manual review.
- Auto-fix is conservative and intentionally skips risky cases.
