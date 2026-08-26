import * as echarts from "echarts/core";
import { BarChart, CandlestickChart, CustomChart, LineChart } from "echarts/charts";
import {
  AxisPointerComponent,
  DataZoomComponent,
  GridComponent,
  MarkLineComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

let layoutEChartsModulesRegistered = false;

/**
 * Multi-layout charts are dynamically mounted and can initialize before the
 * primary chart hook registers its ECharts modules. Register the exact module
 * set owned by the layout renderers so their lifecycle never depends on mount
 * order or on a side effect from another chart.
 */
export const ensureLayoutEChartsModulesRegistered = (): void => {
  if (layoutEChartsModulesRegistered) return;

  echarts.use([
    CanvasRenderer,
    LineChart,
    CandlestickChart,
    BarChart,
    CustomChart,
    GridComponent,
    TooltipComponent,
    AxisPointerComponent,
    DataZoomComponent,
    MarkLineComponent,
  ]);

  layoutEChartsModulesRegistered = true;
};
