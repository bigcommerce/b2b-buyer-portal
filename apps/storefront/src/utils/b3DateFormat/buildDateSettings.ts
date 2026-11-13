const DAY = 24 * 60 * 60 * 1000;
// 2021-08-01 is a Sunday, so day offsets 0..6 map to Sunday..Saturday.
const SUNDAY = Date.UTC(2021, 7, 1);

const range = (length: number) => Array.from({ length }, (_, index) => index);

const getPart = (
  formatter: Intl.DateTimeFormat,
  date: number,
  type: Intl.DateTimeFormatPartTypes,
) => formatter.formatToParts(date).find((part) => part.type === type)?.value ?? '';

// Some locales (e.g. ja) expose the month as a bare number part, with the unit (月) in a literal.
const getMonthName = (
  formatter: Intl.DateTimeFormat,
  monthOnlyFormatter: Intl.DateTimeFormat,
  date: number,
) => {
  const month = getPart(formatter, date, 'month');

  return /^\d+$/.test(month) ? monthOnlyFormatter.format(date) : month;
};

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
  const longMonthOnly = new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' });
  const shortMonthOnly = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
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
    months: range(12).map((i) => getMonthName(longMonth, longMonthOnly, Date.UTC(2021, i, 1))),
    monthsShort: range(12).map((i) =>
      getMonthName(shortMonth, shortMonthOnly, Date.UTC(2021, i, 1)),
    ),
    meridiem: [
      getPart(dayPeriod, Date.UTC(2021, 0, 1, 1), 'dayPeriod') || 'AM',
      getPart(dayPeriod, Date.UTC(2021, 0, 1, 13), 'dayPeriod') || 'PM',
    ],
    // Day suffixes (1st, 2nd) are English-only; English never reaches this builder.
    ordinal: () => '',
  };
};
