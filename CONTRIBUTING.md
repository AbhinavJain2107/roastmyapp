# Contributing to roastmyapp

Thanks for your interest in contributing to **roastmyapp**! We welcome bug reports, feature suggestions, and pull requests.

---

## Getting Started

### Prerequisites
- Node.js >= 18
- npm

### Development Setup

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/roastmyapp.git
   cd roastmyapp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the CLI in development:**
   ```bash
   # Run against current directory
   npm run dev

   # Run against a specific Next.js test project
   npm run dev -- /path/to/nextjs-app
   ```

4. **Run type checks:**
   ```bash
   npm run check
   ```

5. **Build the project:**
   ```bash
   npm run build
   ```

---

## Project Structure

```
roastmyapp/
├── src/
│   ├── cli.ts               # CLI argument parsing and entrypoint
│   ├── types.ts             # Core interfaces (Issue, SourceFile, ScanResult)
│   ├── scorer.ts            # Score calculation & grading logic
│   ├── scanner/             # Static analysis rules
│   │   ├── index.ts         # Scanner runner & orchestrator
│   │   ├── imageChecker.ts  # <img> tag & priority prop checks
│   │   ├── importChecker.ts # Heavy package import checks (lodash, moment, react-icons)
│   │   ├── clientChecker.ts # "use client" usage checks
│   │   ├── fontChecker.ts   # Google Fonts <link> checks
│   │   ├── scriptChecker.ts # Bare <script> tag checks
│   │   └── configChecker.ts # next.config.js optimization checks
│   ├── autofix/             # Safe automated fixes
│   │   ├── index.ts         # Fix runner
│   │   └── imageFixer.ts    # <img> to next/image codemods
│   └── utils/               # Text, JSX, and file parsing helpers
```

---

## Adding a New Scanner Rule

1. **Create your checker** in `src/scanner/yourRuleChecker.ts`:
   - Export a function `(file: SourceFile) => Issue[]`
   - Return clear, actionable messages explaining why the pattern is problematic and what to do instead.
2. **Register the checker** in `src/scanner/index.ts`.
3. **Add scoring penalty** in `src/scorer.ts` (if applicable).
4. **Update docs** in `README.md` under the "What it checks" section.
5. **Verify** with `npm run check` and test against real Next.js code.

---

## Submitting a Pull Request

1. Create a feature branch:
   ```bash
   git checkout -b feat/my-new-rule
   ```
2. Ensure TypeScript checks pass:
   ```bash
   npm run check
   npm run build
   ```
3. Commit with clear, descriptive commit messages:
   ```bash
   git commit -m "feat(scanner): add missing-next-image rule"
   ```
4. Push to your fork and open a Pull Request with context on the problem and solution.

---

## Code of Conduct

Please note that this project is released with a [Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.
