import { buildCompanyStateWith, http, HttpResponse, startMockServer } from 'tests/test-utils';

import { store } from '@/store';
import { clearCompanySlice, setCustomerInfo } from '@/store/slices/company';
import { CustomerRole } from '@/types';

import { gotoAllowedAppPage } from '.';

const CURRENT_JWT_URL = '*/customer/current.jwt';

const { server } = startMockServer();

describe('gotoAllowedAppPage', () => {
  beforeEach(() => {
    const { customer } = buildCompanyStateWith({
      customer: { id: 1, role: CustomerRole.ADMIN },
    });
    store.dispatch(setCustomerInfo(customer));
    window.location.hash = '#/shoppingLists';
  });

  afterEach(() => {
    store.dispatch(clearCompanySlice());
  });

  it('navigates to the current route once the BC login is verified', async () => {
    server.use(http.get(CURRENT_JWT_URL, () => HttpResponse.text('jwt-token')));
    const gotoPage = vi.fn();

    await gotoAllowedAppPage(CustomerRole.ADMIN, gotoPage);

    expect(gotoPage).toHaveBeenCalledWith('/shoppingLists');
  });

  it('keeps the user on the page they opened while the BC login was being verified', async () => {
    server.use(
      http.get(CURRENT_JWT_URL, () => {
        window.location.hash = '#/shoppingList/5278';
        return HttpResponse.text('jwt-token');
      }),
    );
    const gotoPage = vi.fn();

    await gotoAllowedAppPage(CustomerRole.ADMIN, gotoPage);

    expect(gotoPage).not.toHaveBeenCalled();
  });
});
