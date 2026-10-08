const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const modal = read("components/technical-analysis/components/modals/indicators/IndicatorsModal.tsx");
const baseModal = read("components/technical-analysis/components/common/primitives/BaseModal.tsx");
const toolbar = read("components/technical-analysis/components/toolbar/ChartToolbar.tsx");
const styles = read("styles/pages/_technical-analysis-final.scss");

test("BaseModal exposes a reusable header accessory slot", () => {
  assert.match(baseModal, /headerAccessory\?: ReactNode/);
  assert.match(baseModal, /className="gp-modal-header-accessory"/);
});

test("indicators modal uses the Zonebourse compact shell contract", () => {
  assert.match(modal, /title="Indicateurs"/);
  assert.match(modal, /className="gp-indicators-modal gp-indicators-modal--zonebourse"/);
  assert.match(modal, /headerAccessory=\{\([\s\S]*?gp-zb-indicator-search/);
  assert.match(modal, /placeholder="Recherche indicateur"/);
  assert.match(modal, /hideFooter/);
  assert.match(modal, /showCloseButton=\{false\}/);
  assert.match(modal, /maxWidth="872px"/);
  assert.match(modal, /gp-indicator-control-strip[^>]*hidden/);
});

test("indicators modal closes from its parent trigger, outside pointer and Escape contract", () => {
  assert.match(toolbar, /data-indicators-modal-trigger="true"/);
  assert.match(toolbar, /aria-pressed=\{uiState\.modals\.indicators\}/);
  assert.match(toolbar, /isOpen:\s*!uiState\.modals\.indicators/);
  assert.match(modal, /document\.addEventListener\("pointerdown", handleDocumentPointerDown, true\)/);
  assert.match(modal, /modalNode\?\.contains\(target\)/);
  assert.match(modal, /closest\('\[data-indicators-modal-trigger="true"\]'\)/);
  assert.match(baseModal, /event\.key !== "Escape"/);
  assert.match(baseModal, /onClose\(\);/);
});

test("indicators modal exposes dynamic favorites, families and hover information", () => {
  assert.match(modal, />Indicateurs favoris</);
  assert.match(modal, />Tous les indicateurs</);
  assert.match(modal, /INDICATOR_FAVORITES_STORAGE_KEY/);
  assert.match(modal, /DEFAULT_INDICATOR_FAVORITE_CODES/);
  assert.match(modal, /gp-zb-favorites-grid/);
  assert.match(modal, /gp-zb-catalog-row__favorite/);
  assert.match(modal, /Retirer \$\{label\} des favoris/);
  assert.match(modal, /Ajouter \$\{label\} aux favoris/);
  assert.match(modal, /favoriteIndicatorCodes\.map\(renderFavoriteIndicator\)/);
  assert.match(modal, /gp-zb-catalog-families/);
  assert.match(modal, /gp-zb-catalog-family__header/);
  assert.match(modal, /renderZonebourseSectionItems/);
  assert.match(modal, /IndicatorHoverInfoPanel/);
  assert.doesNotMatch(modal, /gp-zb-catalog-row__info/);
  assert.doesNotMatch(modal, />ⓘ</);
});

test("Zonebourse visual density is encoded as a two-column 32px catalogue", () => {
  assert.match(styles, /\.gp-indicators-modal--zonebourse \{[\s\S]*?width: min\(872px,[\s\S]*?height: min\(790px/);
  assert.match(styles, /\.gp-modal-header \{[\s\S]*?min-height: 51px/);
  assert.match(styles, /\.gp-zb-indicator-search \{[\s\S]*?width: 229px;[\s\S]*?height: 32px/);
  assert.match(styles, /\.gp-zb-favorites-grid \{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.gp-zb-indicator-section-title \{[\s\S]*?min-height: 33px/);
  assert.match(styles, /\.gp-zb-catalog-grid \{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.gp-zb-catalog-row \{[\s\S]*?height: 32px;[\s\S]*?border: 0;[\s\S]*?background: transparent/);
  assert.match(styles, /\.gp-indicators-modal--zonebourse \{[\s\S]*?background: #081a2d !important/);
  assert.match(styles, /\.gp-zb-catalog-family__header \{[\s\S]*?background: #0c2136/);
  assert.match(styles, /\.gp-zb-catalog-row__favorite \{[\s\S]*?flex: 0 0 26px/);
  assert.match(styles, /\.gp-zb-catalog-row__favorite\[aria-pressed="true"\] \{[\s\S]*?color: #ffb400/);
  assert.doesNotMatch(modal, /<NativeVolumeCard[\s\S]*?<MACard/);
});
