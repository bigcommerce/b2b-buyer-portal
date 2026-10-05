import { getRelativeTimeParts } from './getRelativeTimeParts';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('getRelativeTimeParts', () => {
  const now = Date.UTC(2026, 9, 5, 12);

  it.each([
    { age: 30 * SECOND, expected: [-30, 'second'] },
    { age: 5 * MINUTE, expected: [-5, 'minute'] },
    { age: 3 * HOUR, expected: [-3, 'hour'] },
    { age: 29.6 * DAY, expected: [-30, 'day'] },
    { age: 45 * DAY, expected: [-2, 'month'] },
    { age: 340 * DAY, expected: [-11, 'month'] },
    { age: 350 * DAY, expected: [-1, 'year'] },
    { age: 400 * DAY, expected: [-1, 'year'] },
    { age: 800 * DAY, expected: [-2, 'year'] },
  ])('picks the largest unit that fits for $age ms ago', ({ age, expected }) => {
    expect(getRelativeTimeParts(now - age, now)).toEqual(expected);
  });

  it('treats a zero difference as past', () => {
    const [value, unit] = getRelativeTimeParts(now, now);

    expect(unit).toBe('second');
    expect(new Intl.RelativeTimeFormat('en', { numeric: 'always' }).format(value, unit)).toBe(
      '0 seconds ago',
    );
  });

  it('keeps future dates in the future', () => {
    expect(getRelativeTimeParts(now + 5 * MINUTE, now)).toEqual([5, 'minute']);
  });
});
