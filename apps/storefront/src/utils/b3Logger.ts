type B2BLoggerType = Pick<Console, 'error'>;

const b2bLogger: B2BLoggerType = {
  // eslint-disable-next-line no-console
  error: console.error,
};

export default b2bLogger;
