import { format, subDays } from 'date-fns';

export const distanceDay = (_distanceDay = 0, dateFormat = 'yyyy-MM-dd'): string =>
  format(subDays(new Date(), _distanceDay), dateFormat);
