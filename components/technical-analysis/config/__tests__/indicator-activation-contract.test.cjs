/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { projectRoot } = require("../../store/__tests__/testTypeScriptLoader.cjs");
const indicatorObjectVisibility = require("../object-tree/indicatorObjectVisibility.ts");
const indicatorRegistry = require("../indicators/indicatorRegistry.ts");
const indicatorModalRegistry = require("../indicators/indicatorModalRegistry.ts");
const indicatorResearchGradePolicy = require("../indicators/indicatorResearchGradePolicy.ts");
const { ADVANCED_CHILD_ITEM_GROUPS } = require("../../components/panels/object-tree/objectTreeAdvancedChildItems.ts");
const { ADVANCED_INDICATOR_LABELS } = require("../../components/panels/object-tree/objectTreeAdvancedLabels.ts");

const readProjectFile = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

const stateSource = readProjectFile("components/technical-analysis/config/indicators/advancedIndicatorsTypes.ts");
const modalSource = readProjectFile("components/technical-analysis/components/modals/indicators/IndicatorsModal.tsx");
const rendererSource = readProjectFile("components/technical-analysis/hooks/useEChartsRenderer.ts");
const workerSource = readProjectFile("components/technical-analysis/lib/workers/indicators.worker.ts");
const formulaSource = readProjectFile("components/technical-analysis/lib/Indicators/TechnicalIndicators.ts");

const parseAdvancedIndicatorStateKeys = () => {
  const match = stateSource.match(/export interface AdvancedIndicatorsState \{([\s\S]*?)\n\}/);
  assert.ok(match, "AdvancedIndicatorsState interface must be parseable");
  return [...match[1].matchAll(/^\s*([A-Za-z][A-Za-z0-9]*):\s*boolean;/gm)].map((entry) => entry[1]);
};

const stateKeys = parseAdvancedIndicatorStateKeys();
const stateKeySet = new Set(stateKeys);
const specialModalWiredIds = new Set(["rsi_9", "rsi_14", "rsi_25"]);
const rendererOnlyOrLegacyObjectIds = new Set([
  "bollinger-fill",
  "supertrend-line-up",
  "supertrend-line-down",
]);
const specialCatalogKeyPattern = /^(price_vs_(sma|ema)\d+_pct|(wma|dema|tema|hma|zlema|alma|smma|kama|vwma)_\d+)$/;

const collectModalWiredIds = () => indicatorModalRegistry.INDICATOR_MODAL_GROUPS.flatMap((group) =>
  group.sections.flatMap((section) => section.items.map((item) => item.wiredId).filter(Boolean)),
);
const collectRendererAdvancedRefs = () => [...rendererSource.matchAll(/advancedIndicators\.([A-Za-z][A-Za-z0-9]*)/g)].map((entry) => entry[1]);
const collectChildObjectRows = () => ADVANCED_CHILD_ITEM_GROUPS.flatMap((group) => group.items.map((item) => ({ group, item })));
const collectModalCatalogItems = () => indicatorModalRegistry.INDICATOR_MODAL_GROUPS.flatMap((group) =>
  group.sections.flatMap((section) => section.items),
);
const collectExportedFormulaNames = () => new Set(
  [...formulaSource.matchAll(/export const (calculate[A-Za-z0-9]*)\s*=/g)].map((entry) => entry[1]),
);

const assertUnique = (values, label) => {
  const seen = new Set();
  const duplicates = values.filter((value) => {
    if (seen.has(value)) return true;
    seen.add(value);
    return false;
  });
  assert.deepEqual([...new Set(duplicates)].sort(), [], label + " must not contain duplicates");
};

test("advanced indicator registry is the complete state-level source of truth", () => {
  const registryKeys = Object.keys(indicatorRegistry.ADVANCED_INDICATOR_REGISTRY).sort();
  assert.deepEqual(registryKeys, [...stateKeys].sort());

  indicatorRegistry.ADVANCED_INDICATOR_REGISTRY_ENTRIES.forEach((entry) => {
    assert.equal(entry.id, entry.stateId);
    assert.ok(stateKeySet.has(entry.stateId), entry.stateId + " must be an AdvancedIndicatorsState key");
    assert.equal(typeof entry.label, "string");
    assert.ok(entry.label.length > 0, entry.id + " must have a label");
    assert.equal(typeof entry.key, "string");
    assert.ok(entry.key.length > 0, entry.id + " must have a primary catalog key");
    assert.ok(entry.catalogKeys.includes(entry.key), entry.id + " primary key must be present in catalogKeys");
    assert.ok(entry.formula.functions.length > 0, entry.id + " must declare at least one formula function");
    assert.ok(entry.renderer.objectTreeIds.includes(entry.stateId), entry.id + " object tree IDs must include its state ID");
  });
});

test("registry formula contracts point to exported TechnicalIndicators calculators", () => {
  const exportedFormulas = collectExportedFormulaNames();
  const missingFormulas = indicatorRegistry.ADVANCED_INDICATOR_REGISTRY_ENTRIES.flatMap((entry) =>
    entry.formula.functions
      .filter((formulaName) => !exportedFormulas.has(formulaName))
      .map((formulaName) => entry.id + ":" + formulaName),
  );

  assert.deepEqual(missingFormulas.sort(), []);
});

test("object tree labels, child rows and visibility IDs are derived from the registry", () => {
  const registryLabelShape = Object.fromEntries(
    indicatorRegistry.ADVANCED_INDICATOR_REGISTRY_ENTRIES.map((entry) => [entry.id, {
      label: entry.label,
      kind: entry.kind,
      color: entry.color,
    }]),
  );
  const registryChildGroups = indicatorRegistry.getAdvancedIndicatorChildGroupsFromRegistry();

  assert.deepEqual(ADVANCED_INDICATOR_LABELS, registryLabelShape);
  assert.deepEqual(ADVANCED_CHILD_ITEM_GROUPS, registryChildGroups);

  stateKeys.forEach((indicatorId) => {
    assert.deepEqual(
      indicatorObjectVisibility.getAdvancedIndicatorObjectIds(indicatorId),
      indicatorRegistry.ADVANCED_INDICATOR_REGISTRY[indicatorId].objectTreeIds,
    );
  });
});

test("indicator modal wired IDs resolve to state keys or documented RSI period routes", () => {
  const unknownWiredIds = [...new Set(collectModalWiredIds())]
    .filter((id) => !stateKeySet.has(id) && !specialModalWiredIds.has(id))
    .sort();

  assert.deepEqual(unknownWiredIds, []);
});

test("modal catalog is exported from the registry layer, not embedded in IndicatorsModal", () => {
  assert.ok(modalSource.includes("INDICATOR_MODAL_GROUPS"));
  assert.ok(!modalSource.includes("useMemo<BackendIndicatorGroup[]>"));
  assert.ok(!modalSource.includes("title: \"Oscillateurs\""));

  assert.equal(collectModalCatalogItems().length, 206);
  assert.equal(indicatorModalRegistry.INDICATOR_MODAL_CATALOG_KEYS.length, 206);
});

test("modal catalog keys are either registry-backed or documented special systems", () => {
  const registryCatalogKeys = new Set(
    indicatorRegistry.ADVANCED_INDICATOR_REGISTRY_ENTRIES.flatMap((entry) => entry.catalogKeys),
  );
  const uncoveredCatalogKeys = collectModalCatalogItems()
    .map((item) => item.key)
    .filter((key) => !registryCatalogKeys.has(key) && !specialCatalogKeyPattern.test(key))
    .sort();

  assert.deepEqual([...new Set(uncoveredCatalogKeys)], []);
});

test("modal wiring is derived from registry catalog keys", () => {
  const invalidWiring = collectModalCatalogItems()
    .filter((item) => item.wiredId)
    .filter((item) => item.wiredId !== indicatorModalRegistry.resolveIndicatorCatalogWiredId(item.key))
    .map((item) => item.key + ":" + item.wiredId);

  assert.deepEqual(invalidWiring.sort(), []);
  assert.equal(indicatorModalRegistry.resolveIndicatorCatalogWiredId("cci_20"), "cci20");
  assert.equal(indicatorModalRegistry.resolveIndicatorCatalogWiredId("roc_10"), "roc10");
  assert.equal(indicatorModalRegistry.resolveIndicatorCatalogWiredId("williams_r_14"), "williamsR14");
});

test("composite modal specs derive output keys and wiring from the registry", () => {
  const mismatches = indicatorModalRegistry.COMPOSITE_INDICATOR_SPECS
    .filter((spec) => stateKeySet.has(spec.wiredId))
    .filter((spec) => {
      const registryEntry = indicatorRegistry.ADVANCED_INDICATOR_REGISTRY[spec.wiredId];
      return JSON.stringify(spec.outputKeys) !== JSON.stringify(registryEntry.catalogKeys);
    })
    .map((spec) => spec.id);

  assert.deepEqual(mismatches, []);
});

test("bottom-panel limit UX is explicit when an oscillator cannot be added", () => {
  assert.ok(modalSource.includes("Impossible d'ajouter"));
  assert.ok(modalSource.includes("panneaux bas actifs"));
  assert.ok(modalSource.includes("activeBottomIndicatorCount"));
  assert.ok(modalSource.includes("getActiveBottomPanelLabels"));
});

test("advanced indicator state keys have object tree labels and renderer references", () => {
  const labelKeys = new Set(Object.keys(ADVANCED_INDICATOR_LABELS));
  const rendererRefs = new Set(collectRendererAdvancedRefs());

  assert.deepEqual(stateKeys.filter((key) => !labelKeys.has(key)), []);
  assert.deepEqual(stateKeys.filter((key) => !rendererRefs.has(key)), []);
});

test("advanced child object rows resolve back to their parent indicator", () => {
  const childRows = collectChildObjectRows();
  assertUnique(childRows.map(({ item }) => item.id), "advanced child object ids");

  childRows.forEach(({ group, item }) => {
    assert.ok(stateKeySet.has(group.indicator), group.indicator + " must be an AdvancedIndicatorsState key");
    assert.ok(
      indicatorObjectVisibility.getAdvancedIndicatorObjectIds(group.indicator).includes(item.id),
      item.id + " must be revealed when " + group.indicator + " is activated",
    );
    assert.equal(
      indicatorObjectVisibility.getAdvancedIndicatorIdForObjectId(item.id),
      group.indicator,
      item.id + " must remove/toggle through " + group.indicator,
    );
  });
});

test("visibility registry does not expose orphan object IDs", () => {
  const childIds = new Set(collectChildObjectRows().map(({ item }) => item.id));
  const orphanIds = [];

  stateKeys.forEach((indicatorId) => {
    indicatorObjectVisibility.getAdvancedIndicatorObjectIds(indicatorId).forEach((objectId) => {
      if (objectId === indicatorId) return;
      if (stateKeySet.has(objectId)) return;
      if (childIds.has(objectId)) return;
      if (rendererOnlyOrLegacyObjectIds.has(objectId)) return;
      orphanIds.push(indicatorId + ":" + objectId);
    });
  });

  assert.deepEqual(orphanIds.sort(), []);
});

test("critical composite children are literal renderer visibility gates", () => {
  const criticalRendererGates = [
    "macd-line",
    "macd-signal",
    "macd-hist",
    "boll-upper",
    "boll-mid",
    "boll-lower",
    "boll-fill",
    "stoch-k",
    "stoch-d",
    "stochrsi-k",
    "stochrsi-d",
    "ichimoku-tenkan",
    "ichimoku-kijun",
    "ichimoku-chikou",
    "ichimoku-senkouA",
    "ichimoku-senkouB",
    "ichimoku-cloud",
    "donchian-fill",
    "keltner-fill",
  ];

  const missingRendererGates = criticalRendererGates.filter((id) => !rendererSource.includes("isObjectVisible(\"" + id + "\")"));
  assert.deepEqual(missingRendererGates, []);
  assert.ok(rendererSource.includes("hasVisibleMacdPanel ? \"MACD\" : null"));
  assert.ok(rendererSource.includes("hasVisibleStochasticPanel ? \"Stoch\" : null"));
  assert.ok(rendererSource.includes("hasVisibleStochRsiPanel ? \"StochRSI\" : null"));
  assert.ok(rendererSource.includes("if (hasVisibleIchimokuOverlay)"));
  assert.ok(rendererSource.includes("if (hasVisibleBollingerOverlay)"));
});

test("worker covers registry formula contracts including structured volume profile", () => {
  const workerFormulas = new Set([...workerSource.matchAll(/(calculate[A-Za-z0-9]+)\(/g)].map((entry) => entry[1]));
  const missingWorkerFormulas = indicatorRegistry.ADVANCED_INDICATOR_REGISTRY_ENTRIES.flatMap((entry) =>
    entry.formula.functions.filter((formulaName) => !workerFormulas.has(formulaName)).map((formulaName) => entry.id + ":" + formulaName),
  );

  assert.deepEqual([...new Set(missingWorkerFormulas)].sort(), []);
  assert.ok(workerSource.includes("structuredResults.volumeProfile"));
  assert.ok(rendererSource.includes("structuredResults.volumeProfile"));
  assert.ok(!rendererSource.includes("calculateVolumeProfile(chartData"));
});

test("research-grade policy covers the full 224-indicator modal surface", () => {
  const inventory = indicatorResearchGradePolicy.buildIndicatorResearchGradeInventory({
    indicatorPeriods: { sma1: 5, sma2: 10, sma3: 20, rsiPeriod: 14 },
  });
  const inventoryIds = inventory.map((entry) => entry.id);
  const requiredDimensions = indicatorResearchGradePolicy.RESEARCH_GRADE_BENCHMARK_DIMENSIONS;

  assert.equal(inventory.length, 224);
  assertUnique(inventoryIds, "research-grade inventory ids");
  assert.deepEqual(
    inventory
      .filter((entry) => !entry.policy || !entry.policy.family || !entry.policy.marketFit)
      .map((entry) => entry.id),
    [],
  );

  inventory.forEach((entry) => {
    assert.deepEqual(Object.keys(entry.policy.benchmark).sort(), [...requiredDimensions].sort());
    requiredDimensions.forEach((dimension) => {
      const benchmark = entry.policy.benchmark[dimension];
      assert.equal(typeof benchmark.localCurrent, "string", entry.id + ":" + dimension + " local current");
      assert.equal(typeof benchmark.professionalTarget, "string", entry.id + ":" + dimension + " professional target");
      assert.equal(typeof benchmark.requiredChange, "string", entry.id + ":" + dimension + " required change");
      assert.ok(benchmark.localCurrent.length > 0, entry.id + ":" + dimension + " local current");
      assert.ok(benchmark.professionalTarget.length > 0, entry.id + ":" + dimension + " professional target");
      assert.ok(benchmark.requiredChange.length > 0, entry.id + ":" + dimension + " required change");
    });
  });
});

test("research-grade policy encodes BRVM liquidity, confirmation and alertability gates", () => {
  const inventory = indicatorResearchGradePolicy.buildIndicatorResearchGradeInventory({
    indicatorPeriods: { sma1: 5, sma2: 10, sma3: 20, rsiPeriod: 14 },
  });
  const byId = new Map(inventory.map((entry) => [entry.id, entry]));
  const volumeSensitiveIds = ["advanced:volumeProfile", "catalog:vwma_20", "advanced:mfi14", "advanced:cmf20"];
  const candlestickIds = inventory.filter((entry) => entry.policy.family === "candlestick-pattern").map((entry) => entry.id);

  volumeSensitiveIds.forEach((id) => {
    assert.equal(byId.get(id).policy.requiresLiquidityContext, true, id + " must be liquidity gated");
  });

  assert.equal(byId.get("advanced:rsi").policy.confirmationRequired, true);
  assert.equal(byId.get("advanced:macd").policy.alertability, "explicit-condition");
  assert.equal(byId.get("trend:is_above_sma200").policy.alertability, "explicit-condition");
  assert.equal(byId.get("catalog:price_vs_sma200_pct").policy.marketFit, "brvm-sensitive");
  assert.ok(candlestickIds.length >= 50);
  candlestickIds.forEach((id) => {
    const policy = byId.get(id).policy;
    assert.equal(policy.confirmationRequired, true, id + " must require confirmation");
    assert.equal(policy.visualDensity, "sparse-capped", id + " must cap visual density");
    assert.equal(policy.collisionPolicy, "hide-or-shift-with-bounds", id + " must have collision policy");
  });
});

