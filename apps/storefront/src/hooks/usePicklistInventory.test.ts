import { act, waitFor } from '@testing-library/react';
import { buildCompanyStateWith } from 'tests/test-utils';
import { renderHookWithProviders } from 'tests/utils/hook-test-utils';

import { searchProducts } from '@/shared/service/b2b';
import { setCompanyInfo } from '@/store/slices/company';

import { usePicklistInventory } from './usePicklistInventory';

vi.mock('@/shared/service/b2b', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/service/b2b')>()),
  searchProducts: vi.fn(),
}));

const renderUsePicklistInventory = (ids: number[]) =>
  renderHookWithProviders(
    ({ productIds }: { productIds: number[] }) => usePicklistInventory(productIds),
    {
      initialProps: { productIds: ids },
    },
  );

describe('usePicklistInventory', () => {
  beforeEach(() => {
    vi.mocked(searchProducts).mockReset();
  });

  it('fetches and returns inventory keyed by product id', async () => {
    vi.mocked(searchProducts).mockResolvedValue({ productsSearch: [{ id: 555 }] });

    const { result } = renderUsePicklistInventory([555]);

    await waitFor(() => expect(result.result.current[555]).toBeDefined());
    expect(searchProducts).toHaveBeenCalledWith(expect.objectContaining({ productIds: [555] }));
  });

  it('does not fetch when given no product ids', () => {
    vi.mocked(searchProducts).mockResolvedValue({ productsSearch: [] });

    const { result } = renderUsePicklistInventory([]);

    expect(result.result.current).toEqual({});
    expect(searchProducts).not.toHaveBeenCalled();
  });

  it('does not refetch when the same product ids are requested again', async () => {
    vi.mocked(searchProducts).mockResolvedValue({ productsSearch: [{ id: 555 }] });

    const { result } = renderUsePicklistInventory([555]);
    await waitFor(() => expect(result.result.current[555]).toBeDefined());

    result.rerender({ productIds: [555] });
    await waitFor(() => expect(result.result.current[555]).toBeDefined());

    expect(searchProducts).toHaveBeenCalledTimes(1);
  });

  it('returns empty inventory after the id list is cleared', async () => {
    vi.mocked(searchProducts).mockResolvedValue({ productsSearch: [{ id: 555 }] });

    const { result } = renderUsePicklistInventory([555]);
    await waitFor(() => expect(result.result.current[555]).toBeDefined());

    result.rerender({ productIds: [] });

    expect(result.result.current).toEqual({});
  });

  it('refetches under a new key when the company context changes', async () => {
    vi.mocked(searchProducts).mockImplementation(async (data?: { companyId?: string }) => ({
      productsSearch: [{ id: 555, companyId: data?.companyId }],
    }));

    const { companyInfo } = buildCompanyStateWith('WHATEVER_VALUES');

    const { store } = renderHookWithProviders(
      ({ productIds }: { productIds: number[] }) => usePicklistInventory(productIds),
      {
        initialProps: { productIds: [555] },
        preloadedState: {
          company: buildCompanyStateWith({ companyInfo: { ...companyInfo, id: 'company-a' } }),
        },
      },
    );

    await waitFor(() =>
      expect(searchProducts).toHaveBeenCalledWith(
        expect.objectContaining({ companyId: 'company-a' }),
      ),
    );

    act(() => {
      store.dispatch(setCompanyInfo({ ...companyInfo, id: 'company-b' }));
    });

    await waitFor(() =>
      expect(searchProducts).toHaveBeenCalledWith(
        expect.objectContaining({ companyId: 'company-b' }),
      ),
    );
  });
});
