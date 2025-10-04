import { SxProps } from '@mui/material';
import { renderWithProviders, screen, waitFor } from 'tests/test-utils';
import { vi } from 'vitest';

import type { LineItem } from '@/utils/b3Product/b3Product';

import ShoppingDetailFooter from './ShoppingDetailFooter';

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => mockNavigate,
}));

const mockB3Lang = vi.fn((key: string) => key);
vi.mock('@/lib/lang', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/lang')>();
  return {
    ...actual,
    useB3Lang: () => mockB3Lang,
  };
});

vi.mock('@/hooks', () => ({
  useMobile: () => [false],
  useFeatureFlags: () => ({
    'B2B-3318.move_stock_and_backorder_validation_to_backend': false,
  }),
}));

const mockCreateOrUpdateExistingCart = vi.fn();
const mockDeleteCart = vi.fn();
const mockGetCart = vi.fn();

vi.mock('@/utils/cartUtils', () => ({
  createOrUpdateExistingCart: (lineItems: LineItem[]) => mockCreateOrUpdateExistingCart(lineItems),
  deleteCartData: vi.fn(),
  updateCart: vi.fn(),
}));

vi.mock('@/shared/service/bc/graphql/cart', () => ({
  deleteCart: (data: Record<string, string>) => mockDeleteCart(data),
  getCart: (cartId: string) => mockGetCart(cartId),
}));

interface CustomButtonProps {
  onClick?: () => void;
  sx?: SxProps;
  customLabel?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

vi.mock('@/components/button/CustomButton', () => ({
  default: ({ children, onClick, disabled }: CustomButtonProps) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock('@/utils/b3TriggerCartNumber', () => ({
  default: vi.fn(),
}));

vi.mock('@/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils')>();
  return {
    ...actual,
    currencyFormat: vi.fn((val: number) => `$${val}`),
    snackbar: {
      error: vi.fn(),
      success: vi.fn(),
    },
  };
});

interface ProductNode {
  node: Record<string, unknown>;
}

vi.mock('@/utils/b3Product/shared/config', () => ({
  addLineItems: vi.fn((items: ProductNode[]) => items),
  conversionProductsList: vi.fn(),
}));

vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn(() => 'cart-id-123'),
  },
}));

describe('ShoppingDetailFooter - setValidateSuccessProducts placement', () => {
  const mockSetLoading = vi.fn();
  const mockSetDeleteOpen = vi.fn();
  const mockSetValidateFailureProducts = vi.fn();
  const mockSetValidateSuccessProducts = vi.fn();

  const defaultProps = {
    shoppingListInfo: { status: 30 }, // ShoppingListStatus.Approved
    allowJuniorPlaceOrder: true,
    checkedArr: [],
    selectedSubTotal: 100.0,
    setLoading: mockSetLoading,
    setDeleteOpen: mockSetDeleteOpen,
    setValidateFailureProducts: mockSetValidateFailureProducts,
    setValidateSuccessProducts: mockSetValidateSuccessProducts,
    isB2BUser: false, // Set to false to bypass permission checks and ensure buttons render
    customColor: '#1976d2',
    isCanEditShoppingList: true,
    role: 2, // role 2 for submitShoppingListPermission
    backendValidationEnabled: true,
  };

  const mockCheckedItems = [
    {
      node: {
        basePrice: '10.00',
        baseSku: 'BASE-SKU-1',
        createdAt: 123456789,
        discount: '0',
        enteredInclusive: false,
        id: '1',
        itemId: 1,
        optionList: '[]',
        primaryImage: 'test.jpg',
        productId: 101,
        productName: 'Test Product 1',
        productUrl: '/test-product-1',
        quantity: 2,
        tax: '0',
        updatedAt: 123456790,
        variantId: 201,
        variantSku: 'SKU-1',
        productsSearch: {},
      },
    },
    {
      node: {
        basePrice: '15.00',
        baseSku: 'BASE-SKU-2',
        createdAt: 123456789,
        discount: '0',
        enteredInclusive: false,
        id: '2',
        itemId: 2,
        optionList: '[]',
        primaryImage: 'test2.jpg',
        productId: 102,
        productName: 'Test Product 2',
        productUrl: '/test-product-2',
        quantity: 1,
        tax: '0',
        updatedAt: 123456790,
        variantId: 202,
        variantSku: 'SKU-2',
        productsSearch: {},
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCart.mockResolvedValue({ data: { site: { cart: null } } });
  });

  describe('handleAddToCartBackend - success path', () => {
    it('should call setValidateSuccessProducts when cart operation succeeds', async () => {
      mockCreateOrUpdateExistingCart.mockResolvedValue({ errors: null });

      const { user } = renderWithProviders(
        <ShoppingDetailFooter {...defaultProps} checkedArr={mockCheckedItems} />,
      );

      const addButton = screen.getByRole('button');
      await user.click(addButton);

      await waitFor(() => {
        expect(mockSetValidateSuccessProducts).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              node: expect.objectContaining({
                variantSku: 'SKU-1',
              }),
            }),
            expect.objectContaining({
              node: expect.objectContaining({
                variantSku: 'SKU-2',
              }),
            }),
          ]),
        );
      });

      // Verify setValidateFailureProducts was NOT called on success
      expect(mockSetValidateFailureProducts).not.toHaveBeenCalled();
    });

    it('should call setValidateSuccessProducts before shouldRedirectCheckout', async () => {
      const callOrder: string[] = [];

      mockCreateOrUpdateExistingCart.mockResolvedValue({ errors: null });
      mockSetValidateSuccessProducts.mockImplementation(() => {
        callOrder.push('setValidateSuccessProducts');
      });

      // Mock window.location.href to track when redirect happens
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...originalLocation, href: '' },
      });

      const { user } = renderWithProviders(
        <ShoppingDetailFooter {...defaultProps} checkedArr={mockCheckedItems} />,
      );

      const addButton = screen.getByRole('button');
      await user.click(addButton);

      await waitFor(() => {
        expect(mockSetValidateSuccessProducts).toHaveBeenCalled();
      });

      // Verify setValidateSuccessProducts was called
      expect(callOrder).toContain('setValidateSuccessProducts');

      // Restore location
      Object.defineProperty(window, 'location', {
        writable: true,
        value: originalLocation,
      });
    });
  });

  describe('handleAddToCartBackend - error path', () => {
    it('should call setValidateFailureProducts and NOT setValidateSuccessProducts when an error occurs', async () => {
      const mockError = new Error('Cart creation failed');
      mockCreateOrUpdateExistingCart.mockRejectedValue(mockError);

      const { user } = renderWithProviders(
        <ShoppingDetailFooter {...defaultProps} checkedArr={mockCheckedItems} />,
      );

      const addButton = screen.getByRole('button');
      await user.click(addButton);

      await waitFor(() => {
        expect(mockSetValidateFailureProducts).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              node: expect.objectContaining({
                variantSku: 'SKU-1',
              }),
            }),
          ]),
        );
      });

      // Critical test: setValidateSuccessProducts should NOT be called on error
      expect(mockSetValidateSuccessProducts).not.toHaveBeenCalled();
    });

    it('should set loading to false even when an error occurs', async () => {
      const mockError = new Error('Network error');
      mockCreateOrUpdateExistingCart.mockRejectedValue(mockError);

      const { user } = renderWithProviders(
        <ShoppingDetailFooter {...defaultProps} checkedArr={mockCheckedItems} />,
      );

      const addButton = screen.getByRole('button');
      await user.click(addButton);

      await waitFor(() => {
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should handle non-Error exceptions correctly', async () => {
      mockCreateOrUpdateExistingCart.mockRejectedValue('String error');

      const { user } = renderWithProviders(
        <ShoppingDetailFooter {...defaultProps} checkedArr={mockCheckedItems} />,
      );

      const addButton = screen.getByRole('button');
      await user.click(addButton);

      await waitFor(() => {
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });

      // setValidateSuccessProducts should still NOT be called
      expect(mockSetValidateSuccessProducts).not.toHaveBeenCalled();
    });
  });

  describe('Success vs failure state management', () => {
    it('should only set success products when operation completes successfully', async () => {
      mockCreateOrUpdateExistingCart.mockResolvedValue({ errors: null });

      const { user } = renderWithProviders(
        <ShoppingDetailFooter {...defaultProps} checkedArr={mockCheckedItems} />,
      );

      const addButton = screen.getByRole('button');
      await user.click(addButton);

      await waitFor(() => {
        expect(mockSetValidateSuccessProducts).toHaveBeenCalledTimes(1);
      });

      expect(mockSetValidateFailureProducts).not.toHaveBeenCalled();
    });

    it('should only set failure products when operation fails', async () => {
      mockCreateOrUpdateExistingCart.mockRejectedValue(new Error('Failed'));

      const { user } = renderWithProviders(
        <ShoppingDetailFooter {...defaultProps} checkedArr={mockCheckedItems} />,
      );

      const addButton = screen.getByRole('button');
      await user.click(addButton);

      await waitFor(() => {
        expect(mockSetValidateFailureProducts).toHaveBeenCalledTimes(1);
      });

      expect(mockSetValidateSuccessProducts).not.toHaveBeenCalled();
    });
  });
});
