import { vi } from 'vitest';

import { store } from '@/store';

import { getPrintInvoiceBaseUrl } from './b3PrintInvoice';
import * as basicConfig from './basicConfig';

const STORE_URL = 'https://store-abc.mybigcommerce.com';
const STOREFRONT_URL = 'https://my-custom-storefront.com';

vi.mock('./basicConfig', () => ({
  platform: 'bigcommerce',
  BigCommerceStorefrontAPIBaseURL: 'https://store-abc.mybigcommerce.com',
}));

const getStateWithUrls = (urls: string[]) => ({
  global: {
    storeInfo: {
      urls,
    },
  },
});

describe('getPrintInvoiceBaseUrl', () => {
  beforeEach(() => {
    vi.spyOn(store, 'getState').mockReturnValue(
      getStateWithUrls([]) as ReturnType<typeof store.getState>,
    );
  });

  describe('when platform is bigcommerce (Stencil)', () => {
    it('returns BigCommerceStorefrontAPIBaseURL', () => {
      (basicConfig as { platform: string }).platform = 'bigcommerce';

      expect(getPrintInvoiceBaseUrl()).toBe(STORE_URL);
    });
  });

  describe('when platform is not bigcommerce (headless)', () => {
    beforeEach(() => {
      (basicConfig as { platform: string }).platform = 'catalyst';
    });

    it('returns storefront URL when urls contain store URL first and storefront second', () => {
      vi.spyOn(store, 'getState').mockReturnValue(
        getStateWithUrls([STORE_URL, STOREFRONT_URL]) as ReturnType<typeof store.getState>,
      );

      expect(getPrintInvoiceBaseUrl()).toBe(STOREFRONT_URL);
    });

    it('returns storefront URL when urls contain storefront first and store URL second', () => {
      vi.spyOn(store, 'getState').mockReturnValue(
        getStateWithUrls([STOREFRONT_URL, STORE_URL]) as ReturnType<typeof store.getState>,
      );

      expect(getPrintInvoiceBaseUrl()).toBe(STOREFRONT_URL);
    });

    it('returns BigCommerceStorefrontAPIBaseURL when storeInfo.urls is empty', () => {
      vi.spyOn(store, 'getState').mockReturnValue(
        getStateWithUrls([]) as ReturnType<typeof store.getState>,
      );

      expect(getPrintInvoiceBaseUrl()).toBe(STORE_URL);
    });

    it('strips trailing slash from result', () => {
      vi.spyOn(store, 'getState').mockReturnValue(
        getStateWithUrls([`${STOREFRONT_URL}/`, STORE_URL]) as ReturnType<typeof store.getState>,
      );

      expect(getPrintInvoiceBaseUrl()).toBe(STOREFRONT_URL);
    });
  });
});
