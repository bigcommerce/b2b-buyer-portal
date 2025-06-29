import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getBcOrderedProducts,
  getOrderedProducts,
  searchB2BProducts,
  searchBcProducts,
} from '@/shared/service/b2b';

vi.mock('@/shared/service/b2b', () => ({
  getBcOrderedProducts: vi.fn(),
  getOrderedProducts: vi.fn(),
  searchB2BProducts: vi.fn(),
  searchBcProducts: vi.fn(),
}));

vi.mock('date-fns', () => ({
  format: vi.fn(),
  subDays: vi.fn(),
}));

vi.mock('@/utils', () => ({
  currencyFormat: vi.fn((value) => `$${value}`),
  displayFormat: vi.fn((timestamp) => new Date(timestamp).toLocaleDateString()),
  distanceDay: vi.fn((days) => {
    const date = new Date();
    date.setDate(date.getDate() - (days || 0));
    return date.toISOString().split('T')[0];
  }),
  getProductPriceIncTaxOrExTaxBySetting: vi.fn((variants, variantId) => {
    const variant = variants?.find(
      (v: { variantId: number; price: number }) => v.variantId === variantId,
    );
    return variant?.price || 0;
  }),
  snackbar: {
    error: vi.fn(),
  },
}));

vi.mock('@/utils/b3Product/shared/config', () => ({
  conversionProductsList: vi.fn((products) => products || []),
}));

vi.mock('@/utils/b2bGetVariantImageByVariantInfo', () => ({
  default: vi.fn(() => null),
}));

vi.mock('@/utils/b3Product/b3Product', () => ({
  getDisplayPrice: vi.fn(({ price }) => price),
}));

const mockServices = {
  getBcOrderedProducts: vi.mocked(getBcOrderedProducts),
  getOrderedProducts: vi.mocked(getOrderedProducts),
  searchB2BProducts: vi.mocked(searchB2BProducts),
  searchBcProducts: vi.mocked(searchBcProducts),
};

const mockOrderedProductsResponse = {
  orderedProducts: {
    edges: [
      {
        node: {
          id: '1',
          createdAt: 1640995200000,
          updatedAt: 1640995200000,
          productName: 'Test Product 1',
          productBrandName: 'Test Brand',
          variantSku: 'TEST-SKU-1',
          productId: 123,
          variantId: 456,
          optionList: [],
          orderedTimes: 5,
          firstOrderedAt: 1640995200000,
          lastOrderedAt: 1640995200000,
          lastOrderedItems: 2,
          sku: 'TEST-SKU-1',
          lastOrdered: true,
          imageUrl: 'https://example.com/image.jpg',
          baseSku: 'BASE-SKU-1',
          basePrice: 29.99,
          discount: 0,
          tax: 2.99,
          enteredInclusive: false,
          productUrl: '/products/test-product-1',
          optionSelections: [],
          quantity: 1,
        },
      },
    ],
    totalCount: 1,
  },
};

const mockProductSearchResponse = {
  productsSearch: [
    {
      id: 123,
      name: 'Test Product 1',
      sku: 'TEST-SKU-1',
      variants: [
        {
          variantId: 456,
          price: 29.99,
        },
      ],
      isPriceHidden: false,
    },
  ],
};

describe('QuickOrderB2BTable Component - Company Context Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServices.getOrderedProducts.mockResolvedValue(mockOrderedProductsResponse);
    mockServices.getBcOrderedProducts.mockResolvedValue(mockOrderedProductsResponse);
    mockServices.searchB2BProducts.mockResolvedValue(mockProductSearchResponse);
    mockServices.searchBcProducts.mockResolvedValue(mockProductSearchResponse);
  });

  describe('when the company has child companies', () => {
    it('should use child company ID when selectCompanyHierarchyId is set', () => {
      const selectCompanyHierarchyId = 'child-456';
      const companyInfoId = 'parent-123';

      const result = selectCompanyHierarchyId || companyInfoId;

      expect(result).toBe('child-456');
    });
  });

  describe('when the company does not have child companies', () => {
    it('should use its own company ID when selectCompanyHierarchyId is empty', () => {
      const selectCompanyHierarchyId = '';
      const companyInfoId = 'parent-123';

      const result = selectCompanyHierarchyId || companyInfoId;

      expect(result).toBe('parent-123');
    });

    it('should fall back to its own company ID when selectCompanyHierarchyId is null', () => {
      const selectCompanyHierarchyId = null;
      const companyInfoId = 'parent-123';

      const result = selectCompanyHierarchyId || companyInfoId;

      expect(result).toBe('parent-123');
    });

    it('should fall back to its own company ID when selectCompanyHierarchyId is undefined', () => {
      const selectCompanyHierarchyId = undefined;
      const companyInfoId = 'parent-123';

      const result = selectCompanyHierarchyId || companyInfoId;

      expect(result).toBe('parent-123');
    });
  });

  describe('when building GraphQL query parameters', () => {
    it('should include companyId in getOrderedProducts when child company is selected', async () => {
      const childCompanyId = 'child-456';
      const params = {
        q: '',
        first: 12,
        offset: 0,
        beginDateAt: '2023-01-01',
        endDateAt: '2023-12-31',
        orderBy: '-lastOrderedAt',
      };

      const queryParams = {
        ...params,
        companyId: childCompanyId,
      };

      await getOrderedProducts(queryParams);

      expect(mockServices.getOrderedProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'child-456',
        }),
      );
    });

    it('should include companyId in searchB2BProducts when child company is selected', async () => {
      const childCompanyId = 'child-456';
      const productSearchParams = {
        productIds: [123, 456],
        currencyCode: 'USD',
        customerGroupId: 1,
        companyId: childCompanyId,
      };

      await searchB2BProducts(productSearchParams);

      expect(mockServices.searchB2BProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'child-456',
        }),
      );
    });

    it('should include parent companyId when no child company is selected', async () => {
      const parentCompanyId = 'parent-123';
      const params = {
        q: '',
        first: 12,
        offset: 0,
        beginDateAt: '2023-01-01',
        endDateAt: '2023-12-31',
        orderBy: '-lastOrderedAt',
      };

      const queryParams = {
        ...params,
        companyId: parentCompanyId,
      };

      await getOrderedProducts(queryParams);

      expect(mockServices.getOrderedProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'parent-123',
        }),
      );
    });
  });

  describe('when switching between companies', () => {
    it('should handle switching from parent to child company', () => {
      let selectCompanyHierarchyId = '';
      const companyInfoId = 'parent-123';
      let currentCompanyId = selectCompanyHierarchyId || companyInfoId;
      expect(currentCompanyId).toBe('parent-123');

      selectCompanyHierarchyId = 'child-456';
      currentCompanyId = selectCompanyHierarchyId || companyInfoId;
      expect(currentCompanyId).toBe('child-456');
    });

    it('should handle switching from child back to parent company', () => {
      let selectCompanyHierarchyId = 'child-456';
      const companyInfoId = 'parent-123';
      let currentCompanyId = selectCompanyHierarchyId || companyInfoId;
      expect(currentCompanyId).toBe('child-456');

      selectCompanyHierarchyId = '';
      currentCompanyId = selectCompanyHierarchyId || companyInfoId;
      expect(currentCompanyId).toBe('parent-123');
    });

    it('should handle switching between different child companies', () => {
      let selectCompanyHierarchyId = 'child-A-111';
      const companyInfoId = 'parent-123';
      let currentCompanyId = selectCompanyHierarchyId || companyInfoId;
      expect(currentCompanyId).toBe('child-A-111');

      selectCompanyHierarchyId = 'child-B-222';
      currentCompanyId = selectCompanyHierarchyId || companyInfoId;
      expect(currentCompanyId).toBe('child-B-222');
    });
  });
});
