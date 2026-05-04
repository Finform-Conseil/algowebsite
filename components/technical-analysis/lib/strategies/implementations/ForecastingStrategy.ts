// implementations/ForecastingStrategy.ts
// [TENOR 2026] ForecastingStrategy — Orchestrateur des 6 outils Forecasting
// NE PAS CONFONDRE avec AdvancedToolsStrategy qui gère les outils de même nom en mode legacy.
// Les 6 outils ici sont ceux de TOOL_CATEGORIES.FORECASTING dans DrawingToolsConfig.tsx.

import { IDrawingStrategy, HitTestResult, DrawingHelpers } from "../interfaces/IDrawingStrategy";
import { Drawing, DrawingPoint } from "../../../config/TechnicalAnalysisTypes";
import { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import { distanceBetweenPoints, isPointInPolygon, isPointInTriangle } from "../../math/geometry";
import type { EChartsInstance } from "../../types/echarts";

// Renderers dédiés — répertoire Forecasting/
import {
  renderForecastingLongPosition,
  hitTestForecastingLongPosition,
} from "../renderers/Forecasting/ForecastingLongPositionRenderer";
import {
  renderForecastingShortPosition,
  hitTestForecastingShortPosition,
} from "../renderers/Forecasting/ForecastingShortPositionRenderer";
import {
  renderForecastingPositionForecast,
  hitTestForecastingPositionForecast,
} from "../renderers/Forecasting/ForecastingPositionForecastRenderer";
import {
  renderForecastingBarPattern,
  hitTestForecastingBarPattern,
} from "../renderers/Forecasting/ForecastingBarPatternRenderer";
import {
  renderForecastingGhostFeed,
  hitTestForecastingGhostFeed,
} from "../renderers/Forecasting/ForecastingGhostFeedRenderer";
import {
  renderForecastingSector,
  hitTestForecastingSector,
} from "../renderers/Forecasting/ForecastingSectorRenderer";
import {
  renderForecastingAnchoredVWAP,
  hitTestForecastingAnchoredVWAP,
} from "../renderers/Forecasting/ForecastingAnchoredVWAPRenderer";
import {
  renderFixedRangeVolumeProfile,
  hitTestFixedRangeVolumeProfile,
} from "../renderers/Forecasting/FixedRangeVolumeProfileRenderer";
import { distancePointToSegment } from "../renderers/Forecasting/ForecastingUtils";

export class ForecastingStrategy implements IDrawingStrategy {
  public supportedTools = [
    "long_position",
    "short_position",
    "position_forecast",
    "bar_pattern",
    "ghost_feed",
    "sector",
    "anchored_vwap",
    "anchored_volume_profile",
  ];

  public render(
    pts: { x: number; y: number }[],
    dataPoints: DrawingPoint[],
    drawing: Drawing,
    chart: EChartsInstance,
    isSelected: boolean,
    h: DrawingHelpers,
    chartData: ChartDataPoint[]
  ): void {
    // [TENOR 2026] Direct dispatch — no _boxOffset collision hack.
    // Each renderer manages its own layout anchored to the drawing geometry.
    switch (drawing.type) {
      case "long_position":
        renderForecastingLongPosition(pts, dataPoints, drawing, chart, isSelected, h);
        break;
      case "short_position":
        renderForecastingShortPosition(pts, dataPoints, drawing, chart, isSelected, h);
        break;
      case "position_forecast":
        renderForecastingPositionForecast(pts, dataPoints, drawing, chart, isSelected, h);
        break;
      case "bar_pattern":
        renderForecastingBarPattern(pts, drawing, chart, isSelected, h);
        break;
      case "ghost_feed":
        renderForecastingGhostFeed(pts, drawing, chart, isSelected, h);
        break;
      case "sector":
        renderForecastingSector(pts, dataPoints, drawing, chart, isSelected, h);
        break;
      case "anchored_vwap":
        renderForecastingAnchoredVWAP(pts, dataPoints, drawing, chart, isSelected, h, chartData);
        break;
      case "anchored_volume_profile":
        renderFixedRangeVolumeProfile(pts, dataPoints, drawing, chart, isSelected, h, chartData);
        break;
      default:
        break;
    }
  }

  public hitTest(
    mx: number,
    my: number,
    drawing: Drawing,
    chartInstance: EChartsInstance,
    threshold: number = 8 // [SRE-FIX] Safety baseline for dispatching
  ): HitTestResult {
    const option = chartInstance.getOption();
    const seriesList = (option.series as Array<{ type?: string }>) || [];
    let priceIdx = seriesList.findIndex((s) => s.type === "candlestick");
    if (priceIdx === -1) priceIdx = 0;

    const points = drawing.points
      .map((p) => {
        const pixel = chartInstance.convertToPixel({ seriesIndex: priceIdx }, [p.time, p.value]);
        return pixel ? { x: pixel[0], y: pixel[1] } : null;
      })
      .filter((p): p is { x: number; y: number } => p !== null);

    if (points.length < 1) return { isHit: false, hitType: null };

    const { type } = drawing;
    const fillEnabled = drawing.style?.fillEnabled !== false;

    // 1. Détection générique des handles (points de contrôle)
    // [HDR-SRE-RECOVERY] Réactive la détection du pivot pour tous les outils,
    // y compris le 'sector'. Garantit un curseur 'grab' sur P0/P1/P2.
    for (let i = 0; i < points.length; i++) {
      // Position tools: ignorer le point d'entrée (index 0) pour les handles génériques
      if ((type === "long_position" || type === "short_position") && i === 0) continue;
      if (distanceBetweenPoints(mx, my, points[i].x, points[i].y) < 15) { // 15px pour HDR
        return { isHit: true, hitType: "point", pointIndex: i };
      }
    }

    // 2. SCAR-157: Fast-Path Hit-Testing des zones pleines (Fill) via Mathématiques Pures
    // Si le fond est activé, on utilise les primitives géométriques O(1) avant de déléguer.
    if (fillEnabled && points.length >= 3) {
      if (type === "sector") {
        // Approximation barycentrique du secteur (Triangle P0-P1-P2)
        // Couvre 90% de la surface de l'arc instantanément.
        if (isPointInTriangle(mx, my, points[0], points[1], points[2])) {
          return { isHit: true, hitType: "shape" };
        }
      } else if (type === "ghost_feed") {
        // Hit-test topologique du flux fantôme (Winding Number)
        if (isPointInPolygon(mx, my, points)) {
          return { isHit: true, hitType: "shape" };
        }
      }
    }

    // 3. Délégation aux hit-tests spécifiques (Bordures, Arcs, et logiques complexes)
    let result: HitTestResult = { isHit: false, hitType: null };
    switch (type) {
      case "long_position":
        result = hitTestForecastingLongPosition(mx, my, points, drawing, chartInstance, threshold);
        break;
      case "short_position":
        result = hitTestForecastingShortPosition(mx, my, points, drawing, chartInstance, threshold);
        break;
      case "position_forecast":
        result = hitTestForecastingPositionForecast(mx, my, points, drawing, chartInstance, threshold);
        break;
      case "bar_pattern":
        result = hitTestForecastingBarPattern(mx, my, points, drawing, chartInstance, threshold);
        break;
      case "ghost_feed":
        result = hitTestForecastingGhostFeed(mx, my, points, drawing, chartInstance, threshold);
        break;
      case "sector":
        result = hitTestForecastingSector(mx, my, points, drawing, chartInstance, threshold);
        break;
      case "anchored_vwap":
        result = hitTestForecastingAnchoredVWAP(mx, my, points, drawing, chartInstance, threshold);
        break;
      case "anchored_volume_profile":
        result = hitTestFixedRangeVolumeProfile(mx, my, points, drawing, chartInstance, threshold);
        break;
    }

    // 4. SCAR-157 FIX: Filtre de Rejet Post-Délégation (Isomorphisme Visuel)
    // Si le délégué retourne un hit de type "shape" (intérieur) mais que le fond est désactivé,
    // on annule le hit SAUF si le clic est légitimement sur la bordure visible.
    if (result.isHit && result.hitType === "shape" && !fillEnabled) {
      let onBorder = false;

      if (type === "sector" && points.length >= 2) {
        // Pour le secteur, la bordure est l'arc + les deux rayons
        const radius = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
        const distToCenter = distanceBetweenPoints(mx, my, points[0].x, points[0].y);
        
        // Vérification de l'arc
        if (Math.abs(distToCenter - radius) < threshold) onBorder = true;
        // Vérification du rayon 1
        if (distancePointToSegment(mx, my, points[0].x, points[0].y, points[1].x, points[1].y) < threshold) onBorder = true;
        // Vérification du rayon 2
        if (points[2] && distancePointToSegment(mx, my, points[0].x, points[0].y, points[2].x, points[2].y) < threshold) onBorder = true;
      } 
      else if (type === "position_forecast") {
        // Position Forecast hit-test already samples the rendered Bézier curve.
        // If delegated hitType is "shape", it means we are on-curve and must keep selection.
        onBorder = true;
      }
      else if (type === "ghost_feed" || type === "bar_pattern") {
        // Pour les chemins, la bordure est la ligne reliant les points
        for (let i = 0; i < points.length - 1; i++) {
          if (distancePointToSegment(mx, my, points[i].x, points[i].y, points[i + 1].x, points[i + 1].y) < threshold) {
            onBorder = true;
            break;
          }
        }
      } 
      else if (type === "long_position" || type === "short_position") {
        // Pour les positions, les bordures spécifiques renvoient déjà "zone_tp", "zone_sl" ou "width_resize".
        // Si le délégué renvoie "shape", c'est qu'on est strictement à l'intérieur des boîtes.
        // Donc si le fond est désactivé, on ne peut pas cliquer à l'intérieur.
        onBorder = false;
      } 
      else {
        // Fallback de sécurité pour les outils non répertoriés
        onBorder = true;
      }

      if (!onBorder) {
        return { isHit: false, hitType: null };
      }
    }

    return result;
  }
}
