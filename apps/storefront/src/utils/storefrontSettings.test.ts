import { when } from 'vitest-when';

import * as b2bService from '@/shared/service/b2b';
import { store } from '@/store';
import { setBackorderDisplaySettings } from '@/store/slices/global';
import b2bLogger from '@/utils/b3Logger';

import { getStoreSettings } from './storefrontSettings';

describe('getStoreSettings', () => {
  beforeEach(() => {
    vi.spyOn(b2bService, 'getStorefrontSettings');
    vi.spyOn(store, 'dispatch').mockImplementation(() => undefined as any);
    vi.spyOn(b2bLogger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dispatches backorder display settings from the API response', async () => {
    when(vi.mocked(b2bService.getStorefrontSettings))
      .calledWith()
      .thenResolve({
        storefrontSettings: {
          backorderDisplaySettings: {
            showQuantityOnBackorder: true,
            showQuantityOnHand: false,
            showBackorderMessage: true,
            showDefaultShippingExpectationPrompt: true,
            defaultShippingExpectationPrompt: 'Backordered items ship separately.',
          },
        },
      });

    await getStoreSettings();

    expect(store.dispatch).toHaveBeenCalledWith(
      setBackorderDisplaySettings({
        showQuantityOnBackorder: true,
        showQuantityOnHand: false,
        showBackorderMessage: true,
        showDefaultShippingExpectationPrompt: true,
        defaultShippingExpectationPrompt: 'Backordered items ship separately.',
      }),
    );
  });

  it('does not dispatch when backorderDisplaySettings is absent', async () => {
    when(vi.mocked(b2bService.getStorefrontSettings)).calledWith().thenResolve({
      storefrontSettings: {},
    });

    await getStoreSettings();

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('does not dispatch when storefrontSettings is absent', async () => {
    when(vi.mocked(b2bService.getStorefrontSettings)).calledWith().thenResolve({});

    await getStoreSettings();

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('logs an error and does not dispatch when the API call throws', async () => {
    const error = new Error('Network error');
    when(vi.mocked(b2bService.getStorefrontSettings)).calledWith().thenReject(error);

    await getStoreSettings();

    expect(b2bLogger.error).toHaveBeenCalledWith('Failed to load storefront settings:', error);
    expect(store.dispatch).not.toHaveBeenCalled();
  });
});
