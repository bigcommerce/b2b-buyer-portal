import { format, subDays } from 'date-fns'

const distanceDay = (_distanceDay = 0, dateFormat = 'yyyy-MM-dd'): string =>
  format(subDays(new Date(), _distanceDay), dateFormat)

export default distanceDay
