const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sourcePath = path.join(__dirname, 'TechnicalAnalysisSidebarContent.tsx');
const source = fs.readFileSync(sourcePath, 'utf8');

const deferredPanels = [
  'BondsPanel',
  'DividendsPanel',
  'FundamentalsPanel',
  'IncomeStatementPanel',
  'ModelHeuristicPanel',
  'PerformancePanel',
  'ProfilePanel',
  'SeasonalityPanel',
  'SidebarNewsPanel',
  'SidebarStatsPanel',
  'TechnicalsPanel',
  'VolatilityPanels',
];

test('startup critical path keeps WatchlistPanel statically imported', () => {
  assert.match(
    source,
    /import\s+\{\s*WatchlistPanel\s*\}\s+from\s+["']\.\/panels\/WatchlistPanel["'];/,
  );
});

test('secondary watchlist panels are code-split with next/dynamic', () => {
  for (const panel of deferredPanels) {
    assert.doesNotMatch(
      source,
      new RegExp(`import\\s+\\{\\s*${panel}\\s*\\}\\s+from\\s+["']\\.\\/panels\\/${panel}["']`),
      `${panel} must not stay in the critical static import graph`,
    );
    assert.match(
      source,
      new RegExp(`const\\s+${panel}\\s*=\\s*dynamic\\(`),
      `${panel} must be loaded through next/dynamic`,
    );
  }
});

test('default watchlist keeps code-split secondary panels mounted so their existing loading skeletons remain visible', () => {
  assert.match(
    source,
    /activeEntry\s*===\s*["']watchlist["'][\s\S]{0,1200}\{watchlistPanel\}[\s\S]{0,1200}\{newsPanel\}\{statsPanel\}\{fundamentalsPanel\}/,
  );
  assert.doesNotMatch(
    source,
    /activeEntry\s*===\s*["']watchlist["'][\s\S]{0,1200}isSecondaryWorkReady\s*\?/,
  );
});
