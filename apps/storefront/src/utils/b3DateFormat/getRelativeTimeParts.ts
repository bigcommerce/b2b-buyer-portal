import { RelativeUnit } from './types';

/**
 * Picks the value and unit to pass to `Intl.RelativeTimeFormat` / `intl.formatRelativeTime`.
 * Mirrors date-fns `formatDistanceStrict` unit selection: the largest unit that fits, rounded.
 *
 * @param dateMs - The date to describe, in milliseconds
 * @param nowMs - The reference date, in milliseconds
 */
export const getRelativeTimeParts = (dateMs: number, nowMs: number): [number, RelativeUnit] => {
  const diffSeconds = (dateMs - nowMs) / 1000;
  const sign = diffSeconds <= 0 ? -1 : 1;
  const absSeconds = Math.abs(diffSeconds);

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

  const days = hours / 24;

  if (days < 30) {
    return [sign * Math.round(days), 'day'];
  }

  const months = Math.round(days / 30);

  if (months < 12) {
    return [sign * months, 'month'];
  }

  if (days < 365) {
    return [sign, 'year'];
  }

  return [sign * Math.round(days / 365), 'year'];
};
