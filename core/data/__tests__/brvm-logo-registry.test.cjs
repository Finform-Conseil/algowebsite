/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const projectRoot = path.resolve(__dirname, "../../..");

const resolveProjectModule = (request) => {
  const basePath = request.startsWith("@/")
    ? path.join(projectRoot, request.slice(2))
    : request;

  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    `${basePath}.json`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
    path.join(basePath, "index.js"),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
};

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    const resolved = resolveProjectModule(request);
    if (resolved) return resolved;
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

const transpileTypeScript = (filename) => {
  const source = fs.readFileSync(filename, "utf8");
  return ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      resolveJsonModule: true,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  }).outputText;
};

require.extensions[".ts"] = function loadTypeScript(module, filename) {
  module._compile(transpileTypeScript(filename), filename);
};

const mappingPath = path.join(projectRoot, "public/logos-brvm/mapping.json");
const logosDir = path.dirname(mappingPath);
const mapping = JSON.parse(fs.readFileSync(mappingPath, "utf8"));
const mappingTickers = Object.keys(mapping).sort();

const {
  BRVM_LOGO_TICKERS,
  getBrvmLogoIssuerName,
  getBrvmLogoUrl,
  hasBrvmLogo,
} = require("../brvm-logo-registry.ts");
const { BRVM_SECURITIES } = require("../brvm-securities.ts");

const isMarketIndex = (security) => security.sector === "Market Indices";
const isDelisted = (security) => security.status === "delisted";
const isListedEquity = (security) => !isMarketIndex(security) && !isDelisted(security);

test("logos-brvm mapping and PNG assets stay in one-to-one sync", () => {
  const pngTickers = fs.readdirSync(logosDir)
    .filter((fileName) => fileName.endsWith(".png"))
    .map((fileName) => path.basename(fileName, ".png"))
    .sort();

  assert.deepEqual(pngTickers, mappingTickers);
  assert.deepEqual(BRVM_LOGO_TICKERS.map((ticker) => ticker.toLowerCase()).sort(), mappingTickers);

  mappingTickers.forEach((ticker) => {
    const assetPath = path.join(logosDir, `${ticker}.png`);
    assert.equal(fs.existsSync(assetPath), true, `${ticker}.png must exist`);
    assert.equal(getBrvmLogoUrl(ticker.toUpperCase()), `/logos-brvm/${ticker}.png`);
    assert.equal(hasBrvmLogo(ticker.toUpperCase()), true);
    assert.equal(getBrvmLogoIssuerName(ticker.toUpperCase()), mapping[ticker]);
  });
});

test("listed BRVM securities use only canonical logos-brvm URLs", () => {
  const listedSecurities = BRVM_SECURITIES.filter(isListedEquity);
  const listedTickers = listedSecurities.map((security) => security.ticker.toLowerCase()).sort();

  assert.deepEqual(listedTickers, mappingTickers);

  listedSecurities.forEach((security) => {
    const expectedLogoUrl = `/logos-brvm/${security.ticker.toLowerCase()}.png`;
    assert.equal(security.logoUrl, expectedLogoUrl, `${security.ticker} must use the real local logo asset`);
  });
});

test("indices and delisted securities without real assets do not receive invented logos", () => {
  const securitiesWithoutMappedLogo = BRVM_SECURITIES.filter((security) => !hasBrvmLogo(security.ticker));

  assert.deepEqual(
    securitiesWithoutMappedLogo.map((security) => security.ticker).sort(),
    ["BRVM30", "BRVMAG", "BRVMC", "BRVMPR", "BRVMSP", "SVOC"],
  );

  securitiesWithoutMappedLogo.forEach((security) => {
    assert.equal(security.logoUrl, undefined, `${security.ticker} must not receive a fake logo`);
  });
});

test("BRVM logo surfaces do not keep legacy logo paths or BOA fallback", () => {
  const filesToCheck = [
    "core/data/brvm-securities.ts",
    "components/technical-analysis/components/header/ChartHeader.tsx",
    "components/design-system/commons/CommonTickerPanel/CommonTickerPanel.tsx",
    "components/design-system/commons/TickerSelectorModal/TickerSelectorModal.tsx",
    "components/technical-analysis/components/modals/search-symbol/SearchSymbolModal.tsx",
    "components/technical-analysis/components/sidebar/TechnicalAnalysisSidebar.tsx",
    "components/technical-analysis/components/market/SecurityBadge.tsx",
  ];

  filesToCheck.forEach((relativePath) => {
    const content = fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
    assert.equal(content.includes("/img/logos"), false, `${relativePath} must not reference legacy public/img/logos assets`);
    assert.equal(content.includes("/svg/BOA-logo.svg"), false, `${relativePath} must not use BOA as a generic logo fallback`);
  });
});
