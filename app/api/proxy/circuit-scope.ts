export type ProxyCircuitScopeOperation = "lookup" | "catalog" | "instrument" | "detail" | "list";

const normalizeScopePart = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";

const extractResourceSegments = (actualPath: string): string[] => {
  const segments = actualPath.split("/").map((segment) => segment.trim()).filter(Boolean);
  const apiIndex = segments.findIndex((segment, index) => (
    segment.toLowerCase() === "api" && /^v\d+$/i.test(segments[index + 1] ?? "")
  ));
  return apiIndex >= 0 ? segments.slice(apiIndex + 2) : segments;
};

const resolveFamily = (resourceSegments: readonly string[]): { family: string; consumed: number } => {
  const first = normalizeScopePart(resourceSegments[0] ?? "root");
  if (first === "fixed-income" && resourceSegments[1]) {
    return { family: `${first}.${normalizeScopePart(resourceSegments[1])}`, consumed: 2 };
  }
  return { family: first, consumed: 1 };
};

const resolveListOperation = (
  family: string,
  searchParams: URLSearchParams,
): ProxyCircuitScopeOperation => {
  if (family === "actions") {
    if (searchParams.has("ticker") || searchParams.has("isin")) return "lookup";
    if (searchParams.has("view_type")) return "catalog";
  }
  if (family === "cours" && searchParams.has("instrument")) return "instrument";
  return "list";
};

/**
 * Build a bounded circuit-breaker scope from route shape, never from ticker/UUID values.
 * A failing query class must not open the breaker for unrelated financial resources.
 */
export const buildProxyCircuitBreakerScope = (
  apiIdentifier: string,
  actualPath: string,
  searchParams: URLSearchParams,
): string => {
  const resourceSegments = extractResourceSegments(actualPath);
  const { family, consumed } = resolveFamily(resourceSegments);
  const operation: ProxyCircuitScopeOperation = resourceSegments.length > consumed
    ? "detail"
    : resolveListOperation(family, searchParams);

  return `api-${normalizeScopePart(apiIdentifier)}:${family}:${operation}`;
};
