import { format, subDays } from 'date-fns'

const distanceDay = (distanceDay = 0, dateFormat = 'yyyy-MM-dd'): string =>
  format(subDays(new Date(), distanceDay), dateFormat)

export default distanceDay
