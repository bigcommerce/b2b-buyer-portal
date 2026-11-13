type RelativeUnit = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year';

// Mirrors date-fns `formatDistanceStrict` unit selection: the largest unit that fits, rounded.
export const getRelativeTimeParts = (sentAtMs: number, nowMs: number): [number, RelativeUnit] => {
  const diffSeconds = (sentAtMs - nowMs) / 1000;
  const absSeconds = Math.abs(diffSeconds);
  const sign = diffSeconds < 0 ? -1 : 1;

  if (absSeconds < 60) {
    return [sign * Math.round(absSeconds), 'second'];
  }

  const minutes = absSeconds / 60;

  if (minutes < 60) {
    return [sign * Math.round(minutes), 'minute'];
  }

  const hours = minutes / 60;

  if (hours < 24) {
    return [sign * Math.round(hours), 'hour'];
  }

  // Like date-fns, count days/months/years on a DST-normalized duration so that a span
  // crossing a clock change still equals the same number of calendar days.
  const earlier = new Date(Math.min(sentAtMs, nowMs));
  const later = new Date(Math.max(sentAtMs, nowMs));
  const dstOffsetMs = (earlier.getTimezoneOffset() - later.getTimezoneOffset()) * 60 * 1000;
  const days = (absSeconds * 1000 + dstOffsetMs) / (24 * 60 * 60 * 1000);

  if (days < 30) {
    return [sign * Math.round(days), 'day'];
  }

  const months = Math.round(days / 30);

  if (months < 12) {
    return [sign * months, 'month'];
  }

  return [sign * Math.round(days / 365), 'year'];
};
