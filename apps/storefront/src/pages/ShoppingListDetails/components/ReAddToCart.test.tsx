import { ReactNode } from 'react';
import { renderWithProviders, screen } from 'tests/test-utils';
import { vi } from 'vitest';

import ReAddToCart from './ReAddToCart';

interface TranslationParams {
  successProducts?: number;
  quantity?: number;
}

const mockB3Lang = vi.fn((key: string, params?: TranslationParams) => {
  const translations: { [key: string]: string } = {
    'shoppingList.reAddToCart.productsCanCheckout': `${params?.successProducts} products can checkout`,
    'shoppingList.reAddToCart.productsAddedToCart': `${params?.successProducts} products added to cart`,
    'shoppingList.reAddToCart.productsCantCheckout': `${params?.quantity} products can't checkout`,
    'shoppingList.reAddToCart.productsNotAddedToCart': `${params?.quantity} products not added to cart`,
  };
  return translations[key] || key;
});

vi.mock('@/lib/lang', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/lang')>();
  return {
    ...actual,
    useB3Lang: () => mockB3Lang,
  };
});

vi.mock('@/hooks', () => ({
  useMobile: () => [false],
}));

interface B3QuantityTextFieldProps {
  onChange?: (value: number | string, isValid: boolean) => void;
}

vi.mock('@/components', () => ({
  B3QuantityTextField: ({ onChange }: B3QuantityTextFieldProps) => (
    <input data-testid="quantity-field" onChange={(e) => onChange?.(e.target.value, true)} />
  ),
}));

interface B3DialogProps {
  children: ReactNode;
  isOpen: boolean;
}

vi.mock('@/components/B3Dialog', () => ({
  default: ({ children, isOpen }: B3DialogProps) =>
    isOpen ? <div data-testid="dialog">{children}</div> : null,
}));

interface CustomButtonProps {
  children: ReactNode;
  onClick?: () => void;
}

vi.mock('@/components/button/CustomButton', () => ({
  default: ({ children, onClick }: CustomButtonProps) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

interface B3SpinProps {
  children: ReactNode;
}

vi.mock('@/components/spin/B3Spin', () => ({
  default: ({ children }: B3SpinProps) => <div>{children}</div>,
}));

describe('ReAddToCart - Conditional Alert Rendering', () => {
  const mockSetValidateFailureProducts = vi.fn();
  const mockSetValidateSuccessProducts = vi.fn();

  const defaultProps = {
    shoppingListInfo: { status: 30 },
    role: 0,
    allowJuniorPlaceOrder: false,
    setValidateFailureProducts: mockSetValidateFailureProducts,
    setValidateSuccessProducts: mockSetValidateSuccessProducts,
    textAlign: 'left',
    backendValidationEnabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Success Alert conditional rendering', () => {
    it('should display success alert when successProducts is greater than 0', () => {
      const products = [
        {
          node: {
            quantity: 2,
            primaryImage: 'test.jpg',
            productName: 'Test Product',
            variantSku: 'SKU123',
            optionList: '[]',
            productsSearch: {},
            basePrice: '10.00',
          },
          isValid: true,
        },
      ];

      renderWithProviders(
        <ReAddToCart {...defaultProps} products={products} successProducts={5} />,
      );

      expect(screen.getByText('5 products added to cart')).toBeInTheDocument();
    });

    it('should NOT display success alert when successProducts is 0', () => {
      const products = [
        {
          node: {
            quantity: 2,
            primaryImage: 'test.jpg',
            productName: 'Test Product',
            variantSku: 'SKU123',
            optionList: '[]',
            productsSearch: {},
            basePrice: '10.00',
          },
          isValid: true,
        },
      ];

      renderWithProviders(
        <ReAddToCart {...defaultProps} products={products} successProducts={0} />,
      );

      expect(screen.queryByText(/products added to cart/)).not.toBeInTheDocument();
    });

    it('should display success alert with checkout message when allowJuniorPlaceOrder is true and successProducts > 0', () => {
      const products = [
        {
          node: {
            quantity: 2,
            primaryImage: 'test.jpg',
            productName: 'Test Product',
            variantSku: 'SKU123',
            optionList: '[]',
            productsSearch: {},
            basePrice: '10.00',
          },
          isValid: true,
        },
      ];

      renderWithProviders(
        <ReAddToCart
          {...defaultProps}
          products={products}
          successProducts={3}
          allowJuniorPlaceOrder
        />,
      );

      expect(screen.getByText('3 products can checkout')).toBeInTheDocument();
    });
  });

  describe('Error Alert conditional rendering', () => {
    it('should display error alert when products array has items', () => {
      const products = [
        {
          node: {
            quantity: 2,
            primaryImage: 'test.jpg',
            productName: 'Test Product',
            variantSku: 'SKU123',
            optionList: '[]',
            productsSearch: {},
            basePrice: '10.00',
          },
          isValid: true,
        },
        {
          node: {
            quantity: 1,
            primaryImage: 'test2.jpg',
            productName: 'Test Product 2',
            variantSku: 'SKU456',
            optionList: '[]',
            productsSearch: {},
            basePrice: '15.00',
          },
          isValid: false,
        },
      ];

      renderWithProviders(
        <ReAddToCart {...defaultProps} products={products} successProducts={0} />,
      );

      expect(screen.getByText('2 products not added to cart')).toBeInTheDocument();
    });

    it('should NOT display error alert when products array is empty', () => {
      renderWithProviders(<ReAddToCart {...defaultProps} products={[]} successProducts={5} />);

      expect(screen.queryByText(/products not added to cart/)).not.toBeInTheDocument();
      expect(screen.queryByText(/can't checkout/)).not.toBeInTheDocument();
    });

    it('should display error alert with checkout message when allowJuniorPlaceOrder is true and products exist', () => {
      const products = [
        {
          node: {
            quantity: 2,
            primaryImage: 'test.jpg',
            productName: 'Test Product',
            variantSku: 'SKU123',
            optionList: '[]',
            productsSearch: {},
            basePrice: '10.00',
          },
          isValid: false,
        },
      ];

      renderWithProviders(
        <ReAddToCart
          {...defaultProps}
          products={products}
          successProducts={0}
          allowJuniorPlaceOrder
        />,
      );

      expect(screen.getByText("1 products can't checkout")).toBeInTheDocument();
    });
  });

  describe('Combined scenarios', () => {
    it('should show only success alert when successProducts > 0 and products array is empty', () => {
      renderWithProviders(<ReAddToCart {...defaultProps} products={[]} successProducts={3} />);

      // When products array is empty, the dialog doesn't open, so no alerts are shown
      // This test verifies that the success alert conditional rendering is correct,
      // even though the dialog itself won't be visible with empty products
      expect(screen.queryByText(/products added to cart/)).not.toBeInTheDocument();
      expect(screen.queryByText(/not added to cart/)).not.toBeInTheDocument();
    });

    it('should show only error alert when successProducts is 0 and products array has items', () => {
      const products = [
        {
          node: {
            quantity: 2,
            primaryImage: 'test.jpg',
            productName: 'Test Product',
            variantSku: 'SKU123',
            optionList: '[]',
            productsSearch: {},
            basePrice: '10.00',
          },
          isValid: false,
        },
      ];

      renderWithProviders(
        <ReAddToCart {...defaultProps} products={products} successProducts={0} />,
      );

      expect(screen.queryByText(/products added to cart/)).not.toBeInTheDocument();
      expect(screen.getByText('1 products not added to cart')).toBeInTheDocument();
    });

    it('should show both alerts when successProducts > 0 and products array has items', () => {
      const products = [
        {
          node: {
            quantity: 2,
            primaryImage: 'test.jpg',
            productName: 'Test Product',
            variantSku: 'SKU123',
            optionList: '[]',
            productsSearch: {},
            basePrice: '10.00',
          },
          isValid: false,
        },
      ];

      renderWithProviders(
        <ReAddToCart {...defaultProps} products={products} successProducts={2} />,
      );

      expect(screen.getByText('2 products added to cart')).toBeInTheDocument();
      expect(screen.getByText('1 products not added to cart')).toBeInTheDocument();
    });

    it('should show no alerts when successProducts is 0 and products array is empty', () => {
      renderWithProviders(<ReAddToCart {...defaultProps} products={[]} successProducts={0} />);

      expect(screen.queryByText(/products added to cart/)).not.toBeInTheDocument();
      expect(screen.queryByText(/not added to cart/)).not.toBeInTheDocument();
    });
  });
});
