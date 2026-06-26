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

const flush = () =>
  act(async () => {
    await Promise.resolve();
  });

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

  it('does not fetch when given no product ids', async () => {
    vi.mocked(searchProducts).mockResolvedValue({ productsSearch: [] });

    renderUsePicklistInventory([]);
    await flush();

    expect(searchProducts).not.toHaveBeenCalled();
  });

  it('does not refetch ids already in the cache', async () => {
    vi.mocked(searchProducts).mockImplementation(async (data?: { productIds?: number[] }) => ({
      productsSearch: (data?.productIds ?? []).map((id) => ({ id })),
    }));

    const { result } = renderUsePicklistInventory([555]);
    await waitFor(() => expect(result.result.current[555]).toBeDefined());

    vi.mocked(searchProducts).mockClear();
    result.rerender({ productIds: [555, 666] });

    await waitFor(() => expect(result.result.current[666]).toBeDefined());

    expect(searchProducts).toHaveBeenCalledTimes(1);
    expect(searchProducts).toHaveBeenCalledWith(expect.objectContaining({ productIds: [666] }));
  });

  it('fetches only once when the search returns no match for a requested id', async () => {
    vi.mocked(searchProducts).mockResolvedValue({ productsSearch: [] });

    const { result } = renderUsePicklistInventory([555]);

    await waitFor(() => expect(searchProducts).toHaveBeenCalled());
    await flush();

    expect(searchProducts).toHaveBeenCalledTimes(1);
    expect(result.result.current).toEqual({});
  });

  it('does not apply inventory fetched under a previous company context', async () => {
    const resolvers: Array<
      (value: { productsSearch: Array<{ id: number; sku: string }> }) => void
    > = [];
    vi.mocked(searchProducts).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvers.push(resolve);
        }),
    );

    const { companyInfo } = buildCompanyStateWith('WHATEVER_VALUES');

    const { result, store } = renderHookWithProviders(
      ({ productIds }: { productIds: number[] }) => usePicklistInventory(productIds),
      {
        initialProps: { productIds: [555] },
        preloadedState: {
          company: buildCompanyStateWith({ companyInfo: { ...companyInfo, id: 'company-a' } }),
        },
      },
    );

    await waitFor(() => expect(resolvers).toHaveLength(1));

    act(() => {
      store.dispatch(setCompanyInfo({ ...companyInfo, id: 'company-b' }));
    });
    await waitFor(() => expect(resolvers).toHaveLength(2));

    // Resolve the new-context (company-b) request first, then let the previous-context (company-a)
    // request resolve LAST — so the only thing stopping it overwriting is the generation guard.
    await act(async () => {
      resolvers[1]({ productsSearch: [{ id: 555, sku: 'FRESH' }] });
    });
    await act(async () => {
      resolvers[0]({ productsSearch: [{ id: 555, sku: 'STALE' }] });
    });

    await waitFor(() => expect(result.result.current[555]).toBeDefined());
    expect((result.result.current[555] as { sku: string }).sku).toBe('FRESH');
  });
});
