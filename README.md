# roastmyapp

[![npm version](https://img.shields.io/npm/v/roastmyapp.svg)](https://www.npmjs.com/package/roastmyapp)

Fix your slow Next.js app in 30 seconds.

```bash
npx roastmyapp
```

---

Example report:

Score: 82 (Good)

Critical

- Bare `<img>` tags (2)

Warnings

- Unnecessary `"use client"` (2)

Suggestions

- Missing `next.config` optimization

Run with `--fix` to auto-resolve safe issues.

---

## Why this exists

Most Next.js apps are slow for predictable reasons:

- wrong image usage
- unnecessary client components
- heavy imports
- missing optimizations

roastmyapp finds them quickly and tells you what actually matters.

---

## Quick Start

Run in your project:

```bash
npx roastmyapp
```

Scan another folder:

```bash
npx roastmyapp --path ./apps/web
```

Use in CI:

```bash
npx roastmyapp --json
```

Auto-fix safe issues:

```bash
npx roastmyapp --fix --yes
```

---

## What it checks

- bare `<img>` instead of `next/image`
- likely LCP images missing `priority`
- full `lodash`, `moment`, and root `react-icons` imports
- unnecessary `"use client"` directives
- external Google Fonts `<link>` usage
- bare `<script>` instead of `next/script`
- missing `next.config` optimizations

---

## When should you use this?

- before deploying to production
- after performance drops
- during code reviews
- in CI pipelines

---

## CLI Options

```bash
roastmyapp [path] [--path <dir>] [--json] [--fix] [--yes] [--help] [--version]
```

- `--path <dir>`: scan a specific directory
- `--json`: machine-readable output
- `--fix`: apply safe auto-fixes
- `--yes`, `-y`: skip confirmation for fixes
- `--help`, `-h`: show help
- `--version`, `-v`: show version

---

## Install Options

Run without installing:

```bash
npx roastmyapp
```

Install globally:

```bash
npm install -g roastmyapp
roastmyapp
```

---

## Limitations

- designed for Next.js projects only
- some monorepos or custom setups may not be detected
- `"use client"` suggestions may require manual review
- auto-fix is conservative and skips risky cases
- score reflects rule-based performance findings, not overall project quality

---

## Contributing

Found an issue or want to improve a rule?

Open an issue or PR:
https://github.com/AbhinavJain2107/roastmyapp

---

## Support

If this helped you:

- star the repo
- report issues
- share it with other devs

---

## License

MIT
