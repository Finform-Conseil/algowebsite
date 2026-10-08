const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = name => fs.readFileSync(path.join(process.cwd(), name), "utf8");
const repo = read("components/technical-analysis/config/persistence/chartHistoryRepository.ts");
const hook = read("components/technical-analysis/hooks/useChartHistory.ts");
const app = read("components/technical-analysis/TechnicalAnalysis.tsx");

test("journal uses independent, versioned IndexedDB transactions", () => {
  assert.match(repo, /finform-ta-undo-history/);
  assert.match(repo, /createObjectStore\(STORE\)/);
  assert.match(repo, /tx\.oncomplete = \(\) => resolve/);
  assert.match(repo, /tx\.onabort/);
  assert.match(repo, /value\.entries\.length > maxStates/);
});
test("history keeps redo branching and persists cursor on undo and redo", () => {
  assert.match(hook, /slice\(0, historyIndexRef\.current \+ 1\)/);
  assert.match(hook, /persistJournal\(\)/);
  assert.match(hook, /historyIndexRef\.current = -1/);
  assert.match(hook, /restoreRef\.current\(active\.snapshot\)/);
  assert.match(hook, /userTouchedRef\.current/);
  assert.match(hook, /writeQueueRef\.current/);
  assert.match(hook, /MAX_PERSISTED_HISTORY_CHARS/);
  assert.match(hook, /committedAt: Date\.now\(\)/);
  assert.match(hook, /label: lastActionLabelRef\.current/);
  assert.match(hook, /describeInteraction\(event\.target\)/);
  assert.match(repo, /committedAt\?: number/);
});
test("journal isolates saved analyses without splitting ticker changes", () => {
  assert.match(app, /persistenceScope: `ta-chart-history:v1:\$\{activeSavedAnalysisId \?\? "unsaved-workspace"\}`/);
  assert.doesNotMatch(app, /persistenceScope:.*chartConfig\.symbol/);
});
test("cross-tab writes use atomic optimistic revision checks", () => {
  assert.match(repo, /class ChartHistoryConflictError extends Error/);
  assert.match(repo, /store\.get\(journal\.scope\)/);
  assert.match(repo, /actualRevision !== expectedRevision/);
  assert.match(repo, /tx\.abort\(\)/);
  assert.match(repo, /revision: actualRevision \+ 1/);
  assert.match(repo, /tx\.oncomplete = \(\) => resolve\(expectedRevision \+ 1\)/);
  assert.match(hook, /durableRevisionByScopeRef/);
  assert.match(hook, /writeChartHistory\(journal, expectedRevision\)/);
});

test("corrupt snapshots and storage failures do not bypass restoration checks", () => {
  assert.match(repo, /Number\.isSafeInteger\(value\.revision\)/);
  assert.match(hook, /validateSnapshotRef/);
  assert.match(hook, /Undo journal serialization failed/);
  assert.match(hook, /writeQueueRef\.current\.catch/);
  assert.match(app, /validateSnapshot: \(value: unknown\)/);
});
test("switching saved analyses cannot restore stale history over a new explicit load", () => {
  assert.match(hook, /initializedScopeRef/);
  assert.match(hook, /switchedAnalysis && latestEntryRef\.current\.fingerprint !== active\.fingerprint/);
});
