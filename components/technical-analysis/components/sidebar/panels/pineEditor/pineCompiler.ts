import type { PineCompileResult, PineDiagnostic, PinePlot, PineScriptKind, PineSignal } from "./pineTypes";

const MAX_SOURCE_LENGTH = 12_000;
const MAX_SOURCE_LINES = 320;
const FALLBACK_TITLE = "Untitled Pine Script";
const DECLARATION_PATTERN = /^\s*(indicator|strategy|library)\s*\(\s*["']([^"']{1,90})["']/m;

export const normalizePineSource = (source: string): string => (
  source
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .slice(0, MAX_SOURCE_LINES + 1)
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .slice(0, MAX_SOURCE_LENGTH + 1)
);

export const buildPineChecksum = (source: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
};

export const parseIndicatorDeclaration = (source: string) => {
  const match = source.match(DECLARATION_PATTERN);
  if (!match) return null;
  return {
    kind: match[1] as PineScriptKind,
    title: match[2].trim(),
  };
};

export const extractPinePlots = (source: string): PinePlot[] => {
  const plots: PinePlot[] = [];
  const pattern = /\bplot\s*\(\s*([^,\n)]+)(?:\s*,\s*["']([^"']{1,80})["'])?/g;
  for (const match of source.matchAll(pattern)) {
    const expression = cleanExpression(match[1]);
    if (!expression) continue;
    plots.push({ expression, title: cleanTitle(match[2]) || expression });
  }
  return uniqueByTitle(plots).slice(0, 8);
};

export const extractPineSignals = (source: string): PineSignal[] => {
  const signals: PineSignal[] = [];
  const pattern = /\b(plotchar|plotshape)\s*\(\s*([^,\n)]+)(?:\s*,\s*["']([^"']{1,80})["'])?(?:\s*,\s*["']([^"']{1,12})["'])?/g;
  for (const match of source.matchAll(pattern)) {
    const expression = cleanExpression(match[2]);
    if (!expression) continue;
    const title = cleanTitle(match[3]) || `${match[1]} signal`;
    signals.push({ expression, marker: cleanTitle(match[4]) || "•", title });
  }
  return uniqueByTitle(signals).slice(0, 8);
};

export const compilePineScript = (source: string): PineCompileResult => {
  const normalized = normalizePineSource(source);
  const diagnostics: PineDiagnostic[] = [];
  const lines = countLines(normalized);
  pushSourceGuards(source, normalized, lines, diagnostics);
  pushSyntaxGuards(normalized, diagnostics);

  const declaration = parseIndicatorDeclaration(normalized);
  if (!declaration) {
    diagnostics.push(error("PINE_DECLARATION_MISSING", 1, "Declare indicator(), strategy(), or library() before script logic."));
  }
  const plots = extractPinePlots(normalized);
  const signals = extractPineSignals(normalized);
  if (declaration?.kind !== "library" && plots.length === 0 && signals.length === 0) {
    diagnostics.push(warning("PINE_NO_OUTPUT", 1, "Add plot(), plotchar(), or plotshape() before attaching this script to the chart."));
  }
  const hasChartOutput = plots.length > 0 || signals.length > 0;
  if (declaration?.kind === "library" && !hasChartOutput) {
    diagnostics.push(info("PINE_LIBRARY_NO_OUTPUT", 1, "Library scripts define helper functions and cannot be attached to the chart."));
  }
  return {
    checksum: buildPineChecksum(normalized),
    diagnostics,
    isExecutable: diagnostics.every((diagnostic) => diagnostic.severity !== "error") && hasChartOutput,
    kind: declaration?.kind ?? "indicator",
    lines,
    plots,
    signals,
    title: declaration?.title || FALLBACK_TITLE,
  };
};

const pushSourceGuards = (source: string, normalized: string, lines: number, diagnostics: PineDiagnostic[]) => {
  if (normalized.trim().length === 0) diagnostics.push(error("PINE_EMPTY_SOURCE", 1, "Pine source cannot be empty."));
  if (source.length > MAX_SOURCE_LENGTH) diagnostics.push(error("PINE_SOURCE_TOO_LARGE", 1, `Source is capped at ${MAX_SOURCE_LENGTH} characters.`));
  if (lines > MAX_SOURCE_LINES) diagnostics.push(error("PINE_TOO_MANY_LINES", MAX_SOURCE_LINES + 1, `Source is capped at ${MAX_SOURCE_LINES} lines.`));
  if (!/^\s*\/\/@version=5/m.test(normalized)) diagnostics.push(error("PINE_VERSION_REQUIRED", 1, "Add //@version=5 at the top of the script."));
};

const pushSyntaxGuards = (source: string, diagnostics: PineDiagnostic[]) => {
  const balance = checkDelimiterBalance(source);
  if (balance) diagnostics.push(error(balance.code, balance.line, balance.message));
  source.split("\n").forEach((line, index) => {
    if (/\beval\s*\(|\bFunction\s*\(|<script\b/i.test(line)) {
      diagnostics.push(error("PINE_UNSAFE_TOKEN", index + 1, "Unsafe JavaScript-like token rejected; Pine preview is never executed as JavaScript."));
    }
  });
};

const checkDelimiterBalance = (source: string) => {
  const stack: Array<{ char: string; line: number }> = [];
  let quote: string | null = null;
  let line = 1;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === "\n") line += 1;
    if ((char === "\"" || char === "'") && source[index - 1] !== "\\") quote = quote === char ? null : quote ?? char;
    if (quote) continue;
    if (char === "(" || char === "[" || char === "{") stack.push({ char, line });
    if (char === ")" || char === "]" || char === "}") {
      const open = stack.pop();
      if (!open || !isMatchingDelimiter(open.char, char)) return { code: "PINE_DELIMITER_MISMATCH", line, message: `Unexpected closing delimiter ${char}.` };
    }
  }
  const open = stack.pop();
  return open ? { code: "PINE_DELIMITER_UNCLOSED", line: open.line, message: `Unclosed delimiter ${open.char}.` } : null;
};

const isMatchingDelimiter = (open: string, close: string) => (
  (open === "(" && close === ")") || (open === "[" && close === "]") || (open === "{" && close === "}")
);

const uniqueByTitle = <T extends { title: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const cleanExpression = (value: string | undefined) => (value ?? "").trim().slice(0, 96);
const cleanTitle = (value: string | undefined) => (value ?? "").trim().slice(0, 80);
const countLines = (source: string) => source.length === 0 ? 1 : source.split("\n").length;
const error = (code: string, line: number, message: string): PineDiagnostic => ({ code, line, message, severity: "error" });
const warning = (code: string, line: number, message: string): PineDiagnostic => ({ code, line, message, severity: "warning" });
const info = (code: string, line: number, message: string): PineDiagnostic => ({ code, line, message, severity: "info" });
