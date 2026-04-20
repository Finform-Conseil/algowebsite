// src/core/presentation/components/pages/Widget/TechnicalAnalysis/lib/DrawingRenderer.ts
import { AllToolType, Drawing, DrawingHelpers, DrawingPoint, DrawingStyle, HitTestResult } from "../config/TechnicalAnalysisTypes";
import { ChartDataPoint } from "./Indicators/TechnicalIndicators";
import { drawingStrategyRegistry } from "./strategies/DrawingStrategyRegistry";
import type { EChartsType } from "echarts/core";
import { sanitizeCanvasText } from "./utils/sanitize";

// ============================================================================
// DRAWING RENDERER CLASS (HDR 2026 - ZERO-ALLOCATION ENGINE)
// ============================================================================
export class DrawingRenderer {
  private ctx: CanvasRenderingContext2D;
  
  // [TENOR 2026 SRE] OBJECT POOLING & ZERO-ALLOCATION BUFFERS
  // These buffers eliminate Garbage Collector (GC) stuttering by preventing
  // object creation during the 60 FPS requestAnimationFrame loop.
  private pointPool: { x: number; y: number }[] = [];
  private pixelBuffer: { x: number; y: number }[] = [];
  private dataBuffer: DrawingPoint[] = [];
  private cachedHelpers: DrawingHelpers;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;

    // Pre-allocate a reasonable pool size to avoid initial growth stutter
    for (let i = 0; i < 200; i++) {
      this.pointPool.push({ x: 0, y: 0 });
    }

    // Cache the helpers object and bind methods ONCE.
    // This prevents creating 5 new closures per drawing per frame.
    this.cachedHelpers = {
      drawSegment: this.drawSegment.bind(this),
      drawHandle: this.drawHandle.bind(this),
      drawTextOnLine: this.drawTextOnLine.bind(this),
      applyStyle: this.applyStyle.bind(this),
      applyLineDash: this.applyLineDash.bind(this),
      ctx: this.ctx,
      logicalWidth: 0,
      logicalHeight: 0,
    };
  }

  /**
   * Main render loop - clears canvas and draws all items
   * [TENOR 2026] Optimized for Zero-Allocation
   */
  public render(
    drawings: Drawing[],
    currentDrawing: Drawing | null,
    chart: EChartsType,
    mousePos: { x: number; y: number } | null = null,
    _activeTool: AllToolType = null,
    selectedDrawingId: string | null = null,
    gridRect: { x: number; y: number; width: number; height: number } | null = null,
    chartData: ChartDataPoint[] = []
  ) {
    if (!chart || chart.isDisposed()) return;

    const dpr = window.devicePixelRatio || 1;

    // 1. Reset & Clear (Use full canvas size)
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // 2. Apply Unified Scale
    this.ctx.scale(dpr, dpr);

    // Update cached helpers context and dimensions
    this.cachedHelpers.ctx = this.ctx;
    this.cachedHelpers.logicalWidth = this.ctx.canvas.width / dpr;
    this.cachedHelpers.logicalHeight = this.ctx.canvas.height / dpr;

    // [GRID CLIP] Shield axes and legend
    if (gridRect) {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(gridRect.x, gridRect.y, gridRect.width, gridRect.height);
      this.ctx.clip();
    }

    // 3. Render saved drawings
    for (let i = 0; i < drawings.length; i++) {
      const drawing = drawings[i];
      if (drawing.hidden) continue;
      try {
        this.drawItem(drawing, chart, false, null, drawing.id === selectedDrawingId, chartData);
      } catch (err) {
        console.error(`[TENOR SRE] Render Error for tool ${drawing.type}:`, err);
      }
    }

    // 4. Render current drawing in progress (preview mode)
    if (currentDrawing) {
      try {
        this.drawItem(currentDrawing, chart, true, mousePos, true, chartData);
      } catch (err) {
        console.error(`[TENOR SRE] Preview Render Error:`, err);
      }
    }

    if (gridRect) {
      this.ctx.restore();
    }
  }

  /**
   * Orchestrates hit-testing for a collection of drawings.
   * Delegates to individual strategies for high-fidelity detection.
   */
  public hitTest(
    mx: number,
    my: number,
    drawing: Drawing,
    chart: EChartsType,
    threshold: number = 20
  ): HitTestResult {
    if (drawing.hidden) {
      return { isHit: false, hitType: null };
    }

    const strategy = drawingStrategyRegistry.getStrategy(drawing.type);
    if (!strategy) {
      return { isHit: false, hitType: null };
    }

    // Note: Pixel conversion for hitTest is handled inside the strategies
    // to allow them to optimize their own hit-testing logic.
    return strategy.hitTest(mx, my, drawing, chart, threshold);
  }

  /**
   * Convert pixel coordinates to data coordinates
   * Used only during preview (mouse move), so allocation is negligible.
   */
  private fromPixel(
    pos: { x: number; y: number },
    chart: EChartsType,
    seriesIndex: number = 0
  ): DrawingPoint | null {
    if (!chart || chart.isDisposed()) return null;
    const point = chart.convertFromPixel({ seriesIndex }, [pos.x, pos.y]);
    if (point && point.length >= 2) {
      return { time: point[0] as string | number, value: point[1] as number };
    }
    return null;
  }

  /**
   * Apply line dash configuration to context.
   */
  private applyLineDash(lineStyle: "solid" | "dashed" | "dotted", lineWidth: number) {
    this.ctx.lineWidth = lineWidth;
    this.ctx.setLineDash([]);
    if (lineStyle === "dashed") this.ctx.setLineDash([10, 5]);
    else if (lineStyle === "dotted") this.ctx.setLineDash([2, 5]);
  }

  /**
   * Apply line style to context
   */
  private applyStyle(style: DrawingStyle, isPreview: boolean) {
    this.ctx.strokeStyle = style.color;
    this.applyLineDash(style.lineStyle || "solid", style.lineWidth || 2);
    const lineOpacity = style.lineOpacity ?? 1;
    if (isPreview) this.ctx.globalAlpha = lineOpacity * 0.7;
    else this.ctx.globalAlpha = lineOpacity;
  }

  /**
   * Draw a single drawing item using Object Pooling
   */
  private drawItem(
    drawing: Drawing,
    chart: EChartsType,
    isPreview: boolean,
    mousePos: { x: number; y: number } | null = null,
    isSelected: boolean = false,
    chartData: ChartDataPoint[] = []
  ) {
    const { points, style, type } = drawing;
    if (points.length < 1 && !mousePos) return;

    // [TENOR 2026 SRE] Zero-Allocation Buffer Reset
    // Mutating length to 0 clears the array without reallocating memory.
    this.pixelBuffer.length = 0;
    this.dataBuffer.length = 0;

    let validCount = 0;

    // Convert points to pixels using the Object Pool
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const pos = chart.convertToPixel({ seriesIndex: 0 }, [p.time, p.value]);
      
      if (pos) {
        // Retrieve or expand pool
        let pooledPt = this.pointPool[validCount];
        if (!pooledPt) {
          pooledPt = { x: pos[0], y: pos[1] };
          this.pointPool.push(pooledPt);
        } else {
          pooledPt.x = pos[0];
          pooledPt.y = pos[1];
        }
        
        this.pixelBuffer.push(pooledPt);
        this.dataBuffer.push(p);
        validCount++;
      }
    }

    // [VIRTUAL PREVIEW] Zero-Lag Elastic-Band
    if (isPreview && mousePos) {
      let previewPix = mousePos;

      // [TENOR 2026] Sector HDR Parity: 180° Cap & Radial Isometry (Preview Mode)
      if (type === 'sector' && this.pixelBuffer.length === 2) {
        const p1 = this.pixelBuffer[0]; // Center
        const p2 = this.pixelBuffer[1]; // Radius anchor
        const radius = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        const angleToMouse = Math.atan2(mousePos.y - p1.y, mousePos.x - p1.x);
        
        previewPix = {
          x: p1.x + radius * Math.cos(angleToMouse),
          y: p1.y + radius * Math.sin(angleToMouse)
        };
      }

      // Add preview point to buffers
      let pooledPreview = this.pointPool[validCount];
      if (!pooledPreview) {
        pooledPreview = { x: previewPix.x, y: previewPix.y };
        this.pointPool.push(pooledPreview);
      } else {
        pooledPreview.x = previewPix.x;
        pooledPreview.y = previewPix.y;
      }
      
      this.pixelBuffer.push(pooledPreview);
      
      const virtualDataPoint = this.fromPixel(previewPix, chart);
      if (virtualDataPoint) {
        this.dataBuffer.push(virtualDataPoint);
      }
    }

    if (this.pixelBuffer.length === 0) return;

    this.ctx.save();
    this.applyStyle(style, isPreview);

    // [TENOR 2026] StrategyRegistry delegation
    const strategy = drawingStrategyRegistry.getStrategy(type);
    if (strategy) {
      // Pass the shared buffers. Strategies are synchronous and will not store references.
      strategy.render(
        this.pixelBuffer,
        this.dataBuffer,
        drawing,
        chart,
        isSelected,
        this.cachedHelpers,
        chartData
      );
    } else {
      // Fallback for unknown tools
      console.warn(`[DrawingRenderer] No strategy found for tool: ${type}`);
    }

    this.ctx.restore();
  }

  // ============================================================================
  // HELPERS (Used by strategies via cachedHelpers)
  // ============================================================================

  private drawSegment(p1: { x: number; y: number }, p2: { x: number; y: number }) {
    this.ctx.beginPath();
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.lineTo(p2.x, p2.y);
    this.ctx.stroke();
  }

  private drawHandle(
    p: { x: number; y: number },
    color: string = "#fff",
    radius: number = 4,
    shape: 'circle' | 'square' = 'circle'
  ) {
    this.ctx.save();
    this.ctx.beginPath();
    if (shape === 'square') {
      const size = radius * 2;
      this.ctx.rect(p.x - radius, p.y - radius, size, size);
    } else {
      this.ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    }
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.strokeStyle = "#2962ff";
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.restore();
  }

  /**
   * [TENOR 2026] Security Fix: Applied sanitizeCanvasText to prevent XSS in Canvas.
   */
  private drawTextOnLine(p1: { x: number; y: number }, p2: { x: number; y: number }, drawing: Drawing) {
    const {
      text,
      textColor,
      fontSize,
      textBold,
      textItalic,
      textOrientation,
      textAlignmentHorizontal,
      textAlignmentVertical,
    } = drawing;

    if (!text || drawing.showText === false) return;

    // [SECURITY SUTURE] Neutralize malicious input before rendering
    const sanitizedText = sanitizeCanvasText(text);

    this.ctx.save();
    const style = textItalic ? "italic " : "";
    const weight = textBold ? "bold " : "";
    const size = fontSize || 14;
    this.ctx.font = `${style}${weight}${size}px Inter, sans-serif`;
    
    // [SNIPER V5.0] Fidelity Fix: Text should default to White for multi-colored tools
    this.ctx.fillStyle = textColor || "#FFFFFF";
    this.ctx.globalAlpha = 1;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);

    let ratio = 0.5;
    if (textAlignmentHorizontal === "left") ratio = 0.1;
    if (textAlignmentHorizontal === "right") ratio = 0.9;

    const isVertical = Math.abs(dx) < 0.1;
    let posX = p1.x + dx * ratio;
    let posY = p1.y + dy * ratio;

    if (isVertical) {
      let vRatio = 0.5;
      if (textAlignmentVertical === "top") vRatio = 0.1;
      if (textAlignmentVertical === "bottom") vRatio = 0.9;
      posX = p1.x;
      posY = p1.y + dy * vRatio;

      this.ctx.translate(posX, posY);
      let sideOffset = 0;
      if (textAlignmentHorizontal === "left") {
        this.ctx.textAlign = "right";
        sideOffset = -10;
      } else if (textAlignmentHorizontal === "right") {
        this.ctx.textAlign = "left";
        sideOffset = 10;
      } else {
        this.ctx.textAlign = "center";
      }

      if (textOrientation === "vertical") {
        this.ctx.rotate(-Math.PI / 2);
      } else if (textOrientation === "aligned") {
        this.ctx.rotate(Math.PI / 2);
      }
      this.ctx.fillText(sanitizedText, sideOffset, 0);
    } else {
      this.ctx.translate(posX, posY);
      if (textOrientation === "aligned") {
        let finalAngle = angle;
        if (finalAngle > Math.PI / 2 || finalAngle < -Math.PI / 2) finalAngle += Math.PI;
        this.ctx.rotate(finalAngle);
      } else if (textOrientation === "vertical") {
        this.ctx.rotate(-Math.PI / 2);
      }

      this.ctx.textAlign = "center";
      let baseline: CanvasTextBaseline = "middle";
      let offsetY = 0;

      if (textAlignmentVertical === "top") {
        baseline = "bottom";
        offsetY = -5;
      } else if (textAlignmentVertical === "bottom") {
        baseline = "top";
        offsetY = 10;
      } else {
        offsetY = -size / 2 - 2;
      }

      this.ctx.textBaseline = baseline;
      this.ctx.fillText(sanitizedText, 0, offsetY);
    }
    this.ctx.restore();
  }
}
// --- EOF ---