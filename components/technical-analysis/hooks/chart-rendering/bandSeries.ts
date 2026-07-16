export type CustomRenderApi = {
  value: (dimension: number) => unknown;
  coord: (data: unknown[]) => number[];
  style: (style: Record<string, unknown>) => Record<string, unknown>;
};

const toFiniteNumber = (value: unknown): number | null => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

export const buildBandFillData = (
  upper?: (number | string)[],
  lower?: (number | string)[],
  maxPointCount?: number,
): Array<(number | string)[]> => {
  if (!upper || !lower) return [];
  const length = Math.min(upper.length, lower.length, maxPointCount ?? Number.POSITIVE_INFINITY);
  const fillData: Array<(number | string)[]> = [];
  for (let index = 1; index < length; index++) {
    fillData.push([index, upper[index], lower[index], upper[index - 1], lower[index - 1]]);
  }
  return fillData;
};

export const PRICE_CUSTOM_SERIES_BINDING = {
  coordinateSystem: "cartesian2d",
  xAxisIndex: 0,
  yAxisIndex: 0,
  encode: { x: 0 },
  clip: true,
} as const;

export const renderBandPolygon = (api: CustomRenderApi, fill: string) => {
  const upperCurrent = toFiniteNumber(api.value(1));
  const lowerCurrent = toFiniteNumber(api.value(2));
  const upperPrevious = toFiniteNumber(api.value(3));
  const lowerPrevious = toFiniteNumber(api.value(4));
  const xIndex = toFiniteNumber(api.value(0));

  if (upperCurrent === null || lowerCurrent === null || upperPrevious === null || lowerPrevious === null || xIndex === null)
    return undefined;

  return {
    type: "polygon",
    shape: {
      points: [
        api.coord([xIndex - 1, upperPrevious]),
        api.coord([xIndex, upperCurrent]),
        api.coord([xIndex, lowerCurrent]),
        api.coord([xIndex - 1, lowerPrevious]),
      ],
    },
    style: api.style({ fill }),
  };
};
