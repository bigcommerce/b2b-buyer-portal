import { buildGlobalStateWith, renderWithProviders, screen } from 'tests/test-utils';

import type { ProductSearch } from '@/shared/service/b2b/graphql/product';
import type { PicklistSelection } from '@/utils/catalogBackorderDisplay';

import PicklistSelectionBackorderMessage from './PicklistSelectionBackorderMessage';

const withAllBackorderDisplayEnabled = {
  preloadedState: {
    global: buildGlobalStateWith({
      backorderDisplaySettings: {
        showQuantityOnBackorder: true,
        showQuantityOnHand: true,
        showBackorderMessage: true,
      },
    }),
  },
};

const buildPicklistProduct = (overrides: Partial<ProductSearch> = {}) =>
  ({
    inventoryTracking: 'product',
    availableToSell: 10,
    unlimitedBackorder: false,
    totalOnHand: 9,
    backorderMessage: 'Lead time: 2-4 weeks',
    variants: [],
    ...overrides,
  }) as unknown as ProductSearch;

const bundleOption1: PicklistSelection = {
  modifierId: 1,
  displayName: 'Bundle option 1',
  productId: 555,
};

describe('PicklistSelectionBackorderMessage', () => {
  it('renders a labeled backorder block for a backordered picklist product', () => {
    renderWithProviders(
      <PicklistSelectionBackorderMessage
        selection={bundleOption1}
        product={buildPicklistProduct()}
        qty={10}
      />,
      withAllBackorderDisplayEnabled,
    );

    expect(screen.getByText('Bundle option 1:')).toBeVisible();
    expect(screen.getByText('9 ready to ship')).toBeVisible();
    expect(screen.getByText('1 will be backordered')).toBeVisible();
    expect(screen.getByText('Lead time: 2-4 weeks')).toBeVisible();
  });

  it('renders nothing when the product is missing', () => {
    renderWithProviders(
      <PicklistSelectionBackorderMessage selection={bundleOption1} product={undefined} qty={10} />,
      withAllBackorderDisplayEnabled,
    );

    expect(screen.queryByText('Bundle option 1:')).toBeNull();
    expect(screen.queryByText('will be backordered', { exact: false })).toBeNull();
  });

  it('renders nothing when the product is not backordered', () => {
    renderWithProviders(
      <PicklistSelectionBackorderMessage
        selection={bundleOption1}
        product={buildPicklistProduct({ totalOnHand: 100, availableToSell: 100 })}
        qty={10}
      />,
      withAllBackorderDisplayEnabled,
    );

    expect(screen.queryByText('Bundle option 1:')).toBeNull();
    expect(screen.queryByText('will be backordered', { exact: false })).toBeNull();
  });
});
