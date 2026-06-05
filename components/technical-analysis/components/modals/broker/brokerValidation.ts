export const parsePositiveFiniteNumber = (value: string) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
};

export const createPaperOrderId = () => (
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `order-${crypto.randomUUID()}`
    : `order-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`
);
