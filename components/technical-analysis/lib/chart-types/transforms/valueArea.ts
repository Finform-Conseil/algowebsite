export interface ValueAreaInputRow {
  total: number;
}

export const resolvePocIndex = <T extends ValueAreaInputRow>(rows: T[]): number => {
  let pocIndex = 0;
  let maxVolume = Number.NEGATIVE_INFINITY;

  rows.forEach((row, index) => {
    if (row.total > maxVolume) {
      maxVolume = row.total;
      pocIndex = index;
    }
  });

  return pocIndex;
};

export const resolveValueAreaIndexes = <T extends ValueAreaInputRow>(
  rows: T[],
  valueAreaPct: number,
): Set<number> => {
  const included = new Set<number>();
  if (rows.length === 0) return included;

  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const target = total * valueAreaPct / 100;
  const pocIndex = resolvePocIndex(rows);
  let lowIndex = pocIndex;
  let highIndex = pocIndex;
  let covered = rows[pocIndex].total;
  included.add(pocIndex);

  while (covered < target && (lowIndex > 0 || highIndex < rows.length - 1)) {
    const below = lowIndex > 0 ? rows[lowIndex - 1] : null;
    const above = highIndex < rows.length - 1 ? rows[highIndex + 1] : null;
    const chooseAbove = !below || (above !== null && above.total >= below.total);

    if (chooseAbove && above) {
      highIndex += 1;
      covered += above.total;
      included.add(highIndex);
    } else if (below) {
      lowIndex -= 1;
      covered += below.total;
      included.add(lowIndex);
    } else {
      break;
    }
  }

  return included;
};
