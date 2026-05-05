import { beforeEach, describe, expect, it, vi } from 'vitest';

import { enableMocking, unregisterStaleMockWorkers } from './bootstrap';

const startWorker = vi.hoisted(() => vi.fn());

vi.mock('./browser', () => ({
  worker: {
    start: startWorker,
  },
}));

interface MockWorkerRegistrationParams {
  scriptURL: string;
  unregister: ServiceWorkerRegistration['unregister'];
}

const buildServiceWorkerRegistration = ({
  scriptURL,
  unregister,
}: MockWorkerRegistrationParams): ServiceWorkerRegistration =>
  ({
    active: { scriptURL } as ServiceWorker,
    unregister,
  }) as ServiceWorkerRegistration;

describe('unregisterStaleMockWorkers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    startWorker.mockReset();
  });

  it('unregisters only mock service workers', async () => {
    const unregisterMock = vi.fn().mockResolvedValue(true);
    const unregisterOther = vi.fn().mockResolvedValue(true);
    const getRegistrations = vi.fn<ServiceWorkerContainer['getRegistrations']>().mockResolvedValue([
      buildServiceWorkerRegistration({
        scriptURL: 'http://localhost:3001/mockServiceWorker.js',
        unregister: unregisterMock,
      }),
      buildServiceWorkerRegistration({
        scriptURL: 'http://localhost:3001/other-worker.js',
        unregister: unregisterOther,
      }),
    ]);

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { getRegistrations } satisfies Pick<ServiceWorkerContainer, 'getRegistrations'>,
    });

    await unregisterStaleMockWorkers();

    expect(unregisterMock).toHaveBeenCalledTimes(1);
    expect(unregisterOther).not.toHaveBeenCalled();
  });

  it('continues when mock worker startup fails', async () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_USE_MOCK_API', 'true');
    startWorker.mockRejectedValue(new Error('Worker startup failed'));

    await expect(enableMocking()).resolves.toBeUndefined();

    expect(startWorker).toHaveBeenCalledWith({
      onUnhandledRequest: 'bypass',
      serviceWorker: { url: '/mockServiceWorker.js' },
    });
  });
});
