export const setup = () => {
  // Set the timezone to GMT for consistent date handling and no offsets in tests
  process.env.TZ = 'GMT';
};
