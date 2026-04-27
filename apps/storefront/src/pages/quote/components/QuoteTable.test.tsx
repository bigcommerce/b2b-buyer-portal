import { buildGlobalStateWith, renderWithProviders, screen } from 'tests/test-utils';
import { vi } from 'vitest';

import { Product } from '@/types';
import { QuoteItem } from '@/types/quotes';

import QuoteTable from './QuoteTable';

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
});
