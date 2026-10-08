export const parseIsoLocalDate = (
  value: string | null | undefined
): Date => {
  const [year, month, day] = String(value || '')
    .split('-')
    .map(Number);

  return new Date(
    year || 2026,
    Math.max(0, (month || 1) - 1),
    day || 1
  );
};

export const formatIsoLocalDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(date.getDate()).padStart(2, '0')}`;
