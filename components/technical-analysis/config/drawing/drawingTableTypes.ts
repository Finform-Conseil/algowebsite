export interface TableCellData {
  text: string;
  textColor?: string;
  bgColor?: string;
}

export interface TableDrawingProps {
  rows: number;
  columns: number;
  columnWidths: number[];
  rowHeights: number[];
  cells: TableCellData[][];
  headerRow: boolean;
  headerColumn: boolean;
  borderColor?: string;
  headerBgColor?: string;
  headerTextColor?: string;
  altRowColor?: string;
}

export function createDefaultTableProps(): TableDrawingProps {
  const rows = 3;
  const columns = 3;
  const columnWidths = [80, 80, 80];
  const rowHeights = [30, 30, 30];
  const cells: TableCellData[][] = Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => ({ text: "" }))
  );
  return {
    rows,
    columns,
    columnWidths,
    rowHeights,
    cells,
    headerRow: true,
    headerColumn: true,
    borderColor: "#d1d4dc",
    headerBgColor: "rgba(41, 98, 255, 0.08)",
    headerTextColor: "#2962FF",
    altRowColor: "rgba(255, 255, 255, 0.03)",
  };
}
