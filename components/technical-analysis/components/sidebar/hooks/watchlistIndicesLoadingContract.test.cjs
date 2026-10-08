const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = process.cwd();
const feeds = fs.readFileSync(
  path.join(root, "components/technical-analysis/components/sidebar/hooks/useSidebarDataFeeds.ts"),
  "utf8",
);
const adapter = fs.readFileSync(
  path.join(root, "components/technical-analysis/components/sidebar/data/sidebarDataPortAdapter.ts"),
  "utf8",
);

test("indices feed cannot leave the Watchlist skeleton pending forever", () => {
  assert.match(feeds, /const INDICES_REQUEST_TIMEOUT_MS = 8_000;/);
  assert.match(feeds, /Promise\.race\(\[liveRequest, timeoutRequest\]\)/);
  assert.match(feeds, /timedOut = true;[\s\S]*controller\.abort\(\);[\s\S]*Délai de chargement des indices dépassé/);
  assert.match(feeds, /if \(!controller\.signal\.aborted \|\| timedOut\) setIsIndicesLoading\(false\)/);
  assert.match(feeds, /setIndicesStatus\("error"\)/);
});

test("indices RTK adapter observes aborts between paginated requests", () => {
  const fetchIndicesBlock = adapter.match(/const fetchIndices = useCallback\([\s\S]*?\n  \);\n\n  const fetchNews/);
  assert.ok(fetchIndicesBlock, "fetchIndices callback must exist");
  const source = fetchIndicesBlock[0];
  const abortChecks = source.match(/throwIfAborted\(signal\)/g) || [];
  assert.ok(abortChecks.length >= 4, "fetchIndices should re-check abort around RTK awaits");
  assert.match(source, /await getAllIndices/);
  assert.match(source, /await getIndicesCoursByIndice/);
});
