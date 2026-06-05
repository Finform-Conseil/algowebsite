const MIN_REPLAY_SPEED_MS = 50;
const MAX_REPLAY_SPEED_MS = 60_000;

export const normalizeReplaySpeed = (speed: number): number | null => {
  if (!Number.isFinite(speed)) return null;
  const normalized = Math.trunc(speed);
  if (normalized < MIN_REPLAY_SPEED_MS || normalized > MAX_REPLAY_SPEED_MS) return null;
  return normalized;
};
