import { merge } from 'lodash'

import { B3SStorage } from '../b3Storage.js'

import DateFormatter from './php-date-format.js'

const fmt = new DateFormatter()

const formatCreator =
  (displayType: string, handler: string, useOffset = true) =>
  (timestamp: string | number, isDateStr = false) => {
    const dateFormat = merge(
      {
        display: 'j M Y',
        export: 'M j Y',
        extendedDisplay: 'M j Y @ g:i A',
        offset: 0,
      },
      B3SStorage.get('timeFormat')
    )
    const display = dateFormat[displayType]

    if (!timestamp) return ''
    const dateTime = isDateStr
      ? timestamp
      : parseInt(String(timestamp), 10) * 1000
    const localDate = new Date(dateTime)
    const localTime = localDate.getTime()
    const offset = useOffset
      ? localDate.getTimezoneOffset() * 60000 + dateFormat.offset * 1000
      : 0
    const utcTime = localTime + offset

    const dateObject = new Date(utcTime)
    switch (handler) {
      case 'formatDate':
        return fmt.formatDate(dateObject, display) || ''
      case 'parseDate':
        return fmt.parseDate(dateObject, display) || ''
      default:
        return null
    }
  }

const displayFormat = formatCreator('display', 'formatDate')
const displayExtendedFormat = formatCreator('extendedDisplay', 'formatDate')

export { displayExtendedFormat, displayFormat }
