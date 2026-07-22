import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { verifyScopeCss } from "../verify-technical-analysis-bootstrap.mjs";

describe("verify-technical-analysis-bootstrap", () => {

  // --- Négatifs : ces CSS doivent être REJETÉS ---

  it("rejette .btn sans scope", () => {
    const css = ".btn { color: red; }";
    const r = verifyScopeCss(css);
    assert.ok(r.rejectCount > 0, "devrait rejeter .btn sans scope");
    assert.ok(r.rejected.some((s) => s.includes(".btn")), "rejet devrait mentionner .btn");
  });

  it("rejette body .btn sans scope", () => {
    const css = "body .btn { }";
    const r = verifyScopeCss(css);
    assert.ok(r.rejectCount > 0);
    assert.ok(r.rejected.some((s) => s.includes(".btn")));
  });

  it("rejette .technical-analysis-bootstrap-scope .btn (classe nue hors :where)", () => {
    const css = ".technical-analysis-bootstrap-scope .btn { }";
    const r = verifyScopeCss(css);
    assert.ok(r.rejectCount > 0);
    assert.ok(r.rejected.some((s) => s.includes("DIRECT_SCOPE")));
  });

  it("rejette :where(.autre-classe) .btn (mauvais scope)", () => {
    const css = ":where(.autre-classe) .btn { }";
    const r = verifyScopeCss(css);
    assert.ok(r.rejectCount > 0);
    assert.ok(r.rejected.some((s) => s.includes("MISSING_SCOPE")));
  });

  it("rejette double :where(.technical-analysis-bootstrap-scope) dans la même branche", () => {
    const css = ":where(.technical-analysis-bootstrap-scope) :where(.technical-analysis-bootstrap-scope) .btn { }";
    const r = verifyScopeCss(css);
    assert.ok(r.rejectCount > 0);
    assert.ok(r.rejected.some((s) => s.includes("DOUBLE_SCOPE")));
  });

  it("rejette :root global", () => {
    const css = ":root { --bs-blue: blue; }";
    const r = verifyScopeCss(css);
    assert.ok(r.rejectCount > 0);
    assert.ok(r.rejected.some((s) => s.includes("GLOBAL_ROOT")));
  });

  it("rejette [data-bs-theme=dark] .btn sans scope", () => {
    const css = '[data-bs-theme=dark] .btn { }';
    const r = verifyScopeCss(css);
    assert.ok(r.rejectCount > 0);
    assert.ok(r.rejected.some((s) => s.includes("MISSING_SCOPE")));
  });

  // --- Positifs : ces CSS doivent être ACCEPTÉS ---

  it("accepte :where(.technical-analysis-bootstrap-scope) .btn", () => {
    const css = ":where(.technical-analysis-bootstrap-scope) .btn { }";
    const r = verifyScopeCss(css);
    assert.equal(r.rejectCount, 0);
  });

  it("accepte body.modal-open :where(.technical-analysis-bootstrap-scope) .modal", () => {
    const css = "body.modal-open :where(.technical-analysis-bootstrap-scope) .modal { }";
    const r = verifyScopeCss(css);
    assert.equal(r.rejectCount, 0);
  });

  it("accepte [data-bs-theme=dark] :where(.technical-analysis-bootstrap-scope) .btn", () => {
    const css = '[data-bs-theme=dark] :where(.technical-analysis-bootstrap-scope) .btn { }';
    const r = verifyScopeCss(css);
    assert.equal(r.rejectCount, 0);
  });

  it("accepte :where(.technical-analysis-bootstrap-scope[data-bs-theme=dark]) .btn", () => {
    const css = ':where(.technical-analysis-bootstrap-scope[data-bs-theme=dark]) .btn { }';
    const r = verifyScopeCss(css);
    assert.equal(r.rejectCount, 0);
  });

});
