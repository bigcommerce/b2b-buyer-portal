import {
  buildCompanyStateWith,
  buildGlobalStateWith,
  buildStoreInfoStateWith,
  renderWithProviders,
  screen,
  waitFor,
} from 'tests/test-utils';

import * as b2bService from '@/shared/service/b2b';
import { CustomerRole, OrderProductItem } from '@/types';

import OrderDialog from './OrderDialog';

const preloadedState = {
  company: buildCompanyStateWith({ customer: { role: CustomerRole.B2C } }),
  storeInfo: buildStoreInfoStateWith('WHATEVER_VALUES'),
  global: buildGlobalStateWith('WHATEVER_VALUES'),
};

const dialogData = {
  dialogTitle: 'Re-Order',
  type: 'reOrder',
  description: 'Re-order description',
  confirmText: 'Re-Order',
};

const visibleProduct = {
  id: 1,
  sku: 'SKU-1',
  name: 'Test product',
  quantity: 1,
  base_price: '10.00',
  product_options: [],
  isVisible: true,
} as unknown as OrderProductItem;

const renderDialog = (props: { open: boolean; products: OrderProductItem[] }) => (
  <OrderDialog
    open={props.open}
    products={props.products}
    type="reOrder"
    currentDialogData={dialogData}
    setOpen={vi.fn()}
    itemKey="order-summary"
    orderId={123}
  />
);

describe('OrderDialog loading state', () => {
  it('re-enables the confirm button after closing while inventory is still loading', async () => {
    vi.spyOn(b2bService, 'getVariantInfoBySkus').mockReturnValue(
      new Promise(() => {}) as unknown as ReturnType<typeof b2bService.getVariantInfoBySkus>,
    );

    const { result } = renderWithProviders(
      renderDialog({ open: false, products: [visibleProduct] }),
      { preloadedState },
    );

    result.rerender(renderDialog({ open: true, products: [visibleProduct] }));
    const confirmButton = await screen.findByRole('button', { name: 'Re-Order' });
    await waitFor(() => expect(confirmButton).toBeDisabled());

    result.rerender(renderDialog({ open: false, products: [visibleProduct] }));
    result.rerender(renderDialog({ open: true, products: [] }));

    const reopenedButton = await screen.findByRole('button', { name: 'Re-Order' });
    await waitFor(() => expect(reopenedButton).toBeEnabled());
  });

  it('re-enables the confirm button when products change to none while inventory is still loading', async () => {
    vi.spyOn(b2bService, 'getVariantInfoBySkus').mockReturnValue(
      new Promise(() => {}) as unknown as ReturnType<typeof b2bService.getVariantInfoBySkus>,
    );

    const { result } = renderWithProviders(
      renderDialog({ open: true, products: [visibleProduct] }),
      { preloadedState },
    );

    const confirmButton = await screen.findByRole('button', { name: 'Re-Order' });
    await waitFor(() => expect(confirmButton).toBeDisabled());

    result.rerender(renderDialog({ open: true, products: [] }));

    await waitFor(() => expect(confirmButton).toBeEnabled());
  });
});
