/* eslint-env node */
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const sharp = require("sharp");
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

const { getMarketLogoUrl } = require("../market-logo-registry.ts");
const logoAliases = require("../../../public/logo-aliases.json");

const readJson = (relativePath) => JSON.parse(
  fs.readFileSync(path.join(projectRoot, relativePath), "utf8"),
);

const hashFile = (filePath) => createHash("sha256")
  .update(fs.readFileSync(filePath))
  .digest("hex");

const manifestFiles = (relativePath) => (
  readJson(relativePath).records ?? []
).map((record) => record.file).filter(Boolean);

test("CSE Casablanca source and normalization manifests cover all 74 API securities", async () => {
  const sourceManifest = readJson("public/logos-cse-casablanca/source-manifest.json");
  const normalizationManifest = readJson("public/logos-cse-casablanca/normalization-manifest.json");

  assert.equal(sourceManifest.exchange, "CSE");
  assert.equal(sourceManifest.records.length, 74);
  assert.equal(normalizationManifest.exchange, "CSE");
  assert.equal(normalizationManifest.records.length, 74);

  const sourceTickers = new Set(sourceManifest.records.map((record) => record.ticker));
  const normalizedTickers = new Set(normalizationManifest.records.map((record) => record.ticker));
  assert.equal(sourceTickers.size, 74, "CSE source manifest tickers must be unique");
  assert.deepEqual(normalizedTickers, sourceTickers);

  for (const record of normalizationManifest.records) {
    const absoluteFile = path.join(projectRoot, record.file);
    assert.equal(fs.existsSync(absoluteFile), true, `${record.file} must exist`);
    assert.equal(hashFile(absoluteFile), record.sha256, `${record.ticker} SHA-256 drift`);

    const metadata = await sharp(absoluteFile).metadata();
    assert.equal(metadata.format, "webp", `${record.ticker} must be WebP`);
    assert.equal(metadata.width, 256, `${record.ticker} width must be 256`);
    assert.equal(metadata.height, 256, `${record.ticker} height must be 256`);

    const expectedUrl = `/${record.file.replace(/^public\//, "").replaceAll("\\", "/")}`;
    assert.equal(
      getMarketLogoUrl("CSE", record.ticker),
      expectedUrl,
      `${record.ticker} must resolve to its canonical CSE logo`,
    );
  }
});

test("GSE, JSE, NGX and NSE normalization manifests reference real assets", () => {
  const markets = [
    ["GSE", "public/logos-gse/normalization-manifest.json"],
    ["JSE", "public/logos-jse/normalization-manifest.json"],
    ["NGX", "public/logos-ngx/normalization-manifest.json"],
    ["NSE", "public/logos-nse/normalization-manifest.json"],
  ];

  for (const [market, manifestPath] of markets) {
    const files = manifestFiles(manifestPath);
    assert.ok(files.length > 0, `${market} normalization manifest must not be empty`);

    for (const file of files) {
      assert.equal(fs.existsSync(path.join(projectRoot, file)), true, `${file} must exist`);
    }
  }
});

test("declared multi-market aliases never resolve to missing assets", () => {
  for (const [market, aliases] of Object.entries(logoAliases.aliases ?? {})) {
    if (market === "BRVM") continue;

    for (const [alias] of Object.entries(aliases)) {
      const url = getMarketLogoUrl(market, alias);
      assert.ok(url, `${market}:${alias} alias must resolve to a logo URL`);
      assert.equal(
        fs.existsSync(path.join(projectRoot, "public", url.replace(/^\//, ""))),
        true,
        `${market}:${alias} alias target must exist on disk`,
      );
    }
  }
});
