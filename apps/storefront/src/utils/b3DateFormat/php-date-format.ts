interface DateSettings {
  days: string[]
  daysShort: string[]
  months: string[]
  monthsShort: string[]
  meridiem: string[]
  ordinal(number: number): string
}

interface Defaults {
  dateSettings: DateSettings
  separators: RegExp
  validParts: RegExp
  intParts: RegExp
  tzParts: RegExp
  tzClip: RegExp
}

interface AnyType {
  [key: string]: any
}

interface Helper {
  DAY: number
  HOUR: number
  defaults: Defaults
  getInt(str: string | number | null, radix?: number): number
  compare(str1: string, str2: string): boolean
  lpad(value: any, length: number, chr?: string): string
  merge(out: any, ...args: any[]): any
  getIndex(val: string, arr: string[]): number
}

/**
 * Global helper object
 */
const $h: Helper = {
  DAY: 1000 * 60 * 60 * 24,
  HOUR: 3600,
  defaults: {
    dateSettings: {
      days: [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ],
      daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      months: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
      monthsShort: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
      meridiem: ['AM', 'PM'],
      ordinal(number: number): string {
        const n = number % 10
        const suffixes: AnyType = {
          1: 'st',
          2: 'nd',
          3: 'rd',
        }
        return Math.floor((number % 100) / 10) === 1 || !suffixes[n]
          ? 'th'
          : suffixes[n]
      },
    },
    separators: /[ \-+\/.:@]/g,
    validParts: /[dDjlNSwzWFmMntLoYyaABgGhHisueTIOPZcrU]/g,
    intParts: /[djwNzmnyYHgGis]/g,
    tzParts:
      /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
    tzClip: /[^-+\dA-Z]/g,
  },
  getInt(str: string | number | null, radix?: number): number {
    return parseInt(String(str), radix || 10)
  },
  compare(str1: string, str2: string): boolean {
    return (
      typeof str1 === 'string' &&
      typeof str2 === 'string' &&
      str1.toLowerCase() === str2.toLowerCase()
    )
  },
  lpad(value: any, length: number, chr?: string): string {
    const val = value.toString()
    chr = chr || '0'
    return val.length < length ? $h.lpad(chr + val, length, chr) : val
  },
  merge(out: any, ...args: any[]): any {
    let i
    let obj
    out = out || {}
    for (i = 1; i < args.length; i++) {
      obj = args[i]
      if (!obj) {
        continue
      }
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'object') {
            $h.merge(out[key], obj[key])
          } else {
            out[key] = obj[key]
          }
        }
      }
    }
    return out
  },
  getIndex(val: string, arr: string[]): number {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].toLowerCase() === val.toLowerCase()) {
        return i
      }
    }
    return -1
  },
}

/**
 * Date Formatter Library Constructor
 * @param options
 * @constructor
 */
// const DateFormatter = function (options: AnyType) {
//   const self = this
//   const config = $h.merge($h.defaults, options)
//   self.dateSettings = config.dateSettings
//   self.separators = config.separators
//   self.validParts = config.validParts
//   self.intParts = config.intParts
//   self.tzParts = config.tzParts
//   self.tzClip = config.tzClip
// }

interface DateFormatterOptions {
  dateSettings: {
    days: string[]
    daysShort: string[]
    months: string[]
    monthsShort: string[]
    meridiem: string[]
    ordinal: (number: number) => string
  }
  separators: RegExp
  validParts: RegExp
  intParts: RegExp
  tzParts: RegExp
  tzClip: RegExp
  getMonth: (val: string) => number
  parseDate: (
    vDate: string | number | Date,
    vFormat: string
  ) => Date | string | number | null
  guessDate: (vDateStr: string, vFormat: string) => Date | string | null
  parseFormat: (vChar: string | number, vDate: Date) => string | number | null
  formatDate: (
    vDate: string | number | Date | null,
    vFormat: string
  ) => string | null
}

class DateFormatter {
  dateSettings: DateFormatterOptions['dateSettings']

  separators: DateFormatterOptions['separators']

  validParts: DateFormatterOptions['validParts']

  intParts: DateFormatterOptions['intParts']

  tzParts: DateFormatterOptions['tzParts']

  tzClip: DateFormatterOptions['tzClip']

  getMonth!: DateFormatterOptions['getMonth']

  parseDate!: DateFormatterOptions['parseDate']

  guessDate!: DateFormatterOptions['guessDate']

  parseFormat!: DateFormatterOptions['parseFormat']

  formatDate!: DateFormatterOptions['formatDate']

  constructor(options?: Partial<DateFormatterOptions>) {
    const config = $h.merge($h.defaults, options)
    this.dateSettings = config.dateSettings
    this.separators = config.separators
    this.validParts = config.validParts
    this.intParts = config.intParts
    this.tzParts = config.tzParts
    this.tzClip = config.tzClip
  }
}

/**
 * DateFormatter Library Prototype
 */
DateFormatter.prototype.getMonth = function (
  this: DateFormatter,
  val: string
): number {
  const self = this
  let i = $h.getIndex(val, self.dateSettings.monthsShort) + 1
  if (i === 0) {
    i = $h.getIndex(val, self.dateSettings.months) + 1
  }
  return i
}

DateFormatter.prototype.parseDate = function (
  this: DateFormatter,
  vDate: Date | string | number,
  vFormat: string
): Date | string | number | null {
  const self = this
  let vFormatParts: RegExpMatchArray | null
  let vDateParts: string[]
  let i: number
  let vDateFlag = false
  let vTimeFlag = false
  let vDatePart: string
  let iDatePart: number
  const vSettings = self.dateSettings
  let vMonth: number | undefined
  let vMeriIndex: number
  let vMeriOffset: number
  let len: number
  let mer: string
  const out: AnyType = {
    date: null,
    year: null,
    month: null,
    day: null,
    hour: 0,
    min: 0,
    sec: 0,
  }
  if (!vDate) {
    return null
  }
  if (vDate instanceof Date) {
    return vDate
  }
  if (vFormat === 'U') {
    i = $h.getInt(vDate)
    return i ? new Date(i * 1000) : vDate
  }
  switch (typeof vDate) {
    case 'number':
      return new Date(vDate)
    case 'string':
      break
    default:
      return null
  }
  vFormatParts = vFormat.match(self.validParts)
  if (!vFormatParts || vFormatParts.length === 0) {
    throw new Error('Invalid date format definition.')
  }
  for (i = vFormatParts.length - 1; i >= 0; i--) {
    if (vFormatParts[i] === 'S') {
      vFormatParts.splice(i, 1)
    }
  }
  vDateParts = vDate.replace(self.separators, '\0').split('\0')
  for (i = 0; i < vDateParts.length; i++) {
    vDatePart = vDateParts[i]
    iDatePart = $h.getInt(vDatePart)
    switch (vFormatParts[i]) {
      case 'y':
      case 'Y':
        if (iDatePart) {
          len = vDatePart.length
          out.year =
            len === 2
              ? $h.getInt((iDatePart < 70 ? '20' : '19') + vDatePart)
              : iDatePart
        } else {
          return null
        }
        vDateFlag = true
        break
      case 'm':
      case 'n':
      case 'M':
      case 'F':
        if (isNaN(iDatePart)) {
          vMonth = self.getMonth(vDatePart)
          if (vMonth > 0) {
            out.month = vMonth
          } else {
            return null
          }
        } else if (iDatePart >= 1 && iDatePart <= 12) {
          out.month = iDatePart
        } else {
          return null
        }
        vDateFlag = true
        break
      case 'd':
      case 'j':
        if (iDatePart >= 1 && iDatePart <= 31) {
          out.day = iDatePart
        } else {
          return null
        }
        vDateFlag = true
        break
      case 'g':
      case 'h':
        vMeriIndex =
          vFormatParts.indexOf('a') > -1
            ? vFormatParts.indexOf('a')
            : vFormatParts.indexOf('A') > -1
            ? vFormatParts.indexOf('A')
            : -1
        mer = vDateParts[vMeriIndex]
        if (vMeriIndex !== -1) {
          vMeriOffset = $h.compare(mer, vSettings.meridiem[0])
            ? 0
            : $h.compare(mer, vSettings.meridiem[1])
            ? 12
            : -1
          if (iDatePart >= 1 && iDatePart <= 12 && vMeriOffset !== -1) {
            out.hour =
              iDatePart % 12 === 0 ? vMeriOffset : iDatePart + vMeriOffset
          } else if (iDatePart >= 0 && iDatePart <= 23) {
            out.hour = iDatePart
          }
        } else if (iDatePart >= 0 && iDatePart <= 23) {
          out.hour = iDatePart
        } else {
          return null
        }
        vTimeFlag = true
        break
      case 'G':
      case 'H':
        if (iDatePart >= 0 && iDatePart <= 23) {
          out.hour = iDatePart
        } else {
          return null
        }
        vTimeFlag = true
        break
      case 'i':
        if (iDatePart >= 0 && iDatePart <= 59) {
          out.min = iDatePart
        } else {
          return null
        }
        vTimeFlag = true
        break
      case 's':
        if (iDatePart >= 0 && iDatePart <= 59) {
          out.sec = iDatePart
        } else {
          return null
        }
        vTimeFlag = true
        break
    }
  }
  if (vDateFlag === true) {
    const varY = out.year || 0
    const varM = out.month ? out.month - 1 : 0
    const varD = out.day || 1
    out.date = new Date(varY, varM, varD, out.hour, out.min, out.sec, 0)
  } else {
    if (vTimeFlag !== true) {
      return null
    }
    out.date = new Date(0, 0, 0, out.hour, out.min, out.sec, 0)
  }
  return out.date
}

DateFormatter.prototype.guessDate = function (
  this: DateFormatter,
  vDateStr: string,
  vFormat: string
): Date | string | null {
  if (typeof vDateStr !== 'string') {
    return vDateStr
  }

  const self = this
  const vParts = vDateStr.replace(self.separators, '\0').split('\0')
  const vPattern = /^[djmn]/g
  const vFormatParts = vFormat.match(self.validParts)
  const vDate = new Date()

  let vDigit = 0
  let vYear: number | undefined
  let i: number
  let n: string
  let iPart: string
  let iSec: number | undefined
  let len: number | undefined

  if (vFormatParts?.length && !vPattern.test(vFormatParts[0])) {
    return vDateStr
  }

  for (i = 0; i < vParts.length; i++) {
    vDigit = 2
    iPart = vParts[i]
    iSec = parseInt(iPart.substr(0, 2), 10)

    if (isNaN(iSec)) {
      return null
    }

    switch (i) {
      case 0:
        if (
          vFormatParts?.length &&
          (vFormatParts[0] === 'm' || vFormatParts[0] === 'n')
        ) {
          vDate.setMonth(iSec - 1)
        } else {
          vDate.setDate(iSec)
        }
        break
      case 1:
        if (
          vFormatParts?.length &&
          (vFormatParts[0] === 'm' || vFormatParts[0] === 'n')
        ) {
          vDate.setDate(iSec)
        } else {
          vDate.setMonth(iSec - 1)
        }
        break
      case 2:
        vYear = vDate.getFullYear()
        len = iPart.length
        vDigit = len < 4 ? len : 4
        vYear = parseInt(
          len < 4
            ? vYear.toString().substr(0, 4 - len) + iPart
            : iPart.substr(0, 4),
          10
        )

        if (!vYear) {
          return null
        }

        vDate.setFullYear(vYear)
        break
      case 3:
        vDate.setHours(iSec)
        break
      case 4:
        vDate.setMinutes(iSec)
        break
      case 5:
        vDate.setSeconds(iSec)
        break
    }

    n = iPart.substr(vDigit)

    if (n.length > 0) {
      vParts.splice(i + 1, 0, n)
    }
  }

  const vFormatYear = vFormatParts?.find((part) => /[yY]/.test(part))

  if (vFormatYear && vYear && vYear < 100 && vFormatYear.length > 1) {
    const century = Math.floor(vDate.getFullYear() / 100) * 100
    const twoDigitYear =
      vYear + century - (vYear <= new Date().getFullYear() % 100 ? 0 : 100)
    vDate.setFullYear(twoDigitYear)
  }

  if (vDate.toString() === 'Invalid Date') {
    return null
  }

  return vDate
}

DateFormatter.prototype.parseFormat = function (
  this: DateFormatter,
  vChar: string | number,
  vDate: Date
): string | number | null {
  const self = this
  const vSettings = self.dateSettings
  let fmt: AnyType
  const backslash = /\\?(.?)/gi
  const doFormat = function (t: string | number, s: any) {
    return fmt[t] ? fmt[t]() : s
  }
  fmt = {
    /// //////
    // DAY //
    /// //////
    /**
     * Day of month with leading 0: `01..31`
     * @return {string}
     */
    d() {
      return $h.lpad(fmt.j(), 2)
    },
    /**
     * Shorthand day name: `Mon...Sun`
     * @return {string}
     */
    D() {
      return vSettings.daysShort[fmt.w()]
    },
    /**
     * Day of month: `1..31`
     * @return {number}
     */
    j() {
      return vDate.getDate()
    },
    /**
     * Full day name: `Monday...Sunday`
     * @return {string}
     */
    l() {
      return vSettings.days[fmt.w()]
    },
    /**
     * ISO-8601 day of week: `1[Mon]..7[Sun]`
     * @return {number}
     */
    N() {
      return fmt.w() || 7
    },
    /**
     * Day of week: `0[Sun]..6[Sat]`
     * @return {number}
     */
    w() {
      return vDate.getDay()
    },
    /**
     * Day of year: `0..365`
     * @return {number}
     */
    z() {
      const a = new Date(fmt.Y(), fmt.n() - 1, fmt.j())
      const b = new Date(fmt.Y(), 0, 1)
      return Math.round((Number(a) - Number(b)) / $h.DAY)
    },
    /// ///////
    // WEEK //
    /// ///////
    /**
     * ISO-8601 week number
     * @return {number}
     */
    W() {
      const a = new Date(fmt.Y(), fmt.n() - 1, fmt.j() - fmt.N() + 3)
      const b = new Date(a.getFullYear(), 0, 4)
      const diffInMs = a.getTime() - b.getTime()
      const diffInDays = Math.floor(diffInMs / 86400000)
      return $h.lpad(1 + Math.round(diffInDays / $h.DAY / 7), 2)
    },
    /// ////////
    // MONTH //
    /// ////////
    /**
     * Full month name: `January...December`
     * @return {string}
     */
    F() {
      return vSettings.months[vDate.getMonth()]
    },
    /**
     * Month w/leading 0: `01..12`
     * @return {string}
     */
    m() {
      return $h.lpad(fmt.n(), 2)
    },
    /**
     * Shorthand month name; `Jan...Dec`
     * @return {string}
     */
    M() {
      return vSettings.monthsShort[vDate.getMonth()]
    },
    /**
     * Month: `1...12`
     * @return {number}
     */
    n() {
      return vDate.getMonth() + 1
    },
    /**
     * Days in month: `28...31`
     * @return {number}
     */
    t() {
      return new Date(fmt.Y(), fmt.n(), 0).getDate()
    },
    /// ///////
    // YEAR //
    /// ///////
    /**
     * Is leap year? `0 or 1`
     * @return {number}
     */
    L() {
      const Y = fmt.Y()
      return (Y % 4 === 0 && Y % 100 !== 0) || Y % 400 === 0 ? 1 : 0
    },
    /**
     * ISO-8601 year
     * @return {number}
     */
    o() {
      const n = fmt.n()
      const W = fmt.W()
      const Y = fmt.Y()
      return Y + (n === 12 && W < 9 ? 1 : n === 1 && W > 9 ? -1 : 0)
    },
    /**
     * Full year: `e.g. 1980...2010`
     * @return {number}
     */
    Y() {
      return vDate.getFullYear()
    },
    /**
     * Last two digits of year: `00...99`
     * @return {string}
     */
    y() {
      return fmt.Y().toString().slice(-2)
    },
    /// ///////
    // TIME //
    /// ///////
    /**
     * Meridian lower: `am or pm`
     * @return {string}
     */
    a() {
      return fmt.A().toLowerCase()
    },
    /**
     * Meridian upper: `AM or PM`
     * @return {string}
     */
    A() {
      const n = fmt.G() < 12 ? 0 : 1
      return vSettings.meridiem[n]
    },
    /**
     * Swatch Internet time: `000..999`
     * @return {string}
     */
    B() {
      const H = vDate.getUTCHours() * $h.HOUR
      const i = vDate.getUTCMinutes() * 60
      const s = vDate.getUTCSeconds()
      return $h.lpad(Math.floor((H + i + s + $h.HOUR) / 86.4) % 1000, 3)
    },
    /**
     * 12-Hours: `1..12`
     * @return {number}
     */
    g() {
      return fmt.G() % 12 || 12
    },
    /**
     * 24-Hours: `0..23`
     * @return {number}
     */
    G() {
      return vDate.getHours()
    },
    /**
     * 12-Hours with leading 0: `01..12`
     * @return {string}
     */
    h() {
      return $h.lpad(fmt.g(), 2)
    },
    /**
     * 24-Hours w/leading 0: `00..23`
     * @return {string}
     */
    H() {
      return $h.lpad(fmt.G(), 2)
    },
    /**
     * Minutes w/leading 0: `00..59`
     * @return {string}
     */
    i() {
      return $h.lpad(vDate.getMinutes(), 2)
    },
    /**
     * Seconds w/leading 0: `00..59`
     * @return {string}
     */
    s() {
      return $h.lpad(vDate.getSeconds(), 2)
    },
    /**
     * Microseconds: `000000-999000`
     * @return {string}
     */
    u() {
      return $h.lpad(vDate.getMilliseconds() * 1000, 6)
    },
    /**
     * Timezone identifier: `e.g. Atlantic/Azores, ...`
     * @return {string}
     */
    e() {
      const strArr = /\((.*)\)/.exec(String(vDate))
      if (strArr?.length) {
        const str = strArr[1]
        return str
      }
      return 'Coordinated Universal Time'
    },
    /**
     * DST observed? `0 or 1`
     * @return {number}
     */
    I() {
      const a = new Date(fmt.Y(), 0)
      const c = Date.UTC(fmt.Y(), 0)
      const b = new Date(fmt.Y(), 6)
      const d = Date.UTC(fmt.Y(), 6)
      const diffInMs1 = a.getTime() - c
      const diffInMs2 = b.getTime() - d
      return diffInMs1 !== diffInMs2 ? 1 : 0
    },
    /**
     * Difference to GMT in hour format: `e.g. +0200`
     * @return {string}
     */
    O() {
      const tzo = vDate.getTimezoneOffset()
      const a = Math.abs(tzo)
      return (
        (tzo > 0 ? '-' : '+') + $h.lpad(Math.floor(a / 60) * 100 + (a % 60), 4)
      )
    },
    /**
     * Difference to GMT with colon: `e.g. +02:00`
     * @return {string}
     */
    P() {
      const O = fmt.O()
      return `${O.substr(0, 3)}:${O.substr(3, 2)}`
    },
    /// ///////////
    // TIMEZONE //
    /// ///////////
    /**
     * Timezone abbreviation: `e.g. EST, MDT, ...`
     * @return {string}
     */
    T() {
      const date = (String(vDate).match(self.tzParts) || ['']).pop()
      if (date) {
        const str = date.replace(self.tzClip, '')
        return str
      }
      return 'UTC'
    },
    /**
     * Timezone offset in seconds: `-43200...50400`
     * @return {number}
     */
    Z() {
      return -vDate.getTimezoneOffset() * 60
    },
    /// /////////////////
    // FULL DATE TIME //
    /// /////////////////
    /**
     * ISO-8601 date
     * @return {string}
     */
    c() {
      return 'Y-m-d\\TH:i:sP'.replace(backslash, doFormat)
    },
    /**
     * RFC 2822 date
     * @return {string}
     */
    r() {
      return 'D, d M Y H:i:s O'.replace(backslash, doFormat)
    },
    /**
     * Seconds since UNIX epoch
     * @return {number}
     */
    U() {
      return vDate.getTime() / 1000 || 0
    },
  }
  return doFormat(vChar, vChar)
}

DateFormatter.prototype.formatDate = function (
  this: DateFormatter,
  vDate: string | number | Date | null,
  vFormat: string
): string | null {
  const self = this
  let n
  let len
  let str
  let vChar
  let vDateStr = ''
  const BACKSLASH = '\\'
  if (typeof vDate === 'string') {
    vDate = self.parseDate(vDate, vFormat)
    if (!vDate) {
      return null
    }
  }
  if (vDate instanceof Date) {
    len = vFormat.length
    for (let i = 0; i < len; i++) {
      vChar = vFormat.charAt(i)
      if (vChar === 'S' || vChar === BACKSLASH) {
        continue
      }
      if (i > 0 && vFormat.charAt(i - 1) === BACKSLASH) {
        vDateStr += vChar
        continue
      }
      str = self.parseFormat(vChar, vDate)
      if (
        i !== len - 1 &&
        self.intParts.test(vChar) &&
        vFormat.charAt(i + 1) === 'S'
      ) {
        n = $h.getInt(str) || 0
        str += self.dateSettings.ordinal(n)
      }
      vDateStr += str
    }
    return vDateStr
  }
  return ''
}

export default DateFormatter
