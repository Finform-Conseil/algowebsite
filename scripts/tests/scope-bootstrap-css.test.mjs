import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { transformSelector, scopeBootstrapCss, computeSha256, SCOPE_CLASS } from "../lib/scope-bootstrap-css.mjs";

describe("scope-bootstrap-css", () => {

  // 1. Préfixage classe simple
  it("1 - préfixage classe simple .btn", () => {
    assert.equal(transformSelector(".btn"), ":where(.technical-analysis-bootstrap-scope) .btn");
  });

  // 2. Préfixage liste
  it("2 - préfixage liste .btn, .table", () => {
    const result = transformSelector(".btn, .table");
    assert.ok(result.includes(":where(.technical-analysis-bootstrap-scope) .btn"));
    assert.ok(result.includes(":where(.technical-analysis-bootstrap-scope) .table"));
  });

  // 3. Conservation !important
  it("3 - conservation !important (déclaration, pas sélecteur)", () => {
    // !important est une déclaration CSS, pas un sélecteur
    // On vérifie que le module PostCSS préserve la déclaration
    const css = ".btn { color: red !important; }";
    const result = scopeBootstrapCss(css);
    assert.ok(result.includes("!important"));
    assert.ok(result.includes(":where(.technical-analysis-bootstrap-scope) .btn"));
  });

  // 4. Transformation :root
  it("4 - transformation :root", () => {
    assert.equal(transformSelector(":root"), ":where(.technical-analysis-bootstrap-scope)");
  });

  // 5. Transformation html
  it("5 - transformation html", () => {
    assert.equal(transformSelector("html"), ":where(.technical-analysis-bootstrap-scope)");
  });

  // 6. Transformation body
  it("6 - transformation body", () => {
    assert.equal(transformSelector("body"), ":where(.technical-analysis-bootstrap-scope)");
  });

  // 7. body .modal
  it("7 - transformation body .modal", () => {
    assert.equal(
      transformSelector("body .modal"),
      ":where(.technical-analysis-bootstrap-scope) .modal"
    );
  });

  // 8. body.modal-open .modal
  it("8 - transformation body.modal-open .modal", () => {
    assert.equal(
      transformSelector("body.modal-open .modal"),
      "body.modal-open :where(.technical-analysis-bootstrap-scope) .modal"
    );
  });

  // 9. Thème light
  it("9 - transformation thème [data-bs-theme=\"light\"]", () => {
    const result = transformSelector('[data-bs-theme="light"]');
    assert.ok(result.includes(":where(.technical-analysis-bootstrap-scope[data-bs-theme=light])"));
    assert.ok(result.includes("[data-bs-theme=light] :where(.technical-analysis-bootstrap-scope)"));
  });

  // 10. Thème dark
  it("10 - transformation thème [data-bs-theme=\"dark\"]", () => {
    const result = transformSelector('[data-bs-theme="dark"]');
    assert.ok(result.includes(":where(.technical-analysis-bootstrap-scope[data-bs-theme=dark])"));
    assert.ok(result.includes("[data-bs-theme=dark] :where(.technical-analysis-bootstrap-scope)"));
  });

  // 11. Thème directement sur le scope (via data-bs-theme sur wrapper)
  it("11 - thème appliqué directement sur le scope", () => {
    const result = transformSelector('[data-bs-theme="dark"]');
    assert.ok(result.startsWith(":where(.technical-analysis-bootstrap-scope[data-bs-theme=dark])"));
    // First variant: scope with theme attribute directly
    assert.ok(result.includes(":where(.technical-analysis-bootstrap-scope[data-bs-theme=dark])"));
  });

  // 12. Thème hérité depuis un ancêtre
  it("12 - thème hérité depuis un ancêtre", () => {
    const result = transformSelector('[data-bs-theme="dark"]');
    // Second variant: theme on ancestor, scope as descendant
    assert.ok(result.includes("[data-bs-theme=dark] :where(.technical-analysis-bootstrap-scope)"));
  });

  // 13. Transformation *
  it("13 - transformation *", () => {
    const result = transformSelector("*");
    // Must include scope itself
    assert.ok(result.startsWith(":where(.technical-analysis-bootstrap-scope)"));
    // Must include scope pseudo-elements
    assert.ok(result.includes(":where(.technical-analysis-bootstrap-scope)::before"));
    assert.ok(result.includes(":where(.technical-analysis-bootstrap-scope)::after"));
    assert.ok(result.includes(":where(.technical-analysis-bootstrap-scope)::placeholder"));
    assert.ok(result.includes(":where(.technical-analysis-bootstrap-scope)::selection"));
    assert.ok(result.includes(":where(.technical-analysis-bootstrap-scope)::marker"));
    // Must include * descendant
    assert.ok(result.includes(":where(.technical-analysis-bootstrap-scope) *"));
    // Must include descendant pseudo-elements
    assert.ok(result.includes(":where(.technical-analysis-bootstrap-scope) ::before"));
    assert.ok(result.includes(":where(.technical-analysis-bootstrap-scope) ::after"));
  });

  // 14. ::before - couvre scope et descendants
  it("14 - transformation ::before couvre scope et descendants", () => {
    const result = transformSelector("::before");
    assert.ok(result.includes(":where(.technical-analysis-bootstrap-scope)::before"));
    assert.ok(result.includes(":where(.technical-analysis-bootstrap-scope) ::before"));
  });

  // 15. ::after - couvre scope et descendants
  it("15 - transformation ::after couvre scope et descendants", () => {
    const result = transformSelector("::after");
    assert.ok(result.includes(":where(.technical-analysis-bootstrap-scope)::after"));
    assert.ok(result.includes(":where(.technical-analysis-bootstrap-scope) ::after"));
  });

  // 16. Règle dans @media
  it("16 - règle dans @media", () => {
    const css = "@media (min-width: 576px) { .modal { width: 500px; } }";
    const result = scopeBootstrapCss(css);
    assert.ok(result.includes("@media (min-width: 576px)"));
    assert.ok(result.includes(":where(.technical-analysis-bootstrap-scope) .modal"));
  });

  // 17. Règle dans @supports
  it("17 - règle dans @supports", () => {
    const css = "@supports (display: grid) { .grid { display: grid; } }";
    const result = scopeBootstrapCss(css);
    assert.ok(result.includes("@supports (display: grid)"));
    assert.ok(result.includes(":where(.technical-analysis-bootstrap-scope) .grid"));
  });

  // 18. Conservation @keyframes
  it("18 - conservation @keyframes", () => {
    const css = "@keyframes spinner { 0% { transform: rotate(0); } 100% { transform: rotate(360deg); } }";
    const result = scopeBootstrapCss(css);
    assert.ok(result.includes("@keyframes spinner"));
    assert.ok(result.includes("0%"));
    assert.ok(result.includes("100%"));
  });

  // 19. Sélecteur avec :not()
  it("19 - sélecteur avec :not()", () => {
    const result = transformSelector(".table > :not(caption) > * > *");
    assert.ok(result.startsWith(":where(.technical-analysis-bootstrap-scope)"));
    assert.ok(result.includes(":not(caption)"));
  });

  // 20. Sélecteur avec :is()
  it("20 - sélecteur avec :is()", () => {
    const result = transformSelector(":is(.btn, .btn-close)");
    assert.ok(result.startsWith(":where(.technical-analysis-bootstrap-scope)"));
    assert.ok(result.includes(":is(.btn, .btn-close)"));
  });

  // 21. Sélecteur avec attribut
  it("21 - sélecteur avec attribut", () => {
    const result = transformSelector('[data-bs-target]');
    assert.equal(result, ":where(.technical-analysis-bootstrap-scope) [data-bs-target]");
  });

  // 22. Absence de double préfixage
  it("22 - absence de double préfixage", () => {
    // Vérifie que transformer deux fois ne crée pas de doublon
    const once = transformSelector(".btn");
    const twice = transformSelector(once);
    // Le deuxième appel ne devrait pas rajouter un scope
    assert.equal(once, twice);
  });

  // 23. Déterminisme
  it("23 - déterminisme de la génération", () => {
    const css = ".btn { color: blue; } .table { width: 100%; }";
    const a = scopeBootstrapCss(css);
    const b = scopeBootstrapCss(css);
    assert.equal(a, b);
  });

  // 24. Absence de sourceMappingURL invalide
  it("24 - absence de sourceMappingURL", () => {
    const css = ".btn { } /*# sourceMappingURL=bootstrap.min.css.map */";
    const result = scopeBootstrapCss(css);
    assert.ok(!result.includes("sourceMappingURL"));
  });

  // 25. Absence de sélecteur global
  it("25 - absence de sélecteur applicatif global", () => {
    const css = ".btn { } .table { }";
    const result = scopeBootstrapCss(css);
    assert.ok(!result.includes(".btn") || result.includes(":where(.technical-analysis-bootstrap-scope) .btn"));
    assert.ok(!result.includes(".table") || result.includes(":where(.technical-analysis-bootstrap-scope) .table"));
  });

  // 26. ::before couvre le scope lui-même
  it("26 - ::before couvre le scope lui-même", () => {
    const result = transformSelector("::before");
    assert.ok(
      result.includes(":where(.technical-analysis-bootstrap-scope)::before"),
      `scope::before manquant dans: ${result}`
    );
  });

  // 27. ::after couvre le scope lui-même
  it("27 - ::after couvre le scope lui-même", () => {
    const result = transformSelector("::after");
    assert.ok(
      result.includes(":where(.technical-analysis-bootstrap-scope)::after"),
      `scope::after manquant dans: ${result}`
    );
  });

  // 28. ::before couvre aussi les descendants
  it("28 - ::before couvre aussi les descendants", () => {
    const result = transformSelector("::before");
    assert.ok(
      result.includes(":where(.technical-analysis-bootstrap-scope) ::before"),
      `scope ::before manquant dans: ${result}`
    );
  });

  // 29. ::after couvre aussi les descendants
  it("29 - ::after couvre aussi les descendants", () => {
    const result = transformSelector("::after");
    assert.ok(
      result.includes(":where(.technical-analysis-bootstrap-scope) ::after"),
      `scope ::after manquant dans: ${result}`
    );
  });

  // 30. La règle universelle * couvre le scope lui-même
  it("30 - la règle universelle * couvre le scope lui-même", () => {
    const result = transformSelector("*");
    // scope seul
    assert.ok(result.match(/^:where\(\.technical-analysis-bootstrap-scope\)(,|$)/));
    // scope + pseudo-éléments
    assert.ok(result.includes(":where(.technical-analysis-bootstrap-scope)::before"));
    assert.ok(result.includes(":where(.technical-analysis-bootstrap-scope)::after"));
  });

  // 31. Aucun pseudo-élément scopé ne peut correspondre hors du scope
  it("31 - aucun pseudo-élément hors scope", () => {
    // Vérifier que tout ::before/::after dans le résultat contient le scope
    const result = transformSelector("*");
    const pseudoMatches = result.match(/::before|::after|::placeholder|::selection|::marker/g);
    if (pseudoMatches) {
      const segments = result.split(",").map((s) => s.trim());
      for (const seg of segments) {
        if (/::(before|after|placeholder|selection|marker)/.test(seg)) {
          assert.ok(
            seg.includes(SCOPE_CLASS),
            `sélecteur sans scope: ${seg}`
          );
        }
      }
    }
  });

  // 32. Absence de doublons exacts dans la règle universelle (via scopeBootstrapCss qui déduplique)
  it("32 - absence de doublons exacts dans la règle universelle", () => {
    const css = "*, ::before, ::after { box-sizing: border-box; }";
    const result = scopeBootstrapCss(css);
    // Extraire les sélecteurs de la règle
    const match = result.match(/^([^{]+)\{/m);
    assert.ok(match, "devrait trouver une règle");
    const parts = match[1].split(",").map((s) => s.trim());
    const seen = new Set();
    for (const part of parts) {
      assert.ok(
        !seen.has(part),
        `doublon trouvé: ${part}`
      );
      seen.add(part);
    }
  });

});
