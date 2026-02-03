import { vi } from 'vitest';
import { when } from 'vitest-when';

import { store } from '@/store';
import { clearCompanySlice } from '@/store/slices/company';
import { resetDraftQuoteInfo, resetDraftQuoteList } from '@/store/slices/quoteInfo';

import b2bVerifyBcLoginStatus from './b2bVerifyBcLoginStatus';
import b2bLogger from './b3Logger';
import { isB2bTokenPage, isUserGotoLogin, logoutSession } from './b3logout';

vi.mock('./b2bVerifyBcLoginStatus');
vi.mock('./b3Logger');
vi.mock('@/store', () => ({
  store: {
    dispatch: vi.fn(),
  },
}));
vi.mock('@/store/slices/company', () => ({
  clearCompanySlice: vi.fn(() => ({ type: 'company/clearCompanySlice' })),
}));
vi.mock('@/store/slices/quoteInfo', () => ({
  resetDraftQuoteList: vi.fn(() => ({ type: 'quoteInfo/resetDraftQuoteList' })),
  resetDraftQuoteInfo: vi.fn(() => ({ type: 'quoteInfo/resetDraftQuoteInfo' })),
}));

describe('b3logout utilities', () => {
  describe('isB2bTokenPage', () => {
    it('returns false for login page URL', () => {
      expect(isB2bTokenPage('/login')).toBe(false);
      expect(isB2bTokenPage('#/login')).toBe(false);
    });

    it('returns false for register page URL', () => {
      expect(isB2bTokenPage('/register')).toBe(false);
      expect(isB2bTokenPage('#/register')).toBe(false);
    });

    it('returns false for quoteDraft page URL', () => {
      expect(isB2bTokenPage('/quoteDraft')).toBe(false);
      expect(isB2bTokenPage('#/quoteDraft')).toBe(false);
    });

    it('returns false for quoteDetail page URL', () => {
      expect(isB2bTokenPage('/quoteDetail/123')).toBe(false);
    });

    it('returns false for forgotpassword page URL', () => {
      expect(isB2bTokenPage('/forgotpassword')).toBe(false);
    });

    it('returns true for B2B token-required pages', () => {
      expect(isB2bTokenPage('/orders')).toBe(true);
      expect(isB2bTokenPage('/invoices')).toBe(true);
      expect(isB2bTokenPage('/shoppingLists')).toBe(true);
      expect(isB2bTokenPage('/quotes')).toBe(true);
      expect(isB2bTokenPage('/accountSettings')).toBe(true);
    });

    describe('when gotoUrl is not provided', () => {
      const originalLocation = window.location;

      afterEach(() => {
        Object.defineProperty(window, 'location', {
          value: originalLocation,
          writable: true,
        });
      });

      it('returns false when hash does not include #/', () => {
        Object.defineProperty(window, 'location', {
          value: { hash: '' },
          writable: true,
        });

        expect(isB2bTokenPage()).toBe(false);
      });

      it('returns false when hash includes a non-B2B token page', () => {
        Object.defineProperty(window, 'location', {
          value: { hash: '#/login' },
          writable: true,
        });

        expect(isB2bTokenPage()).toBe(false);
      });

      it('returns true when hash includes a B2B token page', () => {
        Object.defineProperty(window, 'location', {
          value: { hash: '#/orders' },
          writable: true,
        });

        expect(isB2bTokenPage()).toBe(true);
      });
    });
  });

  describe('logoutSession', () => {
    it('dispatches clearCompanySlice action', () => {
      logoutSession();

      expect(store.dispatch).toHaveBeenCalledWith(clearCompanySlice());
    });

    it('dispatches resetDraftQuoteList action', () => {
      logoutSession();

      expect(store.dispatch).toHaveBeenCalledWith(resetDraftQuoteList());
    });

    it('dispatches resetDraftQuoteInfo action', () => {
      logoutSession();

      expect(store.dispatch).toHaveBeenCalledWith(resetDraftQuoteInfo());
    });

    it('dispatches all three actions', () => {
      logoutSession();

      expect(store.dispatch).toHaveBeenCalledTimes(3);
    });
  });

  describe('isUserGotoLogin', () => {
    describe('for non-B2B token pages', () => {
      it('returns false for login page and does not call logoutSession', async () => {
        const result = await isUserGotoLogin('/login');

        expect(result).toBe(false);
        expect(store.dispatch).not.toHaveBeenCalled();
      });

      it('returns false for register page and does not call logoutSession', async () => {
        const result = await isUserGotoLogin('/register');

        expect(result).toBe(false);
        expect(store.dispatch).not.toHaveBeenCalled();
      });

      it('returns false for quoteDraft page and does not call logoutSession', async () => {
        const result = await isUserGotoLogin('/quoteDraft');

        expect(result).toBe(false);
        expect(store.dispatch).not.toHaveBeenCalled();
      });

      it('returns false for quoteDetail page and does not call logoutSession', async () => {
        const result = await isUserGotoLogin('/quoteDetail/123');

        expect(result).toBe(false);
        expect(store.dispatch).not.toHaveBeenCalled();
      });

      it('returns false for forgotpassword page and does not call logoutSession', async () => {
        const result = await isUserGotoLogin('/forgotpassword');

        expect(result).toBe(false);
        expect(store.dispatch).not.toHaveBeenCalled();
      });
    });

    describe('for B2B token pages', () => {
      it('returns true and calls logoutSession when user is not logged in', async () => {
        when(vi.mocked(b2bVerifyBcLoginStatus)).calledWith().thenResolve(false);

        const result = await isUserGotoLogin('/orders');

        expect(result).toBe(true);
        expect(store.dispatch).toHaveBeenCalledWith(clearCompanySlice());
        expect(store.dispatch).toHaveBeenCalledWith(resetDraftQuoteList());
        expect(store.dispatch).toHaveBeenCalledWith(resetDraftQuoteInfo());
      });

      it('returns false and does not call logoutSession when user is logged in', async () => {
        when(vi.mocked(b2bVerifyBcLoginStatus)).calledWith().thenResolve(true);

        const result = await isUserGotoLogin('/orders');

        expect(result).toBe(false);
        expect(store.dispatch).not.toHaveBeenCalled();
      });

      it('returns false and logs error when b2bVerifyBcLoginStatus throws', async () => {
        const error = new Error('Network error');
        when(vi.mocked(b2bVerifyBcLoginStatus)).calledWith().thenReject(error);

        const result = await isUserGotoLogin('/invoices');

        expect(result).toBe(false);
        expect(b2bLogger.error).toHaveBeenCalledWith(error);
        expect(store.dispatch).not.toHaveBeenCalled();
      });

      it('handles various B2B page URLs correctly when user is not logged in', async () => {
        when(vi.mocked(b2bVerifyBcLoginStatus)).calledWith().thenResolve(false);

        expect(await isUserGotoLogin('/orders')).toBe(true);
        expect(await isUserGotoLogin('/invoices')).toBe(true);
        expect(await isUserGotoLogin('/shoppingLists')).toBe(true);
        expect(await isUserGotoLogin('/quotes')).toBe(true);
        expect(await isUserGotoLogin('/accountSettings')).toBe(true);
      });
    });
  });
});
