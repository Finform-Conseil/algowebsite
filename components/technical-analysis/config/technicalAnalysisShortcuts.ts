export type TechnicalAnalysisShortcutCategoryId =
  | "chart"
  | "drawings"
  | "trading"
  | "alerts";

export type TechnicalAnalysisShortcut = {
  id: string;
  category: TechnicalAnalysisShortcutCategoryId;
  label: { en: string; fr: string };
  keys: string[][];
};

export const TECHNICAL_ANALYSIS_SHORTCUT_CATEGORIES = [
  { id: "chart", icon: "bi-graph-up", label: { en: "Chart", fr: "Graphique" } },
  { id: "drawings", icon: "bi-bezier2", label: { en: "Indicators and drawings", fr: "Indicateurs et dessins" } },
  { id: "trading", icon: "bi-arrow-down-up", label: { en: "Trading", fr: "Trading" } },
  { id: "alerts", icon: "bi-alarm", label: { en: "Alerts", fr: "Alertes" } },
] as const;

export const TECHNICAL_ANALYSIS_SHORTCUTS: readonly TechnicalAnalysisShortcut[] = [
  { id: "help", category: "chart", label: { en: "Keyboard shortcuts", fr: "Raccourcis clavier" }, keys: [["Ctrl", "/"]] },
  { id: "symbol-search", category: "chart", label: { en: "Quick symbol search", fr: "Recherche rapide de symbole" }, keys: [["Ctrl", "K"]] },
  { id: "indicators", category: "chart", label: { en: "Open indicators", fr: "Ouvrir les indicateurs" }, keys: [["/"]] },
  { id: "data-window", category: "chart", label: { en: "Open data window", fr: "Ouvrir la fenêtre de données" }, keys: [["Alt", "D"]] },
  { id: "analysis-history", category: "chart", label: { en: "Open saved analyses", fr: "Ouvrir les analyses sauvegardées" }, keys: [["."]] },
  { id: "pan-left", category: "chart", label: { en: "Move chart 1 bar to the left", fr: "Déplacer le graphique d’une barre vers la gauche" }, keys: [["Arrow Left"]] },
  { id: "pan-right", category: "chart", label: { en: "Move chart 1 bar to the right", fr: "Déplacer le graphique d’une barre vers la droite" }, keys: [["Arrow Right"]] },
  { id: "zoom-in", category: "chart", label: { en: "Zoom in", fr: "Zoom avant" }, keys: [["Ctrl", "Arrow Up"]] },
  { id: "zoom-out", category: "chart", label: { en: "Zoom out", fr: "Zoom arrière" }, keys: [["Ctrl", "Arrow Down"]] },
  { id: "reset-view", category: "chart", label: { en: "Reset chart view", fr: "Réinitialiser la vue du graphique" }, keys: [["Alt", "R"]] },
  { id: "undo", category: "chart", label: { en: "Undo chart change", fr: "Annuler la modification du graphique" }, keys: [["Ctrl", "Z"]] },
  { id: "redo", category: "chart", label: { en: "Redo chart change", fr: "Rétablir la modification du graphique" }, keys: [["Ctrl", "Shift", "Z"], ["Ctrl", "Y"]] },
  { id: "fullscreen", category: "chart", label: { en: "Fullscreen / Zen mode", fr: "Plein écran / mode Zen" }, keys: [["Shift", "F"]] },
  { id: "snapshot-download", category: "chart", label: { en: "Save chart image", fr: "Enregistrer l’image du graphique" }, keys: [["Ctrl", "Alt", "S"]] },
  { id: "snapshot-copy", category: "chart", label: { en: "Copy chart image", fr: "Copier l’image du graphique" }, keys: [["Ctrl", "Shift", "S"]] },
  { id: "trendline", category: "drawings", label: { en: "Trendline", fr: "Ligne de tendance" }, keys: [["Alt", "T"]] },
  { id: "horizontal-line", category: "drawings", label: { en: "Horizontal line", fr: "Ligne horizontale" }, keys: [["Alt", "H"]] },
  { id: "horizontal-ray", category: "drawings", label: { en: "Horizontal ray", fr: "Rayon horizontal" }, keys: [["Alt", "J"]] },
  { id: "vertical-line", category: "drawings", label: { en: "Vertical line", fr: "Ligne verticale" }, keys: [["Alt", "V"]] },
  { id: "crossline", category: "drawings", label: { en: "Crossline", fr: "Ligne croisée" }, keys: [["Alt", "C"]] },
  { id: "fib-retracement", category: "drawings", label: { en: "Fib retracement", fr: "Retracement de Fibonacci" }, keys: [["Alt", "F"]] },
  { id: "rectangle", category: "drawings", label: { en: "Rectangle", fr: "Rectangle" }, keys: [["Shift", "Alt", "R"]] },
  { id: "text-note", category: "drawings", label: { en: "Text note", fr: "Note texte" }, keys: [["Alt", "N"]] },
  { id: "measure", category: "drawings", label: { en: "Measure tool", fr: "Outil de mesure" }, keys: [["Shift", "Click"]] },
  { id: "remove-drawing", category: "drawings", label: { en: "Remove selected object", fr: "Supprimer l’objet sélectionné" }, keys: [["Delete"], ["Backspace"]] },
  { id: "hide-drawings", category: "drawings", label: { en: "Hide / show all drawings", fr: "Masquer / afficher tous les dessins" }, keys: [["Ctrl", "Alt", "H"]] },
  { id: "buy-stop", category: "trading", label: { en: "Buy stop order", fr: "Ordre d’achat stop" }, keys: [["Alt", "Shift", "B"]] },
  { id: "sell-limit", category: "trading", label: { en: "Sell limit order", fr: "Ordre de vente limite" }, keys: [["Alt", "Shift", "S"]] },
  { id: "generic-order", category: "trading", label: { en: "Open order ticket", fr: "Ouvrir le ticket d’ordre" }, keys: [["Shift", "T"]] },
  { id: "add-alert", category: "alerts", label: { en: "Add alert", fr: "Ajouter une alerte" }, keys: [["Alt", "A"]] },
] as const;
