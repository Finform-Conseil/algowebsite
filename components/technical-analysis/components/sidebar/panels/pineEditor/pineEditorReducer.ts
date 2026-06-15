import { compilePineScript } from "./pineCompiler";
import type { PineAttachedOverlay, PineCompileResult, PineEditorAction, PineEditorState, PineSavedScript, PineScriptTemplate } from "./pineTypes";

const MAX_SAVED_SCRIPTS = 12;

export const createInitialPineEditorState = (template: PineScriptTemplate): PineEditorState => {
  const compileResult = compilePineScript(template.source);
  return {
    activeTemplateId: template.id,
    attachedOverlay: null,
    compileResult,
    draftName: template.name,
    isDirty: false,
    lastSavedAt: null,
    runtimeStatus: compileResult.isExecutable ? "compiled" : "idle",
    savedScripts: [],
    source: template.source,
    storageError: null,
  };
};

export const applyPineCompileResult = (state: PineEditorState, result: PineCompileResult): PineEditorState => ({
  ...state,
  compileResult: result,
  draftName: result.title,
  runtimeStatus: result.isExecutable ? "compiled" : "idle",
});

export const pineEditorReducer = (state: PineEditorState, action: PineEditorAction): PineEditorState => {
  if (action.type === "hydrate_success") return action.state;
  if (action.type === "edit_source") return editSource(state, action.value);
  if (action.type === "select_template") return selectTemplate(state, action.template);
  if (action.type === "compile") return applyPineCompileResult(state, action.result);
  if (action.type === "save_draft_success") return saveDraft(state, action.now);
  if (action.type === "save_success") return saveScript(state, action.script, action.now);
  if (action.type === "save_failed") return { ...state, runtimeStatus: "storage_error", storageError: action.message };
  if (action.type === "attach_overlay") return attachOverlay(state, action.chartOverlay, action.now);
  if (action.type === "reset_storage_error") return { ...state, runtimeStatus: state.compileResult.isExecutable ? "compiled" : "idle", storageError: null };
  return state;
};

const editSource = (state: PineEditorState, source: string): PineEditorState => {
  const compileResult = compilePineScript(source);
  return {
    ...state,
    attachedOverlay: state.attachedOverlay?.checksum === compileResult.checksum ? state.attachedOverlay : null,
    compileResult,
    draftName: compileResult.title,
    isDirty: true,
    runtimeStatus: compileResult.isExecutable ? "compiled" : "idle",
    source,
    storageError: null,
  };
};

const selectTemplate = (state: PineEditorState, template: PineScriptTemplate): PineEditorState => {
  const compileResult = compilePineScript(template.source);
  return {
    ...state,
    activeTemplateId: template.id,
    attachedOverlay: null,
    compileResult,
    draftName: template.name,
    isDirty: true,
    runtimeStatus: compileResult.isExecutable ? "compiled" : "idle",
    source: template.source,
    storageError: null,
  };
};

const saveDraft = (state: PineEditorState, now: string): PineEditorState => ({
  ...state,
  isDirty: false,
  lastSavedAt: now,
  runtimeStatus: state.compileResult.isExecutable ? "compiled" : "idle",
  storageError: null,
});

const saveScript = (state: PineEditorState, script: PineSavedScript, now: string): PineEditorState => ({
  ...state,
  isDirty: false,
  lastSavedAt: now,
  runtimeStatus: state.compileResult.isExecutable ? "compiled" : "idle",
  savedScripts: upsertSavedScript(state.savedScripts, script),
  storageError: null,
});

const attachOverlay = (state: PineEditorState, chartOverlay: PineAttachedOverlay["chartOverlay"], now: string): PineEditorState => {
  if (!state.compileResult.isExecutable) return state;
  const attachedOverlay: PineAttachedOverlay = {
    chartOverlay,
    checksum: state.compileResult.checksum,
    kind: state.compileResult.kind,
    plots: state.compileResult.plots,
    signals: state.compileResult.signals,
    title: state.compileResult.title,
    updatedAt: now,
  };
  return { ...state, attachedOverlay, runtimeStatus: "attached", storageError: null };
};

const upsertSavedScript = (scripts: PineSavedScript[], script: PineSavedScript) => [
  script,
  ...scripts.filter((current) => current.id !== script.id && current.checksum !== script.checksum),
].slice(0, MAX_SAVED_SCRIPTS);
