import * as echarts from 'echarts';
import { DrawingPoint, MagnetMode } from '@/types/drawingTools';

interface NAVDataPoint {
  date: string;
  value: number;
}

/**
 * Convertit les coordonnées pixel en point de données
 * Retourne null si le clic est hors de la grille
 */
export function pixelToPoint(
  chart: echarts.ECharts,
  navData: NAVDataPoint[],
  x: number,
  y: number
): { xIndex: number; point: DrawingPoint } | null {
  // Vérifier qu'on est dans la grille
  const inside = chart.containPixel('grid', [x, y]);
  if (!inside) return null;

  // Convertir les pixels en valeurs de données
  const data = chart.convertFromPixel(
    { xAxisIndex: 0, yAxisIndex: 0 },
    [x, y]
  ) as [number, number];

  if (!data || data.length < 2) return null;

  const xIndex = Math.round(data[0]);
  const yValue = data[1];

  if (xIndex < 0 || xIndex >= navData.length) return null;

  return {
    xIndex,
    point: {
      xAxis: navData[xIndex].date,
      yAxis: yValue,
    },
  };
}

/**
 * Applique le mode aimant (magnet) pour snapper le point vers la courbe
 * - off: pas de snap
 * - weak: snap si distance < 8px
 * - strong: snap systématique
 */
export function applyMagnet(
  chart: echarts.ECharts,
  navData: NAVDataPoint[],
  xIndex: number,
  point: DrawingPoint,
  magnetMode: MagnetMode
): DrawingPoint {
  if (magnetMode === 'off') return point;

  const seriesY = navData[xIndex].value;

  if (magnetMode === 'strong') {
    return { ...point, yAxis: seriesY };
  }

  // weak: snap si proche en pixels
  const yPix = chart.convertToPixel({ yAxisIndex: 0 }, point.yAxis) as number;
  const seriesPix = chart.convertToPixel({ yAxisIndex: 0 }, seriesY) as number;

  if (
    Number.isFinite(yPix) &&
    Number.isFinite(seriesPix) &&
    Math.abs(yPix - seriesPix) < 8
  ) {
    return { ...point, yAxis: seriesY };
  }

  return point;
}

/**
 * Vérifie si une date existe dans le dataset actuel
 */
export function dateExistsInDataset(date: string, dates: string[]): boolean {
  return dates.indexOf(date) !== -1;
}

/**
 * Calcule le point d'intersection entre une ligne et le bord droit du graphique
 * Utilisé pour le tool "ray"
 */
export function extendRayToEdge(
  point1: DrawingPoint,
  point2: DrawingPoint,
  dates: string[]
): DrawingPoint {
  const x1 = dates.indexOf(point1.xAxis);
  const x2 = dates.indexOf(point2.xAxis);
  const y1 = point1.yAxis;
  const y2 = point2.yAxis;

  if (x1 === -1 || x2 === -1 || x1 === x2) return point2;

  // Calculer la pente
  const slope = (y2 - y1) / (x2 - x1);

  // Étendre jusqu'au dernier point du dataset
  const lastX = dates.length - 1;
  const extendedY = y1 + slope * (lastX - x1);

  return {
    xAxis: dates[lastX],
    yAxis: extendedY,
  };
}
