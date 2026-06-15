export type PineScriptKind = "indicator" | "strategy" | "library";
export type PineDiagnosticSeverity = "error" | "warning" | "info";
export type PineRuntimeStatus = "idle" | "compiled" | "attached" | "storage_error";

export interface PineDiagnostic {
  code: string;
  line: number;
  message: string;
  severity: PineDiagnosticSeverity;
}

export interface PinePlot {
  expression: string;
  title: string;
}

export interface PineSignal {
  expression: string;
  marker: string;
  title: string;
}

export interface PineChartOverlayPoint {
  time: string;
  value: number;
}

export interface PineChartOverlaySeries {
  color: string;
  expression: string;
  points: PineChartOverlayPoint[];
  title: string;
}

export interface PineChartOverlaySignal {
  color: string;
  marker: string;
  points: PineChartOverlayPoint[];
  title: string;
}

export interface PineChartOverlayPayload {
  checksum: string;
  generatedAt: string;
  kind: PineScriptKind;
  series: PineChartOverlaySeries[];
  signals: PineChartOverlaySignal[];
  title: string;
  unsupportedExpressions: string[];
}

export interface PineCompileResult {
  checksum: string;
  diagnostics: PineDiagnostic[];
  isExecutable: boolean;
  kind: PineScriptKind;
  lines: number;
  plots: PinePlot[];
  signals: PineSignal[];
  title: string;
}

export interface PineScriptTemplate {
  description: string;
  id: string;
  kind: PineScriptKind;
  name: string;
  source: string;
}

export interface PineSavedScript {
  checksum: string;
  id: string;
  kind: PineScriptKind;
  name: string;
  source: string;
  updatedAt: string;
}

export interface PineAttachedOverlay {
  chartOverlay: PineChartOverlayPayload;
  checksum: string;
  kind: PineScriptKind;
  plots: PinePlot[];
  signals: PineSignal[];
  title: string;
  updatedAt: string;
}

export interface PineEditorState {
  activeTemplateId: string;
  attachedOverlay: PineAttachedOverlay | null;
  compileResult: PineCompileResult;
  draftName: string;
  isDirty: boolean;
  lastSavedAt: string | null;
  runtimeStatus: PineRuntimeStatus;
  savedScripts: PineSavedScript[];
  source: string;
  storageError: string | null;
}

export type PineEditorAction =
  | { type: "hydrate_success"; state: PineEditorState }
  | { type: "edit_source"; value: string }
  | { type: "select_template"; now: string; template: PineScriptTemplate }
  | { type: "compile"; result: PineCompileResult }
  | { type: "save_draft_success"; now: string }
  | { type: "save_success"; now: string; script: PineSavedScript }
  | { type: "save_failed"; message: string }
  | { type: "attach_overlay"; chartOverlay: PineChartOverlayPayload; now: string }
  | { type: "reset_storage_error" };
