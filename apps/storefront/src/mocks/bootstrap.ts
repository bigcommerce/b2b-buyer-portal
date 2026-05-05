import { logMockDecision } from './devLog';

function getMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Mock worker startup failed';
}

export async function unregisterStaleMockWorkers(): Promise<void> {
  const registrations = await navigator.serviceWorker?.getRegistrations();

  await Promise.all(
    registrations
      ?.filter((registration) => registration.active?.scriptURL.includes('mockServiceWorker.js'))
      .map((registration) => registration.unregister()) ?? [],
  );
}

export async function enableMocking(): Promise<void> {
  try {
    if (!import.meta.env.DEV) {
      return;
    }

    if (import.meta.env.VITE_USE_MOCK_API !== 'true') {
      await unregisterStaleMockWorkers();

      return;
    }

    const { worker } = await import('./browser');

    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: { url: '/mockServiceWorker.js' },
    });
  } catch (error: unknown) {
    logMockDecision(`startup failed: ${getMessage(error)}`);
  }
}
