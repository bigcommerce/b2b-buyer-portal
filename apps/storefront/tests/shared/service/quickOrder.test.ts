import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getBcOrderedProducts, getOrderedProducts } from '@/shared/service/b2b/graphql/quickOrder';
import B3Request from '@/shared/service/request/b3Fetch';

vi.mock('@/shared/service/request/b3Fetch', () => ({
  default: {
    graphqlB2B: vi.fn(),
  },
}));

const mockB3Request = vi.mocked(B3Request);

describe('QuickOrder GraphQL Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrderedProducts', () => {
    it('includes companyId in query when provided', async () => {
      const mockResponse = {
        orderedProducts: {
          totalCount: 10,
          edges: [
            {
              node: {
                id: '1',
                productName: 'Test Product',
                variantSku: 'TEST-SKU',
                productId: 123,
                variantId: 456,
              },
            },
          ],
        },
      };

      mockB3Request.graphqlB2B.mockResolvedValue(mockResponse);

      const params = {
        q: 'test',
        first: 10,
        offset: 0,
        beginDateAt: '2023-01-01',
        endDateAt: '2023-12-31',
        orderBy: '-lastOrderedAt',
        companyId: 789,
      };

      await getOrderedProducts(params);

      expect(mockB3Request.graphqlB2B).toHaveBeenCalledWith({
        query: expect.stringContaining('companyId: 789'),
      });

      const calledQuery = mockB3Request.graphqlB2B.mock.calls[0][0].query;
      expect(calledQuery).toContain('q: "test"');
      expect(calledQuery).toContain('first: 10');
      expect(calledQuery).toContain('offset: 0');
      expect(calledQuery).toContain('beginDateAt: "2023-01-01"');
      expect(calledQuery).toContain('endDateAt: "2023-12-31"');
      expect(calledQuery).toContain('orderBy: "-lastOrderedAt"');
      expect(calledQuery).toContain('companyId: 789');
    });

    it('excludes companyId from query when not provided', async () => {
      const mockResponse = {
        orderedProducts: {
          totalCount: 5,
          edges: [],
        },
      };

      mockB3Request.graphqlB2B.mockResolvedValue(mockResponse);

      const params = {
        q: 'test',
        first: 10,
        offset: 0,
        beginDateAt: '2023-01-01',
        endDateAt: '2023-12-31',
        orderBy: '-lastOrderedAt',
      };

      await getOrderedProducts(params);

      expect(mockB3Request.graphqlB2B).toHaveBeenCalledWith({
        query: expect.not.stringContaining('companyId:'),
      });

      const calledQuery = mockB3Request.graphqlB2B.mock.calls[0][0].query;
      expect(calledQuery).not.toContain('companyId');
    });

    it('excludes companyId from query when companyId is 0', async () => {
      const mockResponse = {
        orderedProducts: {
          totalCount: 5,
          edges: [],
        },
      };

      mockB3Request.graphqlB2B.mockResolvedValue(mockResponse);

      const params = {
        q: 'test',
        first: 10,
        offset: 0,
        beginDateAt: '2023-01-01',
        endDateAt: '2023-12-31',
        orderBy: '-lastOrderedAt',
        companyId: 0,
      };

      await getOrderedProducts(params);

      const calledQuery = mockB3Request.graphqlB2B.mock.calls[0][0].query;
      expect(calledQuery).not.toContain('companyId');
    });

    it('excludes companyId from query when companyId is null', async () => {
      const mockResponse = {
        orderedProducts: {
          totalCount: 5,
          edges: [],
        },
      };

      mockB3Request.graphqlB2B.mockResolvedValue(mockResponse);

      const params = {
        q: 'test',
        first: 10,
        offset: 0,
        beginDateAt: '2023-01-01',
        endDateAt: '2023-12-31',
        orderBy: '-lastOrderedAt',
        companyId: null,
      };

      await getOrderedProducts(params);

      const calledQuery = mockB3Request.graphqlB2B.mock.calls[0][0].query;
      expect(calledQuery).not.toContain('companyId');
    });

    it('handles empty search parameters correctly', async () => {
      const mockResponse = {
        orderedProducts: {
          totalCount: 0,
          edges: [],
        },
      };

      mockB3Request.graphqlB2B.mockResolvedValue(mockResponse);

      const params = {
        q: '',
        first: 10,
        offset: 0,
        beginDateAt: '',
        endDateAt: '',
        orderBy: '',
      };

      await getOrderedProducts(params);

      const calledQuery = mockB3Request.graphqlB2B.mock.calls[0][0].query;
      expect(calledQuery).toContain('q: ""');
      expect(calledQuery).toContain('beginDateAt: ""');
      expect(calledQuery).toContain('endDateAt: ""');
      expect(calledQuery).toContain('orderBy: ""');
      expect(calledQuery).not.toContain('companyId');
    });

    it('returns the correct response structure', async () => {
      const mockResponse = {
        orderedProducts: {
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
          },
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
              },
            },
          ],
        },
      };

      mockB3Request.graphqlB2B.mockResolvedValue(mockResponse);

      const params = {
        q: 'test',
        first: 10,
        offset: 0,
        beginDateAt: '2023-01-01',
        endDateAt: '2023-12-31',
        orderBy: '-lastOrderedAt',
        companyId: 789,
      };

      const result = await getOrderedProducts(params);

      expect(result).toEqual(mockResponse);
      expect(result.orderedProducts.totalCount).toBe(2);
      expect(result.orderedProducts.edges).toHaveLength(1);
      expect(result.orderedProducts.edges[0].node.productName).toBe('Test Product 1');
    });
  });

  describe('getBcOrderedProducts', () => {
    it('uses the same query structure as getOrderedProducts', async () => {
      const mockResponse = {
        orderedProducts: {
          totalCount: 3,
          edges: [],
        },
      };

      mockB3Request.graphqlB2B.mockResolvedValue(mockResponse);

      const params = {
        q: 'bc-test',
        first: 20,
        offset: 10,
        beginDateAt: '2023-06-01',
        endDateAt: '2023-06-30',
        orderBy: '-createdAt',
        companyId: 456,
      };

      await getBcOrderedProducts(params);

      expect(mockB3Request.graphqlB2B).toHaveBeenCalledWith({
        query: expect.stringContaining('companyId: 456'),
      });

      const calledQuery = mockB3Request.graphqlB2B.mock.calls[0][0].query;
      expect(calledQuery).toContain('q: "bc-test"');
      expect(calledQuery).toContain('first: 20');
      expect(calledQuery).toContain('offset: 10');
      expect(calledQuery).toContain('companyId: 456');
    });
  });

  describe('Child Company Representation Scenarios', () => {
    it('fetches parent company products when no child company is selected', async () => {
      const mockResponse = {
        orderedProducts: {
          totalCount: 5,
          edges: [],
        },
      };

      mockB3Request.graphqlB2B.mockResolvedValue(mockResponse);

      const params = {
        q: '',
        first: 12,
        offset: 0,
        beginDateAt: '2023-01-01',
        endDateAt: '2023-12-31',
        orderBy: '-lastOrderedAt',
      };

      await getOrderedProducts(params);

      const calledQuery = mockB3Request.graphqlB2B.mock.calls[0][0].query;
      expect(calledQuery).not.toContain('companyId');
    });

    it('fetches child company products when representing a child company', async () => {
      const mockResponse = {
        orderedProducts: {
          totalCount: 3,
          edges: [
            {
              node: {
                id: '1',
                productName: 'Child Company Product',
                variantSku: 'CHILD-SKU-1',
                productId: 999,
                variantId: 888,
              },
            },
          ],
        },
      };

      mockB3Request.graphqlB2B.mockResolvedValue(mockResponse);

      const childCompanyId = 123;
      const params = {
        q: '',
        first: 12,
        offset: 0,
        beginDateAt: '2023-01-01',
        endDateAt: '2023-12-31',
        orderBy: '-lastOrderedAt',
        companyId: childCompanyId,
      };

      const result = await getOrderedProducts(params);

      const calledQuery = mockB3Request.graphqlB2B.mock.calls[0][0].query;
      expect(calledQuery).toContain(`companyId: ${childCompanyId}`);
      expect(result.orderedProducts.edges[0].node.productName).toBe('Child Company Product');
    });

    it('switches between different child companies correctly', async () => {
      const mockResponse1 = {
        orderedProducts: {
          totalCount: 2,
          edges: [
            {
              node: {
                id: '1',
                productName: 'Child Company A Product',
              },
            },
          ],
        },
      };

      const mockResponse2 = {
        orderedProducts: {
          totalCount: 4,
          edges: [
            {
              node: {
                id: '2',
                productName: 'Child Company B Product',
              },
            },
          ],
        },
      };

      // First call for child company A
      mockB3Request.graphqlB2B.mockResolvedValueOnce(mockResponse1);

      const paramsA = {
        q: '',
        first: 12,
        offset: 0,
        beginDateAt: '2023-01-01',
        endDateAt: '2023-12-31',
        orderBy: '-lastOrderedAt',
        companyId: 111,
      };

      await getOrderedProducts(paramsA);

      // Second call for child company B
      mockB3Request.graphqlB2B.mockResolvedValueOnce(mockResponse2);

      const paramsB = {
        q: '',
        first: 12,
        offset: 0,
        beginDateAt: '2023-01-01',
        endDateAt: '2023-12-31',
        orderBy: '-lastOrderedAt',
        companyId: 222,
      };

      await getOrderedProducts(paramsB);

      // Verify both calls were made with correct company IDs
      expect(mockB3Request.graphqlB2B).toHaveBeenCalledTimes(2);

      const firstCallQuery = mockB3Request.graphqlB2B.mock.calls[0][0].query;
      const secondCallQuery = mockB3Request.graphqlB2B.mock.calls[1][0].query;

      expect(firstCallQuery).toContain('companyId: 111');
      expect(secondCallQuery).toContain('companyId: 222');
    });
  });
});
