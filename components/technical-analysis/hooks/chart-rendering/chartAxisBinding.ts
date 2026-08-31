export type AxisBindingOption = Record<string, unknown>;

const resolveAxisId = (
  axisOptions: readonly AxisBindingOption[],
  index: unknown,
): string | null => {
  if (typeof index !== "number" || !Number.isInteger(index) || index < 0) return null;
  const axis = axisOptions[index];
  const id = axis?.id;
  return typeof id === "string" && id.length > 0 ? id : null;
};

/**
 * Converts positional Cartesian axis bindings into stable ECharts component ids.
 *
 * ECharts may reorder id-bearing axis components during replaceMerge while it
 * reconciles existing and newly inserted panes. A series that keeps only
 * xAxisIndex/yAxisIndex can then silently bind to a different pane. Resolving the
 * intended axis id before setOption makes the relationship identity-based and
 * independent from the component array order chosen by ECharts.
 */
export const bindSeriesToStableCartesianAxisIds = (
  series: AxisBindingOption,
  xAxisOptions: readonly AxisBindingOption[],
  yAxisOptions: readonly AxisBindingOption[],
): AxisBindingOption => {
  const next = { ...series };
  const xAxisId = resolveAxisId(xAxisOptions, series.xAxisIndex);
  const yAxisId = resolveAxisId(yAxisOptions, series.yAxisIndex);

  if (xAxisId) {
    // `setOption(..., notMerge:false)` merges a series with its previous model by id.
    // Omitting xAxisIndex would therefore preserve the stale numeric index. Nulling it
    // explicitly clears the inherited positional selector so ECharts resolves xAxisId.
    next.xAxisIndex = null;
    next.xAxisId = xAxisId;
  }
  if (yAxisId) {
    next.yAxisIndex = null;
    next.yAxisId = yAxisId;
  }

  return next;
};
