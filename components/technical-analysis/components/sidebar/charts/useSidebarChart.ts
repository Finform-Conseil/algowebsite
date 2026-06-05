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

    let isDisposed = false;
    let resizeObserver: ResizeObserver | null = null;

    const draw = async () => {
      const echarts = await loadSidebarECharts();
      if (isDisposed || !dom.isConnected) return;

      const chart = echarts.getInstanceByDom(dom) ?? echarts.init(dom);

      const option = render(chart, echarts, dom);
      if (option && !isDisposed && dom.isConnected) {
        chart.setOption(option, setOptionOptions);
      }

      if (typeof ResizeObserver === "function") {
        resizeObserver?.disconnect();
        resizeObserver = new ResizeObserver(() => chart.resize());
        resizeObserver.observe(dom);
      }
    };

    if (typeof IntersectionObserver !== "function") {
      void draw();
      return () => {
        isDisposed = true;
        resizeObserver?.disconnect();
        disposeSidebarChart(dom);
      };
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        void draw();
      }
    }, { threshold: 0.1 });

    observer.observe(dom);

    return () => {
      isDisposed = true;
      observer.disconnect();
      resizeObserver?.disconnect();
      disposeSidebarChart(dom);
    };
    // The caller owns the dependency list so chart rebuilds stay explicit at each callsite.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartRef, enabled, ...dependencies]);
}
