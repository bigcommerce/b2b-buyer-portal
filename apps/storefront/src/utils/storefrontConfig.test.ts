import * as b2bService from '@/shared/service/b2b';
import * as bcService from '@/shared/service/bc';
import { store } from '@/store';
import { setLocales } from '@/store/slices/global';

import { setStorefrontConfig } from './storefrontConfig';

const locales = [{ code: 'fr', isDefault: false, fullPath: 'https://shop.test/fr/' }];

const mockFeatureFlags = (featureFlags: Record<string, boolean>) =>
  vi.spyOn(store, 'getState').mockReturnValue({
    global: { featureFlags },
  } as unknown as ReturnType<typeof store.getState>);

describe('setStorefrontConfig', () => {
  beforeEach(() => {
    vi.spyOn(store, 'dispatch').mockImplementation(() => undefined as never);
    vi.spyOn(bcService, 'getLocales').mockResolvedValue({
      data: { site: { settings: { locales } } },
    });
    vi.spyOn(bcService, 'getActiveBcCurrency').mockResolvedValue({
      data: { site: { currencies: { edges: [] } } },
    });
    vi.spyOn(b2bService, 'getStorefrontConfig').mockResolvedValue({
      storefrontConfig: { config: {} },
    });
    vi.spyOn(b2bService, 'getCurrencies').mockResolvedValue({ currencies: {} });
    vi.spyOn(b2bService, 'getStorefrontDefaultLanguages').mockResolvedValue({
      storefrontDefaultLanguage: { language: 'en' },
    });
  });

  it.each([
    'LOCAL-3191.B2B_multi_language',
    'LOCAL-3280.B2B_email_multi_language',
    'LOCAL-3626.B2B_product_translation',
  ])('loads the storefront locales when %s is on', async (flag) => {
    mockFeatureFlags({ [flag]: true });

    await setStorefrontConfig(vi.fn());

    expect(bcService.getLocales).toHaveBeenCalledOnce();
    expect(store.dispatch).toHaveBeenCalledWith(setLocales(locales));
  });

  it('does not load the storefront locales when every locale flag is off', async () => {
    mockFeatureFlags({
      'LOCAL-3191.B2B_multi_language': false,
      'LOCAL-3280.B2B_email_multi_language': false,
      'LOCAL-3626.B2B_product_translation': false,
    });

    await setStorefrontConfig(vi.fn());

    expect(bcService.getLocales).not.toHaveBeenCalled();
  });
});
