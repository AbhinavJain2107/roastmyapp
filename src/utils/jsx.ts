import ts from "typescript";

import type { SourceFile } from "../types.js";

export interface JsxImageNodeInfo {
  kind: "img" | "Image";
  tagText: string;
  start: number;
  line: number;
  isSelfClosing: boolean;
  hasChildren: boolean;
  hasWidth: boolean;
  hasHeight: boolean;
  hasFill: boolean;
  hasPriority: boolean;
  hasDataLcp: boolean;
  isLikelyLcp: boolean;
  hasSrc: boolean;
  hasAlt: boolean;
  hasSpreadAttributes: boolean;
  hasRiskyAttributes: boolean;
  canAutoFix: boolean;
}

export interface TextReplacement {
  start: number;
  end: number;
  text: string;
}

export interface UseClientAnalysis {
  hasUseClientDirective: boolean;
  directiveLine: number;
  usesReactClientHooks: boolean;
  usesCustomHooks: boolean;
  usesContextApis: boolean;
  usesJsxEventHandlers: boolean;
  usesBrowserApis: boolean;
  usesClientOnlyImports: boolean;
  usesClassLifecycleApis: boolean;
  usesProviderPatterns: boolean;
  likelyNeedsClient: boolean;
}

export function findJsxImageNodes(file: SourceFile): JsxImageNodeInfo[] {
  const source = createTsSourceFile(file);
  const nodes: JsxImageNodeInfo[] = [];

  function visit(node: ts.Node): void {
    if (ts.isJsxSelfClosingElement(node)) {
      const info = getImageInfoFromAttributes(source, node.tagName.getText(source), node.attributes, node);
      if (info) {
        nodes.push({
          ...info,
          start: node.getStart(source),
          line: getLineNumberFromSource(source, node.getStart(source)),
          isSelfClosing: true,
          hasChildren: false,
          tagText: node.getText(source)
        });
      }
    }

    if (ts.isJsxElement(node)) {
      const opening = node.openingElement;
      const info = getImageInfoFromAttributes(source, opening.tagName.getText(source), opening.attributes, opening);
      if (info) {
        nodes.push({
          ...info,
          start: opening.getStart(source),
          line: getLineNumberFromSource(source, opening.getStart(source)),
          isSelfClosing: false,
          hasChildren: node.children.length > 0,
          tagText: node.getText(source)
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(source);
  return nodes;
}

export function createTsSourceFile(file: SourceFile): ts.SourceFile {
  return ts.createSourceFile(file.path, file.content, ts.ScriptTarget.Latest, true, getScriptKind(file.extension));
}

export function applyTextReplacements(content: string, replacements: TextReplacement[]): string {
  return [...replacements]
    .sort((left, right) => right.start - left.start)
    .reduce((current, replacement) => {
      return current.slice(0, replacement.start) + replacement.text + current.slice(replacement.end);
    }, content);
}

export function getSafeImageAutoFixReplacements(file: SourceFile): TextReplacement[] {
  const source = createTsSourceFile(file);
  const replacements: TextReplacement[] = [];

  function visit(node: ts.Node): void {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === "img") {
      const info = getImageInfoFromAttributes(source, "img", node.attributes, node);
      if (info?.canAutoFix) {
        replacements.push({
          start: node.getStart(source),
          end: node.getEnd(),
          text: buildImageReplacement("img", node.attributes, true, source)
        });
      }
    }

    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === "img") {
      const info = getImageInfoFromAttributes(source, "img", node.openingElement.attributes, node.openingElement);
      if (info?.canAutoFix && node.children.length === 0) {
        replacements.push({
          start: node.getStart(source),
          end: node.getEnd(),
          text: `${buildImageReplacement("img", node.openingElement.attributes, false, source)}</Image>`
        });
      }
    }

    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === "Image") {
      const info = getImageInfoFromAttributes(source, "Image", node.attributes, node);
      if (info?.hasDataLcp && !info.hasPriority) {
        replacements.push({
          start: node.getStart(source),
          end: node.getEnd(),
          text: buildImageReplacement("Image", node.attributes, true, source)
        });
      }
    }

    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === "Image") {
      const info = getImageInfoFromAttributes(source, "Image", node.openingElement.attributes, node.openingElement);
      if (info?.hasDataLcp && !info.hasPriority) {
        replacements.push({
          start: node.openingElement.getStart(source),
          end: node.openingElement.getEnd(),
          text: buildImageReplacement("Image", node.openingElement.attributes, false, source)
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(source);
  return replacements;
}

export function analyzeUseClient(file: SourceFile): UseClientAnalysis {
  const source = createTsSourceFile(file);
  const directive = getUseClientDirective(source);

  if (!directive) {
    return {
      hasUseClientDirective: false,
      directiveLine: 0,
      usesReactClientHooks: false,
      usesCustomHooks: false,
      usesContextApis: false,
      usesJsxEventHandlers: false,
      usesBrowserApis: false,
      usesClientOnlyImports: false,
      usesClassLifecycleApis: false,
      usesProviderPatterns: false,
      likelyNeedsClient: false
    };
  }

  let usesReactClientHooks = false;
  let usesCustomHooks = false;
  let usesContextApis = false;
  let usesJsxEventHandlers = false;
  let usesBrowserApis = false;
  let usesClientOnlyImports = false;
  let usesClassLifecycleApis = false;
  let usesProviderPatterns = false;

  function visit(node: ts.Node): void {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const moduleName = node.moduleSpecifier.text;
      if (isClientOnlyImport(moduleName)) {
        usesClientOnlyImports = true;
      }
    }

    if (ts.isIdentifier(node)) {
      const name = node.text;

      if (isReactClientHook(name)) {
        usesReactClientHooks = true;
      } else if (isContextApi(name)) {
        usesContextApis = true;
      } else if (isBrowserApi(name)) {
        usesBrowserApis = true;
      } else if (isCustomHook(name)) {
        usesCustomHooks = true;
      } else if (isClassLifecycleApi(name)) {
        usesClassLifecycleApis = true;
      }
    }

    if (ts.isPropertyAccessExpression(node)) {
      const expressionText = node.expression.getText(source);
      const name = node.name.text;
      if (isBrowserObject(expressionText) || isBrowserApi(name)) {
        usesBrowserApis = true;
      }
    }

    if (ts.isJsxAttribute(node)) {
      const attributeName = getJsxAttributeName(node.name);
      if (/^on[A-Z]/.test(attributeName)) {
        usesJsxEventHandlers = true;
      }
    }

    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      const tagName = node.tagName.getText(source);
      if (isProviderLikeTag(tagName)) {
        usesProviderPatterns = true;
      }
    }

    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      if (isProviderLikeName(node.name.text)) {
        usesProviderPatterns = true;
      }
    }

    if (ts.isFunctionDeclaration(node) && node.name) {
      if (isProviderLikeName(node.name.text)) {
        usesProviderPatterns = true;
      }
    }

    if (ts.isParameter(node) && ts.isObjectBindingPattern(node.name)) {
      for (const element of node.name.elements) {
        if (element.name && ts.isIdentifier(element.name) && isProviderLikeName(element.name.text)) {
          usesProviderPatterns = true;
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(source);

  return {
    hasUseClientDirective: true,
    directiveLine: getLineNumberFromSource(source, directive.getStart(source)),
    usesReactClientHooks,
    usesCustomHooks,
    usesContextApis,
    usesJsxEventHandlers,
    usesBrowserApis,
    usesClientOnlyImports,
    usesClassLifecycleApis,
    usesProviderPatterns,
    likelyNeedsClient:
      usesReactClientHooks ||
      usesCustomHooks ||
      usesContextApis ||
      usesJsxEventHandlers ||
      usesBrowserApis ||
      usesClientOnlyImports ||
      usesClassLifecycleApis ||
      usesProviderPatterns
  };
}

function getImageInfoFromAttributes(
  source: ts.SourceFile,
  tagName: string,
  attributes: ts.JsxAttributes,
  node: ts.Node
): Omit<JsxImageNodeInfo, "start" | "line" | "isSelfClosing" | "hasChildren" | "tagText"> | null {
  if (tagName !== "img" && tagName !== "Image") {
    return null;
  }

  const names = new Set<string>();
  let hasSpreadAttributes = false;

  for (const attribute of attributes.properties) {
    if (ts.isJsxSpreadAttribute(attribute)) {
      hasSpreadAttributes = true;
      continue;
    }

    names.add(getJsxAttributeName(attribute.name));
  }

  const hasWidth = names.has("width");
  const hasHeight = names.has("height");
  const hasFill = names.has("fill");
  const hasPriority = names.has("priority");
  const hasDataLcp = names.has("data-lcp");
  const hasSrc = names.has("src");
  const hasAlt = names.has("alt");
  const hasRiskyAttributes =
    names.has("ref") || names.has("onLoad") || names.has("onError") || names.has("loader");

  const tagText = node.getText(source);
  const isLikelyLcp = hasDataLcp || /hero|priority-image/i.test(tagText);
  const canAutoFix =
    tagName === "img" &&
    hasSrc &&
    hasAlt &&
    hasWidth &&
    hasHeight &&
    !hasSpreadAttributes &&
    !hasRiskyAttributes;

  return {
    kind: tagName,
    hasWidth,
    hasHeight,
    hasFill,
    hasPriority,
    hasDataLcp,
    isLikelyLcp,
    hasSrc,
    hasAlt,
    hasSpreadAttributes,
    hasRiskyAttributes,
    canAutoFix
  };
}

function buildImageReplacement(
  tagName: "img" | "Image",
  attributes: ts.JsxAttributes,
  selfClosing: boolean,
  source: ts.SourceFile
): string {
  const renderedAttributes = attributes.properties.flatMap((attribute) => {
    if (ts.isJsxSpreadAttribute(attribute)) {
      return [attribute.getText(source)];
    }

    if (getJsxAttributeName(attribute.name) === "data-lcp") {
      return [];
    }

    return [attribute.getText(source)];
  });

  const hasPriority = attributes.properties.some(
    (attribute) => ts.isJsxAttribute(attribute) && getJsxAttributeName(attribute.name) === "priority"
  );
  const hasDataLcp = attributes.properties.some(
    (attribute) => ts.isJsxAttribute(attribute) && getJsxAttributeName(attribute.name) === "data-lcp"
  );

  if (hasDataLcp && !hasPriority) {
    renderedAttributes.push("priority");
  }

  const joinedAttributes = renderedAttributes.length > 0 ? ` ${renderedAttributes.join(" ")}` : "";
  const nextTagName: "Image" = tagName === "img" ? "Image" : "Image";
  return selfClosing ? `<${nextTagName}${joinedAttributes} />` : `<${nextTagName}${joinedAttributes}>`;
}

function getLineNumberFromSource(source: ts.SourceFile, position: number): number {
  return ts.getLineAndCharacterOfPosition(source, position).line + 1;
}

function getScriptKind(extension: string): ts.ScriptKind {
  if (extension === ".tsx") return ts.ScriptKind.TSX;
  if (extension === ".jsx") return ts.ScriptKind.JSX;
  if (extension === ".js") return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function getJsxAttributeName(name: ts.JsxAttributeName): string {
  return ts.isIdentifier(name) ? name.text : name.getText();
}

function getUseClientDirective(source: ts.SourceFile): ts.StringLiteral | undefined {
  for (const statement of source.statements) {
    if (!ts.isExpressionStatement(statement) || !ts.isStringLiteral(statement.expression)) {
      break;
    }

    if (statement.expression.text === "use client") {
      return statement.expression;
    }
  }

  return undefined;
}

function isReactClientHook(name: string): boolean {
  return new Set([
    "useState",
    "useEffect",
    "useReducer",
    "useLayoutEffect",
    "useRef",
    "useMemo",
    "useCallback",
    "useImperativeHandle",
    "useSyncExternalStore",
    "useOptimistic",
    "useActionState",
    "useTransition",
    "useDeferredValue",
    "useSelectedLayoutSegment",
    "useSelectedLayoutSegments",
    "usePathname",
    "useRouter",
    "useSearchParams",
    "useParams"
  ]).has(name);
}

function isContextApi(name: string): boolean {
  return name === "createContext" || name === "useContext";
}

function isCustomHook(name: string): boolean {
  return /^use[A-Z0-9]/.test(name) && !isReactServerOnlyUtility(name);
}

function isBrowserApi(name: string): boolean {
  return new Set([
    "window",
    "document",
    "localStorage",
    "sessionStorage",
    "navigator",
    "matchMedia",
    "ResizeObserver",
    "IntersectionObserver",
    "MutationObserver",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    "addEventListener",
    "removeEventListener",
    "HTMLElement",
    "HTMLDivElement",
    "HTMLInputElement",
    "HTMLTextAreaElement"
  ]).has(name);
}

function isBrowserObject(name: string): boolean {
  return name === "window" || name === "document" || name === "navigator";
}

function isClientOnlyImport(moduleName: string): boolean {
  return [
    "@radix-ui/",
    "framer-motion",
    "next-themes",
    "sonner",
    "embla-carousel-react",
    "react-day-picker",
    "recharts",
    "vaul",
    "cmdk"
  ].some((prefix) => moduleName === prefix || moduleName.startsWith(prefix));
}

function isClassLifecycleApi(name: string): boolean {
  return name === "Component" || name === "PureComponent";
}

function isReactServerOnlyUtility(name: string): boolean {
  return name === "use";
}

function isProviderLikeTag(tagName: string): boolean {
  return /(^|\.)([A-Z][A-Za-z0-9]*)?Provider$/.test(tagName);
}

function isProviderLikeName(name: string): boolean {
  return /provider/i.test(name) || /context/i.test(name);
}
