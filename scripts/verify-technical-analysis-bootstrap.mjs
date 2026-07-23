import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import p from "postcss-selector-parser";
import { computeSha256 } from "./lib/scope-bootstrap-css.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GENERATED_FILE = path.resolve(ROOT, "styles/generated/technical-analysis-bootstrap.generated.css");

const SCOPE_CLASS = "technical-analysis-bootstrap-scope";

const REQUIRED_BOOTSTRAP_CLASSES = [
  "btn", "btn-sm", "rounded-pill", "d-flex", "d-inline-flex",
  "align-items-center", "justify-content-center", "justify-content-end",
  "flex-nowrap", "flex-shrink-0", "gap-1", "gap-2", "h-100",
  "position-relative", "border-0", "bg-transparent", "opacity-50",
  "spinner-border", "spinner-border-sm", "me-2", "table",
  "form-control", "dropdown-menu", "modal", "tooltip",
];

function isKeyframeStep(selector) {
  const s = selector.trim();
  return /^\d+%$/.test(s) || s === "from" || s === "to";
}

function walkNodes(nodes, fn) {
  for (const node of nodes) {
    fn(node);
    if (node.nodes) {
      walkNodes(node.nodes, fn);
    }
  }
}

function isInsideWhere(node) {
  let current = node.parent;
  while (current) {
    if (current.type === "pseudo" && current.value === ":where") {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function hasScopeInWhere(selector) {
  let found = false;
  walkNodes(selector.nodes, (node) => {
    if (
      node.type === "pseudo" &&
      node.value === ":where" &&
      node.nodes
    ) {
      for (const inner of node.nodes) {
        if (inner.type === "selector") {
          for (const innerNode of inner.nodes) {
            if (innerNode.type === "class" && innerNode.value === SCOPE_CLASS) {
              found = true;
            }
          }
        }
      }
    }
  });
  return found;
}

function hasBareScopeClass(selector) {
  let found = false;
  walkNodes(selector.nodes, (node) => {
    if (node.type === "class" && node.value === SCOPE_CLASS) {
      if (!isInsideWhere(node)) {
        found = true;
      }
    }
  });
  return found;
}

function firstNonCombinator(selector) {
  for (const node of selector.nodes) {
    if (node.type !== "combinator") return node;
  }
  return null;
}

function isGlobalRoot(selector) {
  const first = firstNonCombinator(selector);
  return first && first.type === "pseudo" && first.value === ":root" && !hasScopeInWhere(selector);
}

function isGlobalTag(selector, tagName) {
  const first = firstNonCombinator(selector);
  return first && first.type === "tag" && first.value === tagName && !hasScopeInWhere(selector);
}

function countScopeOccurrences(selector) {
  let count = 0;
  walkNodes(selector.nodes, (node) => {
    if (node.type === "class" && node.value === SCOPE_CLASS && isInsideWhere(node)) {
      count++;
    }
  });
  return count;
}

export function verifyScopeCss(css) {
  const result = {
    hash: computeSha256(css),
    totalRules: 0,
    totalSelectors: 0,
    okCount: 0,
    rejectCount: 0,
    rejected: [],
    keyframes: [],
    missingClasses: [],
  };

  const root = postcss.parse(css);

  root.walk((node) => {
    if (node.type === "rule") {
      result.totalRules++;
      for (const sel of node.selectors) {
        result.totalSelectors++;
        const trimmed = sel.trim();

        if (isKeyframeStep(trimmed)) {
          result.okCount++;
          continue;
        }

        let rejectedReason = null;

        try {
          p((selectors) => {
            for (const branch of selectors.nodes) {
              if (isKeyframeStep(trimmed)) {
                continue;
              }

              if (isGlobalRoot(branch)) {
                rejectedReason = `GLOBAL_ROOT: ${trimmed}`;
                return;
              }

              if (isGlobalTag(branch, "html") || isGlobalTag(branch, "body")) {
                rejectedReason = `UNSAFE_TAG: ${trimmed}`;
                return;
              }

              if (hasBareScopeClass(branch)) {
                rejectedReason = `DIRECT_SCOPE: ${trimmed}`;
                return;
              }

              if (!hasScopeInWhere(branch)) {
                rejectedReason = `MISSING_SCOPE: ${trimmed}`;
                return;
              }

              if (countScopeOccurrences(branch) > 1) {
                rejectedReason = `DOUBLE_SCOPE: ${trimmed}`;
                return;
              }
            }
          }).processSync(trimmed);
        } catch {
          rejectedReason = `PARSE_ERROR: ${trimmed}`;
        }

        if (rejectedReason) {
          result.rejectCount++;
          result.rejected.push(rejectedReason);
        } else {
          result.okCount++;
        }
      }
    }

    if (node.type === "atrule" && (node.name === "keyframes" || node.name === "-webkit-keyframes")) {
      result.keyframes.push(node.params);
    }
  });

  const cssText = css;
  for (const cls of REQUIRED_BOOTSTRAP_CLASSES) {
    const scopedPattern = `:where(.${SCOPE_CLASS}) .${cls}`;
    if (!cssText.includes(scopedPattern)) {
      result.missingClasses.push(cls);
    }
  }

  return result;
}

function verify() {
  if (!fs.existsSync(GENERATED_FILE)) {
    console.error(`✗ Fichier généré introuvable: ${GENERATED_FILE}`);
    process.exit(1);
  }

  const css = fs.readFileSync(GENERATED_FILE, "utf-8");
  const result = verifyScopeCss(css);

  console.log(`=== Vérification Bootstrap Scopé ===`);
  console.log(`SHA-256: ${result.hash}`);
  console.log(`Règles totales: ${result.totalRules}`);
  console.log(`Sélecteurs totaux: ${result.totalSelectors}`);
  console.log(`Conformes: ${result.okCount}`);
  console.log(`Rejetés: ${result.rejectCount}`);

  if (result.rejected.length > 0) {
    console.log(`\n--- Sélecteurs rejetés (${result.rejected.length}) ---`);
    for (const r of result.rejected) {
      console.log(`  ${r}`);
    }
  }

  if (result.keyframes.length > 0) {
    console.log(`\n--- Keyframes détectés (${result.keyframes.length}) ---`);
    for (const kf of result.keyframes) {
      console.log(`  @keyframes ${kf}`);
    }
  }

  if (result.missingClasses.length > 0) {
    console.log(`\n--- Classes Bootstrap manquantes (${result.missingClasses.length}) ---`);
    for (const cls of result.missingClasses) {
      console.log(`  ${cls}`);
    }
  }

  const hasErrors = result.rejectCount > 0 || result.missingClasses.length > 0;

  if (hasErrors) {
    console.log(`\n✗ ÉCHEC — ${result.rejectCount} sélecteurs rejetés, ${result.missingClasses.length} classes manquantes`);
    process.exit(1);
  }

  console.log(`\n✓ VÉRIFICATION PASSÉE — Tous les ${result.totalSelectors} sélecteurs sont conformes`);
  console.log(`  ${REQUIRED_BOOTSTRAP_CLASSES.length} classes Bootstrap obligatoires présentes`);
}

verify();
