const DAY = 24 * 60 * 60 * 1000;
// 2021-08-01 is a Sunday, so day offsets 0..6 map to Sunday..Saturday.
const SUNDAY = Date.UTC(2021, 7, 1);

const range = (length: number) => Array.from({ length }, (_, index) => index);

const getPart = (
  formatter: Intl.DateTimeFormat,
  date: number,
  type: Intl.DateTimeFormatPartTypes,
) => formatter.formatToParts(date).find((part) => part.type === type)?.value ?? '';

export const buildDateSettings = (locale: string) => {
  const longMonth = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
  const shortMonth = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
  const longWeekday = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' });
  const shortWeekday = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  const dayPeriod = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    hour12: true,
    timeZone: 'UTC',
  });

  return {
    days: range(7).map((i) => getPart(longWeekday, SUNDAY + i * DAY, 'weekday')),
    daysShort: range(7).map((i) => getPart(shortWeekday, SUNDAY + i * DAY, 'weekday')),
    months: range(12).map((i) => getPart(longMonth, Date.UTC(2021, i, 1), 'month')),
    monthsShort: range(12).map((i) => getPart(shortMonth, Date.UTC(2021, i, 1), 'month')),
    meridiem: [
      getPart(dayPeriod, Date.UTC(2021, 0, 1, 1), 'dayPeriod') || 'AM',
      getPart(dayPeriod, Date.UTC(2021, 0, 1, 13), 'dayPeriod') || 'PM',
    ],
    ...(locale.toLowerCase().split('-')[0] === 'en' ? {} : { ordinal: () => '' }),
  };
};
