import postcss from "postcss";
import p from "postcss-selector-parser";
import crypto from "node:crypto";

const SCOPE_CLASS = "technical-analysis-bootstrap-scope";
const SCOPE_WHERE = `:where(.${SCOPE_CLASS})`;

export { SCOPE_CLASS, SCOPE_WHERE };

function firstNonCombinatorIndex(nodes) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].type !== "combinator") return i;
  }
  return -1;
}

function firstCombinatorIndex(nodes, start = 0) {
  for (let i = start; i < nodes.length; i++) {
    if (nodes[i].type === "combinator") return i;
  }
  return -1;
}

function cloneWithCleanFirstNode(selector) {
  const sel = p.selector();
  for (let j = 0; j < selector.nodes.length; j++) {
    const n = selector.nodes[j];
    if (typeof n.clone === "function") {
      const cloned = n.clone();
      if (j === 0 && cloned.spaces) {
        cloned.spaces.before = "";
      }
      sel.nodes.push(cloned);
    } else {
      sel.nodes.push(n);
    }
  }
  return sel;
}

function buildScopeSelector() {
  const sel = p.selector();
  const pseudo = p.pseudo({ value: ":where" });
  const cls = p.className({ value: SCOPE_CLASS });
  pseudo.nodes.push(cls);
  sel.nodes.push(pseudo);
  return sel;
}

function prefixedSelector(originalSel) {
  const newSel = buildScopeSelector();
  if (originalSel.nodes.length > 0) {
    const space = p.combinator({ value: " " });
    newSel.nodes.push(space);
    const rest = cloneWithCleanFirstNode(originalSel);
    for (const n of rest.nodes) newSel.nodes.push(n);
  }
  return newSel;
}

function transformBodyHtmlSelector(sel) {
  const tagNode = sel.nodes[0];
  const tagName = tagNode.value;
  const firstNodeIdx = 0;

  if (sel.nodes.length === 1) {
    return buildScopeSelector();
  }

  const combIdx = firstCombinatorIndex(sel.nodes, firstNodeIdx + 1);

  if (combIdx === -1) {
    const conditionPart = [];
    for (let i = firstNodeIdx; i < sel.nodes.length; i++) {
      conditionPart.push(sel.nodes[i]);
    }
    const result = p.selector();
    const cloned = cloneWithCleanFirstNode({
      get nodes() { return conditionPart; },
      [Symbol.iterator]() { return conditionPart[Symbol.iterator](); },
    });
    for (const n of cloned.nodes) result.nodes.push(n);
    const space = p.combinator({ value: " " });
    result.nodes.push(space);
    const scopeSel = buildScopeSelector();
    for (const n of scopeSel.nodes) result.nodes.push(n);
    return result;
  }

  const hasConditions = sel.nodes.slice(firstNodeIdx + 1, combIdx).some(
    (n) => n.type !== "combinator",
  );

  if (hasConditions) {
    const conditionPart = sel.nodes.slice(firstNodeIdx, combIdx);
    const descendantPart = sel.nodes.slice(combIdx + 1);
    const result = p.selector();
    const clonedConditions = cloneWithCleanFirstNode({
      get nodes() { return conditionPart; },
      [Symbol.iterator]() { return conditionPart[Symbol.iterator](); },
    });
    for (const n of clonedConditions.nodes) result.nodes.push(n);
    const space1 = p.combinator({ value: " " });
    result.nodes.push(space1);
    const scopeSel = buildScopeSelector();
    for (const n of scopeSel.nodes) result.nodes.push(n);
    if (descendantPart.length > 0) {
      const space2 = p.combinator({ value: " " });
      result.nodes.push(space2);
      for (const n of descendantPart) {
        result.nodes.push(typeof n.clone === "function" ? n.clone() : n);
      }
    }
    return result;
  }

  return prefixedSelector({
    nodes: sel.nodes.slice(combIdx + 1),
    [Symbol.iterator]() { return this.nodes[Symbol.iterator](); },
  });
}

function transformThemeSelector(sel) {
  const attrNode = sel.nodes[0];
  const themeValue = (attrNode.operator === "=" && attrNode.value) ? attrNode.value : "dark";

  const innerSel1 = p.selector();
  const c1 = p.className({ value: SCOPE_CLASS });
  innerSel1.nodes.push(c1);
  const a1 = p.attribute({
    attribute: "data-bs-theme",
    operator: "=",
    value: themeValue,
    quoteMark: '"',
  });
  innerSel1.nodes.push(a1);

  const p1 = p.pseudo({ value: ":where" });
  p1.nodes.push(innerSel1);
  const sOuter1 = p.selector();
  sOuter1.nodes.push(p1);

  const rest = sel.nodes.slice(1);
  if (rest.length > 0) {
    const firstRest = rest[0];
    if (firstRest.type !== "combinator") {
      const spacer = p.combinator({ value: " " });
      sOuter1.nodes.push(spacer);
    }
    for (const n of rest) {
      const clone = typeof n.clone === "function" ? n.clone() : n;
      if (clone.spaces) clone.spaces.before = "";
      sOuter1.nodes.push(clone);
    }
  }

  const s2 = p.selector();
  const a2 = p.attribute({
    attribute: "data-bs-theme",
    operator: "=",
    value: themeValue,
    quoteMark: '"',
  });
  s2.nodes.push(a2);
  const spTheme = p.combinator({ value: " " });
  s2.nodes.push(spTheme);
  const scopeSel2 = buildScopeSelector();
  for (const n of scopeSel2.nodes) s2.nodes.push(n);
  const rest2 = sel.nodes.slice(1);
  if (rest2.length > 0) {
    for (const n of rest2) {
      s2.nodes.push(typeof n.clone === "function" ? n.clone() : n);
    }
  }

  return [sOuter1, s2];
}

function transformStarSelector(sel) {
  const results = [];

  const base = buildScopeSelector();
  results.push(base);

  const pes = ["::before", "::after", "::placeholder", "::selection", "::marker"];

  for (const pe of pes) {
    const peSel = p.selector();
    const s = buildScopeSelector();
    for (const n of s.nodes) peSel.nodes.push(n);
    const peNode = p.pseudo({ value: pe });
    peSel.nodes.push(peNode);
    results.push(peSel);
  }

  const star = p.selector();
  const s1 = buildScopeSelector();
  for (const n of s1.nodes) star.nodes.push(n);
  const sp1 = p.combinator({ value: " " });
  star.nodes.push(sp1);
  const u1 = p.universal();
  star.nodes.push(u1);
  results.push(star);

  for (const pe of pes) {
    const peSel = p.selector();
    const s2 = buildScopeSelector();
    for (const n of s2.nodes) peSel.nodes.push(n);
    const sp2 = p.combinator({ value: " " });
    peSel.nodes.push(sp2);
    const peNode = p.pseudo({ value: pe });
    peSel.nodes.push(peNode);
    results.push(peSel);
  }

  return results;
}

function transformPseudoElementSelector(sel) {
  const pe = sel.nodes[0];
  const results = [];

  const scopeSelf = buildScopeSelector();
  const peClone = typeof pe.clone === "function" ? pe.clone() : pe;
  scopeSelf.nodes.push(peClone);
  results.push(scopeSelf);

  const descSel = p.selector();
  const scopeDesc = buildScopeSelector();
  for (const n of scopeDesc.nodes) descSel.nodes.push(n);
  const sp = p.combinator({ value: " " });
  descSel.nodes.push(sp);
  const cloned = cloneWithCleanFirstNode(sel);
  for (const n of cloned.nodes) descSel.nodes.push(n);
  results.push(descSel);

  return results;
}

function hasScopeAncestor(nodes) {
  for (const n of nodes) {
    if (n.type === "pseudo" && n.value === ":where" && n.nodes) {
      for (const inner of n.nodes) {
        if (inner.type === "selector" && inner.nodes) {
          for (const innerNode of inner.nodes) {
            if (innerNode.type === "class" && innerNode.value === SCOPE_CLASS) {
              return true;
            }
          }
        }
      }
    }
  }
  return false;
}

function transformSingleSelector(sel) {
  const fnci = firstNonCombinatorIndex(sel.nodes);
  if (fnci === -1) return null;
  const first = sel.nodes[fnci];

  if (hasScopeAncestor(sel.nodes)) return sel;

  if (first.type === "pseudo" && first.value === ":root") {
    return buildScopeSelector();
  }

  if (first.type === "tag" && (first.value === "html" || first.value === "body")) {
    return transformBodyHtmlSelector(sel);
  }

  if (first.type === "attribute" && (first.attribute === "data-bs-theme")) {
    return transformThemeSelector(sel);
  }

  if (first.type === "universal" && sel.nodes.length === 1) {
    return transformStarSelector(sel);
  }

  if (first.type === "pseudo" && first.value.startsWith("::")) {
    return transformPseudoElementSelector(sel);
  }

  if (first.type === "combinator") {
    const result = p.selector();
    const scopeSel = buildScopeSelector();
    for (const n of scopeSel.nodes) result.nodes.push(n);
    const sp = p.combinator({ value: " " });
    result.nodes.push(sp);
    const cloned = cloneWithCleanFirstNode(sel);
    for (const n of cloned.nodes) result.nodes.push(n);
    return result;
  }

  return prefixedSelector(sel);
}

export function transformSelector(selectorStr) {
  if (!selectorStr || selectorStr.trim() === "") return "";
  let result;
  p((selectors) => {
    const allResults = [];
    for (const sel of selectors.nodes) {
      const r = transformSingleSelector(sel);
      if (Array.isArray(r)) {
        for (const item of r) allResults.push(item);
      } else if (r) {
        allResults.push(r);
      } else {
        const cloned = cloneWithCleanFirstNode(sel);
        allResults.push(cloned);
      }
    }
    selectors.nodes = allResults;
    result = String(selectors);
  }).processSync(selectorStr);
  return result;
}

export function scopeBootstrapCss(sourceCss) {
  const root = postcss.parse(sourceCss, { map: false });

  function isInKeyframes(node) {
    let parent = node.parent;
    while (parent) {
      if (parent.type === "atrule" && (parent.name === "keyframes" || parent.name === "-webkit-keyframes")) {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }

  root.walk((node) => {
    if (node.type === "rule" && !isInKeyframes(node)) {
      const seen = new Set();
      const newSelectors = [];
      for (const selStr of node.selectors) {
        const transformed = transformSelector(selStr);
        if (transformed) {
          const parts = transformed.split(",").map((s) => s.trim());
          for (const part of parts) {
            if (!seen.has(part)) {
              seen.add(part);
              newSelectors.push(part);
            }
          }
        }
      }
      node.selectors = newSelectors;
    }
  });

  let css = root.toString();
  css = css.replace(/\/\*#\s*sourceMappingURL=[^*]+\*\//g, "");
  return css;
}

export function computeSha256(input) {
  return crypto.createHash("sha256").update(input, "utf-8").digest("hex");
}
