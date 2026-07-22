import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scopeBootstrapCss, computeSha256 } from "./lib/scope-bootstrap-css.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BOOTSTRAP_SRC = path.resolve(ROOT, "node_modules/bootstrap/dist/css/bootstrap.min.css");
const OUT_DIR = path.resolve(ROOT, "styles/generated");
const OUT_FILE = path.resolve(OUT_DIR, "technical-analysis-bootstrap.generated.css");

// Read bootstrap version
const bootstrapPkg = JSON.parse(
  fs.readFileSync(path.resolve(ROOT, "node_modules/bootstrap/package.json"), "utf-8"),
);
const bootstrapVersion = bootstrapPkg.version;

// Read source
const sourceCss = fs.readFileSync(BOOTSTRAP_SRC, "utf-8");
const sourceHash = computeSha256(sourceCss);

// Transform
const resultCss = scopeBootstrapCss(sourceCss);
const resultHash = computeSha256(resultCss);

// Banner — no date to keep determinism
const banner = [
  "/* GENERATED FILE — DO NOT EDIT */",
  `/* Bootstrap v${bootstrapVersion} — ${BOOTSTRAP_SRC} */`,
  `/* Source SHA-256: ${sourceHash} */`,
  `/* Scope: :where(.technical-analysis-bootstrap-scope) */`,
  `/* Generator: scripts/lib/scope-bootstrap-css.mjs */`,
  "",
].join("\n");

// Ensure output dir
fs.mkdirSync(OUT_DIR, { recursive: true });

// Write
fs.writeFileSync(OUT_FILE, banner + resultCss, "utf-8");

const stats = {
  sourceBytes: sourceCss.length,
  outputBytes: (banner + resultCss).length,
  sourceHash,
  resultHash,
};

console.log(`✓ Generated: ${OUT_FILE}`);
console.log(`  Bootstrap v${bootstrapVersion}`);
console.log(`  Source: ${(stats.sourceBytes / 1024).toFixed(1)} KB  (SHA-256: ${stats.sourceHash.slice(0, 16)}...)`);
console.log(`  Output: ${(stats.outputBytes / 1024).toFixed(1)} KB  (SHA-256: ${stats.resultHash.slice(0, 16)}...)`);
