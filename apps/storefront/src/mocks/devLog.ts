export function logMockDecision(message: string): void {
  if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
    // eslint-disable-next-line no-console -- Dev-only mock decisions must be observable while debugging MSW routing.
    console.info(`[b2b-mock] ${message}`);
  }
}
