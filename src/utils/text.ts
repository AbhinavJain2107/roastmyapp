import * as path from "node:path";

import type { SourceFile } from "../types.js";

export function getLineNumber(content: string, matchIndex: number): number {
  if (matchIndex <= 0) {
    return 1;
  }

  return content.slice(0, matchIndex).split("\n").length;
}

export function hasLikelyClientBehavior(content: string): boolean {
  const signals = [
    /\bcreateContext\b/,
    /\buseContext\b/,
    /\buseState\b/,
    /\buseEffect\b/,
    /\buseReducer\b/,
    /\buseLayoutEffect\b/,
    /\buseRef\b/,
    /\buseMemo\b/,
    /\buseCallback\b/,
    /\buseImperativeHandle\b/,
    /\buseSyncExternalStore\b/,
    /\buseOptimistic\b/,
    /\buseActionState\b/,
    /\buseTransition\b/,
    /\buse[A-Z][A-Za-z0-9_]*\b/,
    /\baddEventListener\b/,
    /\bremoveEventListener\b/,
    /\bResizeObserver\b/,
    /\bIntersectionObserver\b/,
    /\bMutationObserver\b/,
    /\bmatchMedia\b/,
    /\brequestAnimationFrame\b/,
    /\bon[A-Z][A-Za-z]+\s*=/,
    /\bwindow\b/,
    /\bdocument\b/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bnavigator\b/
  ];

  return signals.some((signal) => signal.test(content));
}

export function hasLikelyClientOnlyImports(content: string): boolean {
  const clientOnlyImports = [
    /from\s+["']@radix-ui\//,
    /from\s+["']framer-motion["']/,
    /from\s+["']next-themes["']/,
    /from\s+["']sonner["']/,
    /from\s+["']embla-carousel-react["']/,
    /from\s+["']react-day-picker["']/,
    /from\s+["']recharts["']/,
    /from\s+["']vaul["']/,
    /from\s+["']cmdk["']/
  ];

  return clientOnlyImports.some((signal) => signal.test(content));
}

export function uniqueBy<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function isLikelyComponentFile(file: SourceFile): boolean {
  if (file.extension === ".tsx" || file.extension === ".jsx") {
    return true;
  }

  if (file.extension !== ".ts" && file.extension !== ".js") {
    return false;
  }

  const baseName = path.basename(file.relativePath, file.extension);
  return /^(page|layout|template|loading|error|not-found|default|head|document|app)$/i.test(baseName);
}
