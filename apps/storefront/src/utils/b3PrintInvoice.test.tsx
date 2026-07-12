import { vi } from 'vitest';

import { store } from '@/store';

import { getPrintInvoiceBaseUrl } from './b3PrintInvoice';

const STORE_URL = 'https://store-abc.mybigcommerce.com';
const STOREFRONT_URL = 'https://my-custom-storefront.com';

const platformMocks = vi.hoisted(() => ({
  isBigCommercePlatform: vi.fn(() => true),
}));

vi.mock('./basicConfig', () => ({
  BigCommerceStorefrontAPIBaseURL: 'https://store-abc.mybigcommerce.com',
  isBigCommercePlatform: platformMocks.isBigCommercePlatform,
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
    platformMocks.isBigCommercePlatform.mockReturnValue(true);
    vi.spyOn(store, 'getState').mockReturnValue(
      getStateWithUrls([]) as ReturnType<typeof store.getState>,
    );
  });

  describe('when platform is bigcommerce (Stencil)', () => {
    it('returns BigCommerceStorefrontAPIBaseURL', () => {
      expect(getPrintInvoiceBaseUrl()).toBe(STORE_URL);
    });
  });

  describe('when platform is not bigcommerce (headless)', () => {
    beforeEach(() => {
      platformMocks.isBigCommercePlatform.mockReturnValue(false);
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
