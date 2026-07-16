export type SidebarClipboardStatus = "idle" | "copied" | "error";

export interface SidebarClipboardResult {
  status: SidebarClipboardStatus;
  message: string;
}

export async function copySidebarText(value: string | null | undefined): Promise<SidebarClipboardResult> {
  const text = (value || "").trim();
  if (!text) {
    return { status: "error", message: "Valeur indisponible" };
  }

  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return { status: "error", message: "Clipboard indisponible" };
  }

  try {
    await navigator.clipboard.writeText(text);
    return { status: "copied", message: "Copie" };
  } catch {
    return { status: "error", message: "Echec copie" };
  }
}

export function getSidebarClipboardLabel(status: SidebarClipboardStatus): string {
  if (status === "copied") return "Copie";
  if (status === "error") return "Echec";
  return "";
}
