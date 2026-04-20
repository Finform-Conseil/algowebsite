import { useLayoutEffect, useRef, useEffect } from 'react';
import * as echarts from 'echarts/core';

const MAIN_GRID_LEFT = 15;

// [TENOR 2026] Ajout des modes "magic" et "eraser" pour la parité TradingView
export type CursorMode = "arrow" | "arrow-tooltip" | "cross" | "cross-tooltip" | "dot" | "demonstration" | "magic" | "eraser";

export type CandleData = {
  time?: string | number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
} | (string | number)[];

interface UseCursorRendererProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLElement | null>;
  mode: CursorMode;
  chartRef: React.RefObject<echarts.ECharts>;
  chartData: CandleData[];
}

// ============================================================================
// [TENOR 2026 SRE] MOTEUR PHYSIQUE DE PARTICULES (OBJECT POOL PATTERN)
// ============================================================================
// Pour garantir 60 FPS et éviter les saccades du Garbage Collector (GC Stuttering),
// nous pré-allouons un tableau fixe de particules. Zéro allocation mémoire pendant le rendu.
const MAX_PARTICLES = 150;
const GRAVITY = 0.4;
const EMOJIS = ['💩', '💸', '🌟', '🐎', '🍬', '🎄', '🎉', '⛄', '🎁', '🎯'];

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
  life: number;
  maxLife: number;
  emoji: string;
  size: number;
}

/**
 * High-performance cursor renderer hook for TechnicalAnalysis chart.
 *
 * Renders custom cursor overlays (crosshair, dot, presentation mode, magic wand, eraser) on a canvas layer.
 * Uses ResizeObserver for robust canvas sizing and requestAnimationFrame for smooth rendering.
 * Now supports "Pro" Order Flow style tooltips with visual candles and a Physics Engine.
 */
export const useCursorRenderer = ({
  canvasRef,
  containerRef,
  mode,
  chartRef,
  chartData
}: UseCursorRendererProps) => {
  const mouseRef = useRef<{ x: number, y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const isReadyRef = useRef(false);

  // --- INITIALISATION DE L'OBJECT POOL (Ring Buffer) ---
  const particlesRef = useRef<Particle[]>(
    Array.from({ length: MAX_PARTICLES }, () => ({
      active: false, x: 0, y: 0, vx: 0, vy: 0, angle: 0, vAngle: 0, life: 0, maxLife: 1, emoji: '', size: 12
    }))
  );
  const particleIndexRef = useRef(0);

  // --- GESTIONNAIRE D'ÉVÉNEMENTS SOURIS & PARTICULES ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // [TENOR 2026 FIX] SCAR-152: Strict PointerEvents Migration
    // Replaces MouseEvent to guarantee unified Touch/Stylus/Mouse support.
    // Eliminates "Ghost Clicks" and ensures 120Hz polling on iPad Pro.
    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        mouseRef.current = { x, y };
      } else {
        mouseRef.current = null;
      }
    };

    // [TENOR 2026] Spawn de particules au clic (Mode Magic)
    const handlePointerDown = (e: PointerEvent) => {
      if (mode !== 'magic') return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        // Spawn 10 à 20 particules par clic
        const count = Math.floor(10 + Math.random() * 10);
        const particles = particlesRef.current;

        for (let i = 0; i < count; i++) {
          const idx = particleIndexRef.current;
          const p = particles[idx];

          // Réutilisation de l'objet (Zéro allocation)
          p.active = true;
          p.x = x;
          p.y = y;
          p.vx = (Math.random() - 0.5) * 10; // Dispersion horizontale
          p.vy = (Math.random() - 1) * 12 - 2; // Explosion vers le haut
          p.angle = Math.random() * Math.PI * 2;
          p.vAngle = (Math.random() - 0.5) * 0.4;
          p.maxLife = 50 + Math.random() * 40; // Durée de vie en frames
          p.life = p.maxLife;
          p.emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
          p.size = 18 + Math.random() * 16;

          // Avance le pointeur du Ring Buffer
          particleIndexRef.current = (idx + 1) % MAX_PARTICLES;
        }
      }
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [containerRef, mode]); // Re-bind si le mode change

  // useLayoutEffect ensures canvas is sized BEFORE paint, preventing flicker
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // === CANVAS SIZE SYNCHRONIZATION ===
    // Critical: Canvas internal size must match CSS display size
    const syncCanvasSize = (): boolean => {
      const rect = container.getBoundingClientRect();
      
      // GUARD: Don't initialize if container hasn't been laid out yet
      if (rect.width < 10 || rect.height < 10) {
        isReadyRef.current = false;
        return false;
      }

      const displayWidth = Math.floor(rect.width);
      const displayHeight = Math.floor(rect.height);

      // Only resize if dimensions actually changed
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }
      
      isReadyRef.current = true;
      return true;
    };

    syncCanvasSize();

    // === RESIZE OBSERVER ===
    const resizeObserver = new ResizeObserver(() => {
      syncCanvasSize();
    });
    resizeObserver.observe(container);

    // === RENDER LOOP ===

    // Helper: Draw Axis Labels (The TradingView-style "Ribbons")
    const drawAxisLabels = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      bg: string,
      textColor: string
    ) => {
      const padding = { h: 8, v: 4 };
      const cornerRadius = 4;
      const fontSize = 11;
      ctx.font = `${fontSize}px Inter, system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // [TENOR 2026 FIX] Sync with useEChartsRenderer.ts grid layout
      const gridLeft = MAIN_GRID_LEFT;
      const gridBottom = 26; // Height of the bottom X-axis area

      // X-AXIS (DATE) - Positioned at the BOTTOM
      let dateText = "";
      if (chartRef.current && !chartRef.current.isDisposed() && chartData.length > 0) {
        try {
          const pointInData = chartRef.current.convertFromPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [x, y]);
          if (pointInData && Array.isArray(pointInData)) {
            const dataIndex = Math.round(pointInData[0]);
            // [TENOR 2026 FIX] Safe clamping to prevent out-of-bounds errors
            const safeIndex = Math.max(0, Math.min(chartData.length - 1, dataIndex));
            const candle = chartData[safeIndex];
            
            if (candle) {
              // Support for object or array data format
              let time: string | number | undefined;
              if (Array.isArray(candle)) {
                time = candle[0];
              } else {
                time = candle.time;
              }

              if (time) {
                const date = new Date(time);
                // [TENOR 2026 FIX] TradingView exact format: "Fri 20 Feb 2026 18:30"
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const day = date.getDate().toString().padStart(2, '0');
                const month = date.toLocaleDateString('en-US', { month: 'short' });
                const year = date.getFullYear().toString(); // Full 4-digit year
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                
                const timeStr = typeof time === 'string' ? time : date.toISOString();
                const hasTime = timeStr.includes("T") && !timeStr.includes("T00:00:00");

                if (hasTime) {
                  dateText = `${dayName} ${day} ${month} ${year} ${hours}:${minutes}`;
                } else {
                  dateText = `${dayName} ${day} ${month} ${year}`;
                }
              }
            }
          }
        } catch {
          // coordinate system might not be ready yet
        }
      }
      
      if (!dateText) {
        const now = new Date();
        dateText = `${now.toLocaleDateString('en-US', { weekday: 'short' })} ${now.getDate().toString().padStart(2, '0')} ${now.toLocaleDateString('en-US', { month: 'short' })} ${now.getFullYear()}`;
      }

      const dateMetrics = ctx.measureText(dateText);
      const dateLabelWidth = dateMetrics.width + padding.h * 2;
      const dateLabelHeight = gridBottom;
      const dateLabelX = Math.max(gridLeft, Math.min(x - dateLabelWidth / 2, w - dateLabelWidth));
      const dateLabelY = h - gridBottom;

      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.roundRect(dateLabelX, dateLabelY, dateLabelWidth, dateLabelHeight, cornerRadius);
      ctx.fill();
      ctx.fillStyle = textColor;
      ctx.fillText(dateText, dateLabelX + dateLabelWidth / 2, dateLabelY + dateLabelHeight / 2);
    };

    /**
     * DRAW PRO TOOLTIP (Exocharts Style)
     * Renders a sophisticated tooltip with:
     * - Visual Candle (Big graphical representation)
     * - Detailed OHLC + Volume
     * - Metrics: Range, Body, Wicks
     */
    const drawProTooltip = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      chart: echarts.ECharts,
      data: CandleData[]
    ) => {
      // 1. Get Candle Data
      if (chart.isDisposed()) return;
      
      let pointInData;
      try {
        pointInData = chart.convertFromPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [x, y]);
      } catch {
        return;
      }
      
      if (!pointInData || !Array.isArray(pointInData)) return;
      
      const dataIndex = Math.round(pointInData[0]);
      if (dataIndex < 0 || dataIndex >= data.length) return;
      
      const candle = data[dataIndex];
      let dOpen, dHigh, dLow, dClose, dVol;

      // Handle data formats
      if (Array.isArray(candle)) {
        dOpen = Number(candle[1]);
        dClose = Number(candle[2]);
        dLow = Number(candle[3]);
        dHigh = Number(candle[4]);
        dVol = Number(candle[5] || 0);
      } else if (candle && typeof candle === 'object') {
        dOpen = Number(candle.open ?? 0);
        dHigh = Number(candle.high ?? 0);
        dLow = Number(candle.low ?? 0);
        dClose = Number(candle.close ?? 0);
        dVol = Number(candle.volume ?? 0);
      } else {
        return;
      }

      // 2. Calculations
      const isBullish = dClose >= dOpen;
      const colorBull = '#00da3c'; // Green
      const colorBear = '#ce4243'; // Red
      const candleColor = isBullish ? colorBull : colorBear;
      
      const metrics = {
        rng: (dHigh - dLow).toFixed(2),
        body: Math.abs(dOpen - dClose).toFixed(2),
        upW: (dHigh - Math.max(dOpen, dClose)).toFixed(2),
        dnW: (Math.min(dOpen, dClose) - dLow).toFixed(2),
      };

      // 3. Layout Configuration
      const boxWidth = 240;
      const boxHeight = 160;
      const padding = 12;
      const visualCandleWidth = 30; // Width of the graphical candle area
      const offset = 20;
      
      // Smart Positioning (Flip if near edges)
      let boxX = x + offset;
      let boxY = y + offset;
      
      if (boxX + boxWidth > w) boxX = x - offset - boxWidth;
      if (boxY + boxHeight > h) boxY = y - offset - boxHeight;

      // 4. Draw Background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)'; // Slate-900 transparent
      ctx.strokeStyle = '#334155'; // Slate-700 border
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.beginPath();
      // Remove rounded corners for "Pro" feel, Exocharts uses sharp corners often,
      // but slight radius looks better in modern UI. Keeping radius small (2px).
      ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 2);
      ctx.fill();
      ctx.stroke();

      // 5. Draw Visual Candle (Left Side)
      const candleAreaX = boxX + padding;
      const candleAreaY = boxY + padding;
      const candleAreaH = boxHeight - padding * 2;
      const candleAreaW = visualCandleWidth;
      
      // Visual ratios
      const rng = dHigh - dLow || 1; // Avoid divide by zero
      const bodyH = Math.abs(dOpen - dClose);
      const wickTopH = dHigh - Math.max(dOpen, dClose);
      
      // Scale factor to fit inside the candle area
      const pxPerUnit = candleAreaH / (rng * 1.2); // 1.2 for breathing room
      
      const visualBodyH = Math.max(1, bodyH * pxPerUnit); // Min 1px
      const visualWickTopH = wickTopH * pxPerUnit;
      
      // Center vertically in the area
      const startY = candleAreaY + (candleAreaH - (rng * pxPerUnit)) / 2;
      const topY = startY;
      const bodyTopY = topY + visualWickTopH;

      ctx.fillStyle = candleColor;
      ctx.strokeStyle = candleColor;
      
      // Draw Wicks (Center line)
      const centerX = candleAreaX + candleAreaW / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, startY);
      ctx.lineTo(centerX, startY + (rng * pxPerUnit));
      ctx.lineWidth = 2; // Thicker wicks for visual impact
      ctx.stroke();
      
      // Draw Body (Rectangle)
      const bodyW = 16;
      ctx.beginPath();
      ctx.fillRect(centerX - bodyW / 2, bodyTopY, bodyW, visualBodyH);

      // 6. Draw Text Data (Right Side)
      const textStartX = boxX + padding + candleAreaW + padding;
      const col1X = textStartX;
      const col2X = textStartX + 90;
      const lineHeight = 20;
      
      const labelColor = '#94a3b8'; // Slate-400
      const valColor = '#f8fafc'; // Slate-50
      
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.textBaseline = 'middle';

      // Column 1: OHLCV
      const col1Data = [
        { L: "Open", V: dOpen.toFixed(2) },
        { L: "High", V: dHigh.toFixed(2) },
        { L: "Low", V: dLow.toFixed(2) },
        { L: "Close", V: dClose.toFixed(2) },
        { L: "Vol", V: (dVol / 1000).toFixed(1) + 'k' }, // Format volume K
      ];

      col1Data.forEach((item, i) => {
        const yPos = candleAreaY + 10 + (i * lineHeight);
        // Label
        ctx.textAlign = 'left';
        ctx.fillStyle = labelColor;
        ctx.fillText(item.L, col1X, yPos);
        // Value
        ctx.textAlign = 'right';
        ctx.fillStyle = i === 3 ? candleColor : valColor; // Color close price
        ctx.fillText(item.V, col1X + 80, yPos);
      });

      // Column 2: Stats
      const col2Data = [
        { L: "Rng", V: metrics.rng },
        { L: "Body", V: metrics.body },
        { L: "UpW", V: metrics.upW },
        { L: "DnW", V: metrics.dnW },
        // Delta/OI placeholders removed as per plan
      ];

      col2Data.forEach((item, i) => {
        const yPos = candleAreaY + 10 + (i * lineHeight);
        // Label
        ctx.textAlign = 'left';
        ctx.fillStyle = labelColor;
        ctx.fillText(item.L, col2X, yPos);
        // Value
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fb923c'; // Orange for stats (like user screenshot)
        ctx.fillText(item.V, col2X + 80, yPos);
      });
    };

    // === RENDER LOOP ===
    const render = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx || !isReadyRef.current) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ============================================================================
      // [TENOR 2026] MOTEUR PHYSIQUE DES PARTICULES (Indépendant de la souris)
      // ============================================================================
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p.active) continue;

        // Intégration d'Euler (Physique)
        p.vy += GRAVITY;
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.vAngle;
        p.life--;

        if (p.life <= 0) {
          p.active = false;
          continue;
        }

        // Rendu de la particule
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        // Opacité dégressive pour une disparition en douceur
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.font = `${p.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, 0, 0);
        ctx.restore();
      }

      // ============================================================================
      // RENDU DES CURSEURS SPÉCIFIQUES (Dépendant de la souris)
      // ============================================================================
      if (mouseRef.current) {
        const { x, y } = mouseRef.current;
        const w = canvas.width;
        const h = canvas.height;

        // --- COLORS ---
        const axisLabelBg = '#1e222d';
        const axisLabelText = '#ffffff'; // [TENOR 2026 FIX] Pure white for TradingView fidelity
        const accentCyan = '#29b6f6';

        const chart = chartRef.current;

        // --- MODE: CROSS & CROSS-TOOLTIP ---
        if (mode === 'cross' || mode === 'cross-tooltip') {
          ctx.save();
          ctx.beginPath();
          ctx.setLineDash([4, 3]);
          ctx.strokeStyle = 'rgba(108, 117, 125, 0.8)';
          ctx.lineWidth = 1;
          ctx.moveTo(Math.floor(x) + 0.5, 0);
          ctx.lineTo(Math.floor(x) + 0.5, h);
          ctx.moveTo(0, Math.floor(y) + 0.5);
          ctx.lineTo(w, Math.floor(y) + 0.5);
          ctx.stroke();
          ctx.restore();

          // [TENOR 2026 FIX] ALWAYS draw axis labels (ribbons) for crosshair modes
          drawAxisLabels(ctx, x, y, w, h, axisLabelBg, axisLabelText);

          if (mode === 'cross-tooltip') {
            if (chart && chartData.length > 0) {
              drawProTooltip(ctx, x, y, w, h, chart, chartData);
            }
          }
        }

        // --- MODE: ARROW-TOOLTIP ---
        if (mode === 'arrow-tooltip') {
          drawAxisLabels(ctx, x, y, w, h, axisLabelBg, axisLabelText);
          if (chart && chartData.length > 0) {
            drawProTooltip(ctx, x, y, w, h, chart, chartData);
          }
        }

        // --- MODE: DOT ---
        if (mode === 'dot') {
          ctx.save();
          ctx.shadowBlur = 4;
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.beginPath();
          ctx.fillStyle = '#ffffff';
          ctx.arc(x, y, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }

        // --- MODE: DEMONSTRATION ---
        if (mode === 'demonstration') {
          ctx.save();
          const pulseSize = 15 + Math.sin(Date.now() / 200) * 3;
          ctx.beginPath();
          ctx.fillStyle = 'rgba(41, 182, 246, 0.2)';
          ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.beginPath();
          ctx.fillStyle = accentCyan;
          ctx.shadowBlur = 10;
          ctx.shadowColor = accentCyan;
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // --- MODE: MAGIC WAND ---
        if (mode === 'magic') {
          ctx.save();
          ctx.font = '22px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          // Décalage pour que l'étoile de la baguette soit sur la pointe du curseur natif
          ctx.fillText('🪄', x + 12, y - 12);
          ctx.restore();
        }

        // --- MODE: ERASER ---
        if (mode === 'eraser') {
          // 1. Draw crosshair (TradingView keeps the crosshair for the eraser)
          ctx.save();
          ctx.beginPath();
          ctx.setLineDash([4, 3]);
          ctx.strokeStyle = 'rgba(108, 117, 125, 0.8)';
          ctx.lineWidth = 1;
          ctx.moveTo(Math.floor(x) + 0.5, 0);
          ctx.lineTo(Math.floor(x) + 0.5, h);
          ctx.moveTo(0, Math.floor(y) + 0.5);
          ctx.lineTo(w, Math.floor(y) + 0.5);
          ctx.stroke();
          ctx.restore();

          // [TENOR 2026 FIX] TradingView Parity Eraser Icon
          ctx.save();
          // Offset the eraser icon to the bottom right of the cursor
          ctx.translate(x + 16, y + 16);
          ctx.rotate(-Math.PI / 4); // Tilt 45 degrees
          
          // Shadow for depth
          ctx.shadowColor = 'rgba(0,0,0,0.3)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetY = 2;

          // Draw Eraser Body
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(-6, -10, 12, 20, 2);
          } else {
            ctx.rect(-6, -10, 12, 20);
          }
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          
          ctx.shadowColor = 'transparent'; // turn off shadow for stroke
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#131722';
          ctx.stroke();

          // Draw Eraser Top (Dark sleeve)
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(-6, -10, 12, 8, [2, 2, 0, 0]);
          } else {
            ctx.rect(-6, -10, 12, 8);
          }
          ctx.fillStyle = '#4b5563'; // Slate 600
          ctx.fill();
          ctx.stroke();

          ctx.restore();
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    // CLEANUP
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
    };
  }, [canvasRef, containerRef, mode, chartRef, chartData]);
};
