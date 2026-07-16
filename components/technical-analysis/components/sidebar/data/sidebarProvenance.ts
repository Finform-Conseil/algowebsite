export type SidebarProvenanceKind =
  | "verified_external"
  | "local_catalog"
  | "derived_model"
  | "synthetic_mock"
  | "unavailable";

export type SidebarProvenanceTone = "neutral" | "warning" | "success";

export interface SidebarProvenance {
  kind: SidebarProvenanceKind;
  label: string;
  tone: SidebarProvenanceTone;
  source?: string;
  detail?: string;
  timestamp?: string;
}

export function getSourceHost(source: string | null | undefined): string {
  if (!source) return "";
  try {
    const url = new URL(source);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return source.trim();
  }
}

export function createFundamentalsProvenance(source: string | null | undefined): SidebarProvenance {
  const host = getSourceHost(source);
  if (host) {
    return {
      kind: "verified_external",
      label: host,
      tone: "success",
      source: source || host,
    };
  }

  return {
    kind: "local_catalog",
    label: "Fallback catalogue local",
    tone: "warning",
    detail: "Aucune source BRVM distante declaree",
  };
}

export function createSyntheticMockProvenance(label = "Mock dataset"): SidebarProvenance {
  return {
    kind: "synthetic_mock",
    label,
    tone: "warning",
    detail: "Donnees de demonstration, pas une source marche",
  };
}

export function createUnavailableProvenance(label = "Indisponible"): SidebarProvenance {
  return {
    kind: "unavailable",
    label,
    tone: "warning",
  };
}

export function createDerivedModelProvenance(label: string): SidebarProvenance {
  return {
    kind: "derived_model",
    label,
    tone: "warning",
    detail: "Sortie de modele interne",
  };
}

export function formatProvenanceLabel(provenance: SidebarProvenance): string {
  if (provenance.detail) return `${provenance.label} (${provenance.detail})`;
  return provenance.label;
}
