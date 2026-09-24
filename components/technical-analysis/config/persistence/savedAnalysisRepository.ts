import type { SavedAnalysis } from "./savedAnalysisTypes";
import { idbGetStrict, idbSetStrict } from "../../hooks/drawing/drawingPersistence";

export const SAVED_ANALYSES_KEY = "savedAnalyses";
export const SAVED_ANALYSES_LIMIT = 100;

const timestampOf = (analysis: SavedAnalysis): number =>
  new Date(analysis.config.updatedAt ?? analysis.config.savedAt).getTime();

export const normalizeSavedAnalysis = (analysis: SavedAnalysis): SavedAnalysis => {
  const createdAt = analysis.config.createdAt ?? analysis.config.savedAt;
  const updatedAt = analysis.config.updatedAt ?? analysis.config.savedAt;
  return {
    ...analysis,
    name: analysis.name.trim() || analysis.config.symbol,
    config: {
      ...analysis.config,
      version: 3,
      createdAt,
      updatedAt,
      savedAt: updatedAt,
      drawings: Array.isArray(analysis.config.drawings)
        ? analysis.config.drawings.map((drawing) => ({ ...drawing }))
        : undefined,
    },
  };
};

const sortNewestFirst = (items: SavedAnalysis[]): SavedAnalysis[] =>
  [...items].sort((a, b) => timestampOf(b) - timestampOf(a));

export const listSavedAnalyses = async (): Promise<SavedAnalysis[]> => {
  const stored = await idbGetStrict<SavedAnalysis[]>(SAVED_ANALYSES_KEY);
  if (!Array.isArray(stored)) return [];
  return sortNewestFirst(stored.map(normalizeSavedAnalysis));
};

export const persistSavedAnalysis = async (analysis: SavedAnalysis): Promise<SavedAnalysis[]> => {
  const normalized = normalizeSavedAnalysis(analysis);
  const current = await listSavedAnalyses();
  const next = sortNewestFirst([
    normalized,
    ...current.filter((item) => item.id !== normalized.id),
  ]).slice(0, SAVED_ANALYSES_LIMIT);
  await idbSetStrict(SAVED_ANALYSES_KEY, next);

  const verified = await listSavedAnalyses();
  const durable = verified.find((item) => item.id === normalized.id);
  if (!durable || durable.config.updatedAt !== normalized.config.updatedAt) {
    throw new Error("Saved analysis durability verification failed");
  }
  return verified;
};

export const deleteSavedAnalysis = async (id: string): Promise<SavedAnalysis[]> => {
  const current = await listSavedAnalyses();
  const next = current.filter((item) => item.id !== id);
  await idbSetStrict(SAVED_ANALYSES_KEY, next);
  return listSavedAnalyses();
};

export const renameSavedAnalysis = async (id: string, name: string): Promise<SavedAnalysis[]> => {
  const safeName = name.trim();
  if (!safeName) throw new Error("Analysis name cannot be empty");
  const current = await listSavedAnalyses();
  const target = current.find((item) => item.id === id);
  if (!target) throw new Error("Saved analysis not found");
  const now = new Date().toISOString();
  return persistSavedAnalysis({
    ...target,
    name: safeName,
    config: {
      ...target.config,
      updatedAt: now,
      savedAt: now,
    },
  });
};

export const duplicateSavedAnalysis = async (
  id: string,
  createId: () => string,
): Promise<{ list: SavedAnalysis[]; duplicate: SavedAnalysis }> => {
  const current = await listSavedAnalyses();
  const source = current.find((item) => item.id === id);
  if (!source) throw new Error("Saved analysis not found");
  const now = new Date().toISOString();
  const duplicate: SavedAnalysis = {
    ...source,
    id: createId(),
    name: `${source.name} — copie`,
    config: {
      ...source.config,
      version: 3,
      createdAt: now,
      updatedAt: now,
      savedAt: now,
      drawings: source.config.drawings?.map((drawing) => ({ ...drawing })),
    },
  };
  const list = await persistSavedAnalysis(duplicate);
  return { list, duplicate };
};
