export type SidebarEChartsRuntime = typeof import("echarts/core");

let runtimePromise: Promise<SidebarEChartsRuntime> | null = null;

export const loadSidebarECharts = async (): Promise<SidebarEChartsRuntime> => {
  if (!runtimePromise) {
    runtimePromise = Promise.all([
      import("echarts/core"),
      import("echarts/renderers"),
      import("echarts/components"),
      import("echarts/charts"),
    ]).then(([echarts, renderers, components, charts]) => {
      echarts.use([
        renderers.CanvasRenderer,
        charts.BarChart,
        charts.GaugeChart,
        charts.LineChart,
        charts.PieChart,
        charts.ScatterChart,
        components.GraphicComponent,
        components.GridComponent,
        components.LegendComponent,
        components.TitleComponent,
        components.TooltipComponent,
      ]);

      return echarts;
    });
  }

  return runtimePromise;
};

export const disposeSidebarChart = (dom: HTMLDivElement | null): void => {
  if (!dom || !runtimePromise) return;

  void runtimePromise.then((echarts) => {
    const chart = echarts.getInstanceByDom(dom);
    if (chart) chart.dispose();
  });
};
