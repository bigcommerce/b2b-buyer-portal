import { formatDistanceStrict } from 'date-fns';

import { getRelativeTimeParts } from './getRelativeTimeParts';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const NOW = new Date('2026-01-10T12:00:00Z').getTime();

const toDistance = ([value, unit]: ReturnType<typeof getRelativeTimeParts>) => {
  const amount = Math.abs(value);

  return `${amount} ${unit}${amount === 1 ? '' : 's'}`;
};

describe('getRelativeTimeParts', () => {
  it.each([
    ['0 seconds', 0],
    ['30 seconds', 30 * SECOND],
    ['59.4 seconds', 59.4 * SECOND],
    ['59.6 seconds', 59.6 * SECOND],
    ['1 minute', MINUTE],
    ['1.5 minutes', 1.5 * MINUTE],
    ['59.4 minutes', 59.4 * MINUTE],
    ['59.6 minutes', 59.6 * MINUTE],
    ['1 hour', HOUR],
    ['23.4 hours', 23.4 * HOUR],
    ['23.6 hours', 23.6 * HOUR],
    ['1 day', DAY],
    ['29.4 days', 29.4 * DAY],
    ['30 days', 30 * DAY],
    ['45 days', 45 * DAY],
    ['342 days', 342 * DAY],
    ['348 days', 348 * DAY],
    ['360 days', 360 * DAY],
    ['365 days', 365 * DAY],
    ['730 days', 730 * DAY],
  ])('picks the same unit and amount as date-fns for a message sent %s ago', (_, elapsed) => {
    const sentAt = NOW - elapsed;

    expect(toDistance(getRelativeTimeParts(sentAt, NOW))).toBe(
      formatDistanceStrict(new Date(sentAt), new Date(NOW)),
    );
  });

  it('returns a negative amount for past messages', () => {
    expect(getRelativeTimeParts(NOW - 5 * MINUTE, NOW)).toStrictEqual([-5, 'minute']);
  });

  it('returns a positive amount for messages dated in the future', () => {
    expect(getRelativeTimeParts(NOW + 3 * HOUR, NOW)).toStrictEqual([3, 'hour']);
  });

  it('keeps calendar days across a DST change like date-fns', () => {
    const originalTz = process.env.TZ;

    process.env.TZ = 'Europe/Paris';

    try {
      const now = new Date(2026, 2, 31, 12).getTime();
      const sentAt = new Date(2026, 2, 1, 12).getTime();

      expect(toDistance(getRelativeTimeParts(sentAt, now))).toBe(
        formatDistanceStrict(new Date(sentAt), new Date(now)),
      );
      expect(getRelativeTimeParts(sentAt, now)).toStrictEqual([-1, 'month']);
    } finally {
      process.env.TZ = originalTz;
    }
  });
});
