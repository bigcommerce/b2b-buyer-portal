type B2BLoggerType = Pick<Console, 'error'>

export const b2bLogger: B2BLoggerType = {
  error: console.error,
}

export default b2bLogger
