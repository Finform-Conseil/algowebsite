import { useEffect, type DependencyList, type RefObject } from "react";
import type { EChartsCoreOption } from "echarts/core";
import { disposeSidebarChart, loadSidebarECharts, type SidebarEChartsRuntime } from "./sidebarEChartsRuntime";

type SidebarChartInstance = ReturnType<SidebarEChartsRuntime["init"]>;

interface UseSidebarChartOptions {
  chartRef: RefObject<HTMLDivElement | null>;
  dependencies: DependencyList;
  enabled: boolean;
  render: (
    chart: SidebarChartInstance,
    echarts: SidebarEChartsRuntime,
    dom: HTMLDivElement,
  ) => EChartsCoreOption | null | undefined | void;
  setOptionOptions?: Parameters<SidebarChartInstance["setOption"]>[1];
}

const MIN_CHART_DIMENSION_PX = 16;

const isSidebarChartDrawable = (dom: HTMLDivElement): boolean => {
  if (!dom.isConnected) return false;
  const rect = dom.getBoundingClientRect();
  return rect.width >= MIN_CHART_DIMENSION_PX && rect.height >= MIN_CHART_DIMENSION_PX;
};

const resizeAfterPaint = (chart: SidebarChartInstance, canResize: () => boolean): void => {
  chart.resize();
  window.requestAnimationFrame(() => {
    if (canResize()) chart.resize();
  });
};

export function useSidebarChart({
  chartRef,
  dependencies,
  enabled,
  render,
  setOptionOptions,
}: UseSidebarChartOptions): void {
  useEffect(() => {
    const dom = chartRef.current;
    if (!enabled || !dom) return;

    // [TENOR 2026 SRE FIX — ECHARTS SIDEBAR LIFECYCLE RACE CONDITION]
    // Because loadSidebarECharts is asynchronous (lazy-loads chunk files), a rapid sequence
    // of render states (e.g. skeleton-load -> ready -> tab switch -> ticker change) causes
    // cleanups to execute out-of-order relative to the async init callbacks.
    // Result: the previous cleanup's `.dispose()` would fire AFTER a new render cycle's
    // `.init()`, destroying the newly created canvas and leaving it blank/invisible.
    //
    // FIX: Assign a unique __chartSessionId to the DOM node for each effect cycle.
    // Both draw() and the cleanup callback only proceed if the current session ID matches.
    const targetDom = dom as HTMLDivElement & { __chartSessionId?: number };
    const domSessionId = Math.random();
    targetDom.__chartSessionId = domSessionId;

    let chart: SidebarChartInstance | null = null;
    let isDisposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let frameId: number | null = null;

    const scheduleDraw = () => {
      if (isDisposed || frameId !== null || targetDom.__chartSessionId !== domSessionId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        void draw();
      });
    };

    const draw = async () => {
      if (isDisposed || targetDom.__chartSessionId !== domSessionId || !isSidebarChartDrawable(dom)) return;

      const echarts = await loadSidebarECharts();
      if (isDisposed || targetDom.__chartSessionId !== domSessionId || !isSidebarChartDrawable(dom)) return;

      chart = echarts.getInstanceByDom(dom) ?? echarts.init(dom);
      const option = render(chart, echarts, dom);

      if (option && !isDisposed && targetDom.__chartSessionId === domSessionId && dom.isConnected) {
        chart.setOption(option, setOptionOptions);
        resizeAfterPaint(chart, () => !isDisposed && targetDom.__chartSessionId === domSessionId && dom.isConnected);
      }
    };

    if (typeof ResizeObserver === "function") {
      resizeObserver = new ResizeObserver(() => {
        if (chart) resizeAfterPaint(chart, () => !isDisposed && targetDom.__chartSessionId === domSessionId && dom.isConnected);
        scheduleDraw();
      });
      resizeObserver.observe(dom);
    }

    if (typeof IntersectionObserver === "function") {
      intersectionObserver = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) scheduleDraw();
      }, { threshold: 0.01 });
      intersectionObserver.observe(dom);
    } else {
      scheduleDraw();
    }

    scheduleDraw();
    window.addEventListener("resize", scheduleDraw);

    return () => {
      isDisposed = true;
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", scheduleDraw);
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();

      // Only dispose the chart if no new effect cycle has taken ownership of this DOM node
      if (targetDom.__chartSessionId === domSessionId) {
        delete targetDom.__chartSessionId;
        void loadSidebarECharts().then((echarts) => {
          if (!targetDom.__chartSessionId) {
            const chartToDispose = echarts.getInstanceByDom(dom);
            if (chartToDispose) chartToDispose.dispose();
          }
        });
      }
    };
    // The caller owns the dependency list so chart rebuilds stay explicit at each callsite.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartRef, enabled, ...dependencies]);
}
