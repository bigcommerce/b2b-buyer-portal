import { buildGlobalStateWith, renderWithProviders, screen } from 'tests/test-utils';

import type { ProductSearch } from '@/shared/service/b2b/graphql/product';
import type { PicklistSelection } from '@/utils/catalogBackorderDisplay';

import PicklistBackorderMessages from './PicklistBackorderMessages';

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

const bundleOption2: PicklistSelection = {
  modifierId: 2,
  displayName: 'Bundle option 2',
  productId: 666,
};

describe('PicklistBackorderMessages', () => {
  it('renders nothing when backorder UI is disabled', () => {
    renderWithProviders(
      <PicklistBackorderMessages
        selections={[bundleOption1]}
        picklistProductsById={{ 555: buildPicklistProduct() }}
        qty={10}
        visible
        backorderUiEnabled={false}
      />,
      withAllBackorderDisplayEnabled,
    );

    expect(screen.queryByText('Bundle option 1:')).toBeNull();
    expect(screen.queryByText('will be backordered', { exact: false })).toBeNull();
  });

  it('renders nothing when there are no selections', () => {
    renderWithProviders(
      <PicklistBackorderMessages
        selections={[]}
        picklistProductsById={{}}
        qty={10}
        visible
        backorderUiEnabled
      />,
      withAllBackorderDisplayEnabled,
    );

    expect(screen.queryByText('will be backordered', { exact: false })).toBeNull();
  });

  it('renders a labeled backorder block for a backordered picklist item', () => {
    renderWithProviders(
      <PicklistBackorderMessages
        selections={[bundleOption1]}
        picklistProductsById={{ 555: buildPicklistProduct() }}
        qty={10}
        visible
        backorderUiEnabled
      />,
      withAllBackorderDisplayEnabled,
    );

    expect(screen.getByText('Bundle option 1:')).toBeVisible();
    expect(screen.getByText('9 ready to ship')).toBeVisible();
    expect(screen.getByText('1 will be backordered')).toBeVisible();
    expect(screen.getByText('Lead time: 2-4 weeks')).toBeVisible();
  });

  it('renders a labeled block for each backordered picklist selection', () => {
    renderWithProviders(
      <PicklistBackorderMessages
        selections={[bundleOption1, bundleOption2]}
        picklistProductsById={{
          555: buildPicklistProduct(),
          666: buildPicklistProduct({ backorderMessage: 'Lead time: 6 weeks' }),
        }}
        qty={10}
        visible
        backorderUiEnabled
      />,
      withAllBackorderDisplayEnabled,
    );

    expect(screen.getByText('Bundle option 1:')).toBeVisible();
    expect(screen.getByText('Bundle option 2:')).toBeVisible();
    expect(screen.getByText('Lead time: 2-4 weeks')).toBeVisible();
    expect(screen.getByText('Lead time: 6 weeks')).toBeVisible();
  });

  it('skips a selection whose product is missing from the map', () => {
    renderWithProviders(
      <PicklistBackorderMessages
        selections={[bundleOption1]}
        picklistProductsById={{}}
        qty={10}
        visible
        backorderUiEnabled
      />,
      withAllBackorderDisplayEnabled,
    );

    expect(screen.queryByText('Bundle option 1:')).toBeNull();
    expect(screen.queryByText('will be backordered', { exact: false })).toBeNull();
  });

  it('skips a selection that is not backordered', () => {
    renderWithProviders(
      <PicklistBackorderMessages
        selections={[bundleOption1]}
        picklistProductsById={{
          555: buildPicklistProduct({ totalOnHand: 100, availableToSell: 100 }),
        }}
        qty={10}
        visible
        backorderUiEnabled
      />,
      withAllBackorderDisplayEnabled,
    );

    expect(screen.queryByText('Bundle option 1:')).toBeNull();
    expect(screen.queryByText('will be backordered', { exact: false })).toBeNull();
  });

  it('hides the label and lines when visible is false', () => {
    renderWithProviders(
      <PicklistBackorderMessages
        selections={[bundleOption1]}
        picklistProductsById={{ 555: buildPicklistProduct() }}
        qty={10}
        visible={false}
        backorderUiEnabled
      />,
      withAllBackorderDisplayEnabled,
    );

    expect(screen.queryByText('Bundle option 1:')).toBeNull();
    expect(screen.queryByText('1 will be backordered')).toBeNull();
  });

  describe('snapshot mode (ordered quotes)', () => {
    it('renders the order snapshot instead of live inventory', () => {
      renderWithProviders(
        <PicklistBackorderMessages
          selections={[bundleOption1]}
          picklistProductsById={{ 555: buildPicklistProduct({ totalOnHand: 100 }) }}
          qty={10}
          visible
          backorderUiEnabled
          snapshotByProductId={{
            555: {
              product_id: 555,
              quantity_backordered: 4,
              total_on_hand: 6,
              backorder_message: 'Ordered lead time: 3 weeks',
            },
          }}
        />,
        withAllBackorderDisplayEnabled,
      );

      expect(screen.getByText('Bundle option 1:')).toBeVisible();
      expect(screen.getByText('6 ready to ship')).toBeVisible();
      expect(screen.getByText('4 will be backordered')).toBeVisible();
      expect(screen.getByText('Ordered lead time: 3 weeks')).toBeVisible();
    });

    it('renders nothing for an item missing from the snapshot', () => {
      renderWithProviders(
        <PicklistBackorderMessages
          selections={[bundleOption1]}
          picklistProductsById={{ 555: buildPicklistProduct() }}
          qty={10}
          visible
          backorderUiEnabled
          snapshotByProductId={{}}
        />,
        withAllBackorderDisplayEnabled,
      );

      expect(screen.queryByText('Bundle option 1:')).toBeNull();
      expect(screen.queryByText('will be backordered', { exact: false })).toBeNull();
    });

    it('renders nothing for a snapshot child that is not backordered', () => {
      renderWithProviders(
        <PicklistBackorderMessages
          selections={[bundleOption1]}
          picklistProductsById={{ 555: buildPicklistProduct() }}
          qty={10}
          visible
          backorderUiEnabled
          snapshotByProductId={{
            555: { product_id: 555, quantity_backordered: 0, total_on_hand: 10 },
          }}
        />,
        withAllBackorderDisplayEnabled,
      );

      expect(screen.queryByText('Bundle option 1:')).toBeNull();
      expect(screen.queryByText('will be backordered', { exact: false })).toBeNull();
    });
  });
});
