type RelativeUnit = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year';

// Mirrors date-fns `formatDistanceStrict` unit selection: the largest unit that fits, rounded.
export const getRelativeTimeParts = (sentAtMs: number, nowMs: number): [number, RelativeUnit] => {
  const diffSeconds = (sentAtMs - nowMs) / 1000;
  const absSeconds = Math.abs(diffSeconds);
  const sign = diffSeconds < 0 ? -1 : 1;

  if (absSeconds < 60) return [sign * Math.round(absSeconds), 'second'];

  const minutes = absSeconds / 60;
  if (minutes < 60) return [sign * Math.round(minutes), 'minute'];

  const hours = minutes / 60;
  if (hours < 24) return [sign * Math.round(hours), 'hour'];

  const days = hours / 24;
  if (days < 30) return [sign * Math.round(days), 'day'];

  const months = days / 30;
  if (months < 12) return [sign * Math.round(months), 'month'];

  return [sign * Math.round(days / 365), 'year'];
};
