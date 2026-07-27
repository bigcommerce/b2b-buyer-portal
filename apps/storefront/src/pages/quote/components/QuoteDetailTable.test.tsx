import {
  buildGlobalStateWith,
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from 'tests/test-utils';
import { vi } from 'vitest';

import { searchProducts } from '@/shared/service/b2b';

import QuoteDetailTable from './QuoteDetailTable';

type QuoteDetailTableProps = Parameters<typeof QuoteDetailTable>[0];

vi.mock('@/shared/service/b2b', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/service/b2b')>()),
  searchProducts: vi.fn(),
}));

const picklistRow = {
  id: 'item-picklist',
  productId: 112,
  productName: 'Pickle Kit',
  sku: 'PK',
  quantity: 10,
  basePrice: 24,
  offeredPrice: 24,
  tax: 0,
  optionList: '[]',
  imageUrl: '',
  options: [{ optionId: 100, optionName: 'PickleFest', optionLabel: 'Ice Pick', optionValue: 200 }],
  productsSearch: {
    inventoryTracking: 'none',
    variants: [],
    modifiers: [
      {
        id: 100,
        type: 'product_list',
        display_name: 'PickleFest',
        option_values: [{ id: 200, value_data: { product_id: 555 } }],
      },
    ],
  },
};

const productList = [picklistRow] as unknown as QuoteDetailTableProps['productList'];
const getQuoteTableDetails = (async () => ({
  edges: [{ node: picklistRow }],
  totalCount: 1,
})) as unknown as QuoteDetailTableProps['getQuoteTableDetails'];

const sharedProps = {
  total: 1,
  productList,
  getQuoteTableDetails,
  getTaxRate: () => 0,
  quoteReviewedBySalesRep: false,
  displayDiscount: false,
  currency: { token: '$', decimalToken: '.', thousandsToken: ',', decimalPlaces: 2 } as never,
  status: 1,
} satisfies QuoteDetailTableProps;

const renderTable = (messagingEnabled: boolean) =>
  renderWithProviders(<QuoteDetailTable {...sharedProps} />, {
    preloadedState: {
      global: buildGlobalStateWith({
        backorderEnabled: true,
        backorderDisplaySettings: {
          showQuantityOnBackorder: true,
          showQuantityOnHand: true,
          showBackorderMessage: true,
          showDefaultShippingExpectationPrompt: false,
          defaultShippingExpectationPrompt: '',
        },
        featureFlags: {
          'BACK-134.backorders_phase_1_1_control_messaging_on_storefront': messagingEnabled,
        },
      }),
    },
  });

describe('QuoteDetailTable picklist backorders', () => {
  beforeEach(() => {
    vi.mocked(searchProducts).mockReset();
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
      ] as never,
    });
  });

  it('fetches the picklist child product and shows its backorder message when the toggle is on', async () => {
    renderTable(true);

    const toggle = await screen.findByText('Backorder details');

    expect(searchProducts).toHaveBeenCalledWith(expect.objectContaining({ productIds: [555] }));

    await userEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByText('PickleFest:')).toBeVisible();
    });
    expect(screen.getByText('Ice Pick ships in 3 weeks')).toBeVisible();
  });

  it('hides the backorder toggle when storefront messaging is disabled', async () => {
    vi.mocked(searchProducts).mockResolvedValue({ productsSearch: [] });

    renderTable(false);

    await screen.findByText('Pickle Kit');

    expect(screen.queryByText('Backorder details')).toBeNull();
    expect(searchProducts).not.toHaveBeenCalled();
  });
});
