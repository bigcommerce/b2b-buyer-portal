import {
  merge,
} from 'lodash'

import {
  B3SStorage,
} from '@/utils'

const formatCreator = (useOffset = true) => (timestamp: any, isDateStr = false) => {
  const dateFormat = merge({
    display: 'Y M jS',
    export: 'M jS Y',
    extendedDisplay: 'M jS Y @ g:i A',
    offset: 0,
  }, B3SStorage.get('dateFormat') || {})

  if (!timestamp) return 0

  const dateTime = isDateStr ? timestamp : (Number.parseInt(timestamp, 10)) * 1000
  const localDate = new Date(dateTime)
  const localTime = localDate.getTime()
  const offset = useOffset ? localDate.getTimezoneOffset() * 60000 + dateFormat.offset * 1000 : 0
  const utcTime = localTime + offset
  return utcTime
}

const displayFormat = formatCreator()

export {
  displayFormat,
}
