import { beforeEach, describe, expect, it, vi } from 'vitest';

import { unregisterStaleMockWorkers } from './bootstrap';

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
});
