/**
 * [TENOR 2026] ECharts Type Extensions.
 * This file provides rigorous typing for ECharts internal models and components.
 * It eliminates the need for 'any' when accessing advanced chart features
 * like grid rectangles and coordinate systems.
 * Adheres to PP-0010 (Rigorous Typing).
 */

import type { ECharts, EChartsOption } from 'echarts';

/**
 * Represents the internal model of an ECharts component (e.g., Grid, Axis).
 */
export interface EChartsComponentModel {
  coordinateSystem?: {
    getRect: () => {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
}

/**
 * Represents the internal ECharts Model manager.
 */
export interface EChartsModel {
  /**
   * Retrieves a component model by type and index.
   * @param type - Component type (e.g., 'grid', 'xAxis')
   * @param index - Component index (default 0)
   */
  getComponent(type: string, index?: number): EChartsComponentModel | undefined;
}

/**
 * Extended ECharts instance providing access to the internal getModel() method.
 * Use this instead of 'any' when performing advanced geometric calculations.
 */
export interface EChartsWithModel extends ECharts {
  /**
   * Accesses the internal model manager of the chart.
   * Note: This is an internal ECharts method, use with caution.
   */
  getModel(): EChartsModel;
}

/**
 * Standardized alias for the ECharts instance type.
 */
export type EChartsInstance = ECharts;

/**
 * Standardized alias for ECharts Option type.
 */
export type EChartsCoreOption = EChartsOption;

// --- EOF ---