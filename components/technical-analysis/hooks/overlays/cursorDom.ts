import { MAIN_GRID_LEFT, clamp } from "./overlayCoordinates";

export type DataWindowRow = {
  label: string;
  value: string;
  color: string;
};

export type CrosshairDomElements = {
  vertical: HTMLDivElement;
  horizontal: HTMLDivElement;
  dateLabel: HTMLDivElement;
};

export const applyStyle = (element: HTMLElement, styles: Record<string, string>): void => {
  Object.entries(styles).forEach(([property, value]) => {
    element.style.setProperty(property, value);
  });
};

export const hideTooltipElement = (tooltip: HTMLDivElement | null): void => {
  if (!tooltip) return;
  tooltip.style.display = "none";
};

export const createDataWindowColumn = (
  rows: DataWindowRow[],
  options: { labelWidth: number; rowHeight: number; labelColor: string; fontSize: number },
): HTMLDivElement => {
  const column = document.createElement("div");
  applyStyle(column, {
    display: "grid",
    gap: "0",
    "min-width": "0",
  });

  rows.forEach((item) => {
    const row = document.createElement("div");
    applyStyle(row, {
      display: "grid",
      "grid-template-columns": `${options.labelWidth}px minmax(0, 1fr)`,
      "align-items": "center",
      gap: "8px",
      height: `${options.rowHeight}px`,
      "min-width": "0",
    });

    const label = document.createElement("span");
    label.textContent = item.label;
    applyStyle(label, {
      color: options.labelColor,
      "font-size": `${options.fontSize}px`,
      "font-weight": "800",
      "white-space": "nowrap",
      "text-shadow": "0 1px 2px rgba(0, 0, 0, 0.55)",
    });

    const value = document.createElement("span");
    value.textContent = item.value;
    applyStyle(value, {
      color: item.color,
      "font-size": `${options.fontSize}px`,
      "font-weight": "900",
      "letter-spacing": "0",
      "text-align": "right",
      "white-space": "nowrap",
      overflow: "hidden",
      "text-overflow": "clip",
      "text-shadow": "0 1px 2px rgba(0, 0, 0, 0.65)",
    });

    row.replaceChildren(label, value);
    column.appendChild(row);
  });

  return column;
};

export const hideCrosshairElements = (elements: CrosshairDomElements | null): void => {
  if (!elements) return;
  elements.vertical.style.display = "none";
  elements.horizontal.style.display = "none";
  elements.dateLabel.style.display = "none";
};

export const createCrosshairElement = (className: string): HTMLDivElement => {
  const element = document.createElement("div");
  element.className = className;
  applyStyle(element, {
    position: "absolute",
    display: "none",
    "pointer-events": "none",
    "box-sizing": "border-box",
    "z-index": "22",
    "will-change": "transform",
  });
  return element;
};

export const updateCrosshairElements = (
  elements: CrosshairDomElements | null,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    showLines: boolean;
    showDateLabel: boolean;
    dateText: string;
  },
): void => {
  if (!elements) return;

  const snappedX = Math.round(options.x);
  const snappedY = Math.round(options.y);

  if (options.showLines) {
    elements.vertical.style.display = "block";
    elements.vertical.style.transform = `translate3d(${snappedX}px, 0, 0)`;
    elements.horizontal.style.display = "block";
    elements.horizontal.style.transform = `translate3d(0, ${snappedY}px, 0)`;
  } else {
    elements.vertical.style.display = "none";
    elements.horizontal.style.display = "none";
  }

  if (!options.showDateLabel) {
    elements.dateLabel.style.display = "none";
    return;
  }

  const labelWidth = Math.ceil(options.dateText.length * 7.2 + 18);
  const labelHeight = 22;
  const labelLeft = clamp(
    options.x - labelWidth / 2,
    MAIN_GRID_LEFT,
    Math.max(MAIN_GRID_LEFT, options.width - labelWidth),
  );
  const labelTop = Math.max(0, options.height - labelHeight);

  elements.dateLabel.textContent = options.dateText;
  elements.dateLabel.style.display = "flex";
  elements.dateLabel.style.width = `${labelWidth}px`;
  elements.dateLabel.style.height = `${labelHeight}px`;
  elements.dateLabel.style.transform = `translate3d(${Math.round(labelLeft)}px, ${Math.round(labelTop)}px, 0)`;
};
