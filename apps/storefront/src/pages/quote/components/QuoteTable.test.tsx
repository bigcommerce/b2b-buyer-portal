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

const picklistLineWithParentBackorder: QuoteItem = {
  node: {
    id: 'item-picklist-parent',
    optionList: JSON.stringify([{ optionId: 'attribute[100]', optionValue: '200' }]),
    calculatedValue: {},
    basePrice: 24,
    taxPrice: 0,
    quantity: 10,
    variantSku: 'PK',
    productName: 'Pickle Kit',
    productsSearch: {
      inventoryTracking: 'product',
      totalOnHand: 2,
      availableToSell: 100,
      unlimitedBackorder: false,
      backorderMessage: 'Kit restock note',
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

const picklistLineWithStaleInventory: QuoteItem = {
  node: {
    id: 'item-stale',
    productId: 999,
    optionList: JSON.stringify([{ optionId: 'attribute[100]', optionValue: '200' }]),
    calculatedValue: {},
    basePrice: 24,
    taxPrice: 0,
    quantity: 5,
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

const withPicklistMessagingEnabled = {
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

    renderWithProviders(
      <QuoteTable total={1} items={[picklistLineItem]} updateSummary={updateSummary} />,
      withPicklistMessagingEnabled,
    );

    const toggle = await screen.findByText('Backorder details');

    expect(searchProducts).toHaveBeenCalledWith(expect.objectContaining({ productIds: [555] }));

    await userEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByText('PickleFest:')).toBeVisible();
    });
    expect(screen.getByText('Ice Pick ships in 3 weeks')).toBeVisible();
  });

  it('shows the line and its picklist child backorder messages independently', async () => {
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

    renderWithProviders(
      <QuoteTable
        total={1}
        items={[picklistLineWithParentBackorder]}
        updateSummary={updateSummary}
      />,
      withPicklistMessagingEnabled,
    );

    const toggle = await screen.findByText('Backorder details');
    await userEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByText('Ice Pick ships in 3 weeks')).toBeVisible();
    });
    expect(screen.getByText('Kit restock note')).toBeVisible();
  });

  it('shows a line backorder message from live inventory even when the stored snapshot is untracked', async () => {
    vi.mocked(searchProducts).mockResolvedValue({
      productsSearch: [
        {
          id: 999,
          inventoryTracking: 'product',
          totalOnHand: 2,
          availableToSell: 100,
          unlimitedBackorder: false,
          backorderMessage: 'Kit ships next week',
        },
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

    renderWithProviders(
      <QuoteTable
        total={1}
        items={[picklistLineWithStaleInventory]}
        updateSummary={updateSummary}
      />,
      withPicklistMessagingEnabled,
    );

    const toggle = await screen.findByText('Backorder details');

    expect(searchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ productIds: expect.arrayContaining([999, 555]) }),
    );

    await userEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByText('Kit ships next week')).toBeVisible();
    });
    expect(screen.getByText('Ice Pick ships in 3 weeks')).toBeVisible();
  });
});
