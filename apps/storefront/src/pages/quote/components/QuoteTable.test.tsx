import {
  buildGlobalStateWith,
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from 'tests/test-utils';
import { vi } from 'vitest';

import { searchProducts } from '@/shared/service/b2b';
import { Product } from '@/types';
import { QuoteItem } from '@/types/quotes';

import QuoteTable from './QuoteTable';

vi.mock('@/shared/service/b2b', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/service/b2b')>()),
  searchProducts: vi.fn(),
}));

const lineItemWithBackorder: QuoteItem = {
  node: {
    id: 'item-1',
    optionList: '[]',
    calculatedValue: {},
    basePrice: 10,
    taxPrice: 0,
    quantity: 10,
    variantSku: 'V1',
    productName: 'Test product',
    productsSearch: {
      inventoryTracking: 'product',
      totalOnHand: 3,
      availableToSell: 10,
      unlimitedBackorder: false,
      backorderMessage: 'Restock soon',
    } as Product,
  },
};

const picklistLineItem: QuoteItem = {
  node: {
    id: 'item-picklist',
    optionList: JSON.stringify([{ optionId: 'attribute[100]', optionValue: '200' }]),
    calculatedValue: {},
    basePrice: 24,
    taxPrice: 0,
    quantity: 10,
    variantSku: 'PK',
    productName: 'Pickle Kit',
    productsSearch: {
      inventoryTracking: 'none',
      modifiers: [
        {
          id: 100,
          type: 'product_list',
          display_name: 'PickleFest',
          option_values: [{ id: 200, value_data: { product_id: 555 } }],
        },
      ],
    } as unknown as Product,
  },
};

const withBackorderContextAndMessaging = (featureEnabled: boolean) => ({
  preloadedState: {
    global: buildGlobalStateWith({
      backorderEnabled: true,
      backorderDisplaySettings: {
        showQuantityOnBackorder: true,
        showQuantityOnHand: false,
        showBackorderMessage: false,
        showDefaultShippingExpectationPrompt: false,
        defaultShippingExpectationPrompt: '',
      },
      featureFlags: {
        'BACK-134.backorders_phase_1_1_control_messaging_on_storefront': featureEnabled,
      },
    }),
  },
});

describe('QuoteTable backorder messaging', () => {
  it('shows the backorder details toggle when items are backordered for display and messaging is enabled', () => {
    const updateSummary = vi.fn();
    renderWithProviders(
      <QuoteTable total={1} items={[lineItemWithBackorder]} updateSummary={updateSummary} />,
      withBackorderContextAndMessaging(true),
    );

    expect(screen.getByText('Backorder details')).toBeInTheDocument();
  });

  it('hides the backorder details toggle when storefront backorder messaging is disabled, even with backordered items', () => {
    const updateSummary = vi.fn();
    renderWithProviders(
      <QuoteTable total={1} items={[lineItemWithBackorder]} updateSummary={updateSummary} />,
      withBackorderContextAndMessaging(false),
    );

    expect(screen.queryByText('Backorder details')).not.toBeInTheDocument();
  });

  it('fetches picklist child products and shows their backorder message when the toggle is on', async () => {
    vi.mocked(searchProducts).mockResolvedValue({
      productsSearch: [
        {
          id: 555,
          inventoryTracking: 'product',
          totalOnHand: 1,
          availableToSell: 100,
          unlimitedBackorder: false,
          backorderMessage: 'Ice Pick ships in 3 weeks',
        },
      ],
    });

    const updateSummary = vi.fn();
    const config = {
      preloadedState: {
        global: buildGlobalStateWith({
          backorderEnabled: true,
          backorderDisplaySettings: {
            showQuantityOnBackorder: true,
            showQuantityOnHand: false,
            showBackorderMessage: true,
            showDefaultShippingExpectationPrompt: false,
            defaultShippingExpectationPrompt: '',
          },
          featureFlags: {
            'BACK-134.backorders_phase_1_1_control_messaging_on_storefront': true,
          },
        }),
      },
    };

    renderWithProviders(
      <QuoteTable total={1} items={[picklistLineItem]} updateSummary={updateSummary} />,
      config,
    );

    // The toggle only appears once the picklist child product inventory has been fetched.
    const toggle = await screen.findByText('Backorder details');

    expect(searchProducts).toHaveBeenCalledWith(expect.objectContaining({ productIds: [555] }));

    await userEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByText('PickleFest:')).toBeVisible();
    });
    expect(screen.getByText('Ice Pick ships in 3 weeks')).toBeVisible();
  });
});
