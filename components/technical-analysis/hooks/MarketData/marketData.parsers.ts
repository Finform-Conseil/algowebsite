import { BRVM_NAME_TO_TICKER } from "@/shared/utils/brvm-mapping";
import type { LiveSnapshot } from "../../config/market/marketSnapshotTypes";
import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";

export const resolveBRVMDatasetTicker = (symbol: string): string => {
  const normalizedSymbol = symbol.trim().toUpperCase();
  return BRVM_NAME_TO_TICKER[normalizedSymbol] ?? normalizedSymbol;
};

export const parseBRVMCSV = (csvText: string): ChartDataPoint[] => {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const firstLine = lines[0];
  const delimiter = firstLine.includes(";") ? ";" : ",";

  const headers = firstLine.split(delimiter).map((header) => header.trim().toLowerCase());
  const dateIdx = headers.findIndex((header) => header.includes("date") || header.includes("time"));
  const openIdx = headers.findIndex((header) => header.includes("open") || header.includes("ouv"));
  const highIdx = headers.findIndex((header) => header.includes("high") || header.includes("haut"));
  const lowIdx = headers.findIndex((header) => header.includes("low") || header.includes("bas"));
  const closeIdx = headers.findIndex((header) => header.includes("close") || header.includes("clot") || header.includes("cours"));
  const volIdx = headers.findIndex((header) => header.includes("volume") || header.includes("vol"));
  const tradesCountIdx = headers.findIndex((header) =>
    /(^|[_\s-])(trades?|transactions?)([_\s-]|$)/.test(header) ||
    header.includes("trades_count") ||
    header.includes("trade_count") ||
    header.includes("nombre_transactions") ||
    header.includes("nb_transactions")
  );

  const cleanNum = (value: string) => {
    if (!value) return 0;
    const sanitized = value.replace(/['"\s]/g, "").replace(",", ".");
    return parseFloat(sanitized) || 0;
  };

  const data: ChartDataPoint[] = [];

  for (let index = 1; index < lines.length; index++) {
    const cols = lines[index].split(delimiter);
    if (cols.length < 5) continue;

    let timeStr = dateIdx !== -1 && cols[dateIdx] ? cols[dateIdx].trim() : new Date().toISOString();

    if (timeStr.includes("/")) {
      const parts = timeStr.split("/");
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          timeStr = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        } else if (parts[0].length === 4) {
          timeStr = `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
        }
      }
    }

    data.push({
      time: timeStr,
      open: cleanNum(cols[openIdx]),
      high: cleanNum(cols[highIdx]),
      low: cleanNum(cols[lowIdx]),
      close: cleanNum(cols[closeIdx]),
      volume: volIdx !== -1 ? Math.round(cleanNum(cols[volIdx])) : 0,
      tradesCount: tradesCountIdx !== -1 ? Math.round(cleanNum(cols[tradesCountIdx])) : null,
    });
  }

  return data
    .filter((point) => point.open > 0 && point.close > 0)
    .sort((left, right) => new Date(left.time).getTime() - new Date(right.time).getTime());
};

export const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index++) {
    const ch = line[index];
    if (ch === "\"") {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(field);
      field = "";
    } else {
      field += ch;
    }
  }

  result.push(field);
  return result;
};

export const parseIndicatorCSV = (csvText: string): Partial<LiveSnapshot> | null => {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return null;

  const headers = lines[0].split(",").map((header) => header.trim());
  const values = parseCSVLine(lines[1]);

  const getVal = (key: string) => {
    const idx = headers.findIndex((header) => header.toLowerCase() === key.toLowerCase());
    return idx !== -1 ? (values[idx] || "").trim() : "";
  };

  const cleanNum = (value: string, currentPrice?: number) => {
    const cleaned = value.replace(/['"\s]/g, "").replace(",", ".");
    let num = parseFloat(cleaned) || 0;
    if (currentPrice && currentPrice > 0 && num > currentPrice * 10) {
      num /= 100;
    }
    return num;
  };

  const price = cleanNum(getVal("Cours_Actuel"));
  const prevClose = cleanNum(getVal("Cloture_Veille"), price);
  const volume = cleanNum(getVal("Volume_Titres") || getVal("Volume"));
  const tradesCountRaw =
    getVal("Trades_Count") ||
    getVal("Trade_Count") ||
    getVal("Nombre_Transactions") ||
    getVal("Nb_Transactions") ||
    getVal("Transactions") ||
    getVal("Trades");
  const tradesCount = tradesCountRaw ? Math.round(cleanNum(tradesCountRaw)) : null;

  let variationStr = getVal("Variation_Cours") || getVal("Variation (%)");
  const isZeroVar = !variationStr || variationStr === "0,00" || variationStr === "0,00%" || variationStr === "0.00%";

  if (isZeroVar && price > 0 && prevClose > 0 && Math.abs(price - prevClose) > 0.01) {
    const calcVar = ((price - prevClose) / prevClose) * 100;
    variationStr = `${calcVar >= 0 ? "+" : ""}${calcVar.toFixed(2)}%`;
  }

  const variationNum = parseFloat(variationStr.replace(/[^\d.,-]/g, "").replace(",", ".")) || 0;

  return {
    price,
    variation: variationStr,
    // @ts-expect-error - Dynamically injected for high-performance UI reads
    variationNum,
    prevClose,
    open: cleanNum(getVal("Ouverture"), price),
    high: cleanNum(getVal("Plus_Haut"), price),
    low: cleanNum(getVal("Plus_Bas"), price),
    volume,
    tradesCount,
    lastUpdate: new Date().toISOString(),
  };
};
