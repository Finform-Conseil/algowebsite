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

    let chart: SidebarChartInstance | null = null;
    let isDisposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let frameId: number | null = null;

    const scheduleDraw = () => {
      if (isDisposed || frameId !== null) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        void draw();
      });
    };

    const draw = async () => {
      if (isDisposed || !isSidebarChartDrawable(dom)) return;

      const echarts = await loadSidebarECharts();
      if (isDisposed || !isSidebarChartDrawable(dom)) return;

      chart = echarts.getInstanceByDom(dom) ?? echarts.init(dom);
      const option = render(chart, echarts, dom);

      if (option && !isDisposed && dom.isConnected) {
        chart.setOption(option, setOptionOptions);
        resizeAfterPaint(chart, () => !isDisposed && dom.isConnected);
      }
    };

    if (typeof ResizeObserver === "function") {
      resizeObserver = new ResizeObserver(() => {
        if (chart) resizeAfterPaint(chart, () => !isDisposed && dom.isConnected);
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
      disposeSidebarChart(dom);
    };
    // The caller owns the dependency list so chart rebuilds stay explicit at each callsite.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartRef, enabled, ...dependencies]);
}
