import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  type CursorDetailPaginationOptions,
  CursorItem,
  CursorPageInfo,
  useCursorDetailPagination,
} from './useCursorDetailPagination';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function item(id: string): CursorItem {
  return { id, cursor: `cursor-${id}` };
}

const PAGE_A = [item('1'), item('2'), item('3')];
const PAGE_B = [item('4'), item('5'), item('6')];
const PAGE_C = [item('7'), item('8'), item('9')];

/** Returns resolved options with sensible defaults so each test only specifies what it cares about. */
function makeOptions(
  overrides: Partial<CursorDetailPaginationOptions<CursorItem>> = {},
): CursorDetailPaginationOptions<CursorItem> {
  return {
    initialItems: PAGE_A,
    initialIndex: 1, // middle item
    initialPageInfo: { hasNextPage: true, hasPreviousPage: true },
    fetchPage: vi.fn().mockResolvedValue(null),
    onNavigate: vi.fn(),
    onSyncHistory: vi.fn(),
    ...overrides,
  };
}

function renderPagination(overrides: Partial<CursorDetailPaginationOptions<CursorItem>> = {}) {
  const options = makeOptions(overrides);
  const view = renderHook(() => useCursorDetailPagination(options));
  return { view, options };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useCursorDetailPagination', () => {
  describe('initial hasPrev / hasNext', () => {
    it('enables both when in the middle of the page', () => {
      const { view } = renderPagination({ initialIndex: 1 });
      expect(view.result.current.hasPrev).toBe(true);
      expect(view.result.current.hasNext).toBe(true);
    });

    it('disables prev when at index 0 with hasPreviousPage: false', () => {
      const { view } = renderPagination({
        initialIndex: 0,
        initialPageInfo: { hasNextPage: true, hasPreviousPage: false },
      });
      expect(view.result.current.hasPrev).toBe(false);
    });

    it('disables next when at the last index with hasNextPage: false', () => {
      const { view } = renderPagination({
        initialItems: PAGE_A,
        initialIndex: 2,
        initialPageInfo: { hasNextPage: false, hasPreviousPage: true },
      });
      expect(view.result.current.hasNext).toBe(false);
    });

    it('enables prev when at index 0 but hasPreviousPage: true', () => {
      const { view } = renderPagination({
        initialIndex: 0,
        initialPageInfo: { hasNextPage: false, hasPreviousPage: true },
      });
      expect(view.result.current.hasPrev).toBe(true);
    });

    it('enables next when at the last index but hasNextPage: true', () => {
      const { view } = renderPagination({
        initialItems: PAGE_A,
        initialIndex: 2,
        initialPageInfo: { hasNextPage: true, hasPreviousPage: false },
      });
      expect(view.result.current.hasNext).toBe(true);
    });
  });

  describe('in-page navigation (no API calls)', () => {
    it('handlePrev moves to the previous item and calls onNavigate', async () => {
      const onNavigate = vi.fn();
      const fetchPage = vi.fn();
      const { view } = renderPagination({ initialIndex: 2, onNavigate, fetchPage });

      await act(() => view.result.current.handlePrev());

      expect(fetchPage).not.toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledExactlyOnceWith(
        PAGE_A[1],
        1,
        PAGE_A,
        expect.objectContaining({ hasNextPage: true, hasPreviousPage: true }),
      );
    });

    it('handleNext moves to the next item and calls onNavigate', async () => {
      const onNavigate = vi.fn();
      const fetchPage = vi.fn();
      const { view } = renderPagination({ initialIndex: 0, onNavigate, fetchPage });

      await act(() => view.result.current.handleNext());

      expect(fetchPage).not.toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledExactlyOnceWith(
        PAGE_A[1],
        1,
        PAGE_A,
        expect.objectContaining({ hasNextPage: true, hasPreviousPage: true }),
      );
    });

    it('disables prev after stepping back to index 0 with no previous page', async () => {
      const { view } = renderPagination({
        initialIndex: 1,
        initialItems: PAGE_A.slice(0, 2),
        initialPageInfo: { hasNextPage: false, hasPreviousPage: false },
      });
      await act(() => view.result.current.handlePrev());
      expect(view.result.current.hasPrev).toBe(false);
    });

    it('disables next after stepping forward to the last index with no next page', async () => {
      const { view } = renderPagination({
        initialIndex: 0,
        initialItems: PAGE_A.slice(0, 2),
        initialPageInfo: { hasNextPage: false, hasPreviousPage: false },
      });
      await act(() => view.result.current.handleNext());
      expect(view.result.current.hasNext).toBe(false);
    });
  });

  describe('page-boundary navigation — successful fetch', () => {
    it('handlePrev at index 0 calls fetchPage("before", firstCursor)', async () => {
      const fetchPage = vi.fn().mockResolvedValue({
        items: PAGE_B,
        pageInfo: { hasNextPage: true, hasPreviousPage: false },
      });
      const { view } = renderPagination({
        initialIndex: 0,
        initialPageInfo: { hasNextPage: false, hasPreviousPage: true },
        fetchPage,
      });

      await act(() => view.result.current.handlePrev());

      expect(fetchPage).toHaveBeenCalledExactlyOnceWith('before', PAGE_A[0].cursor);
    });

    it('handlePrev lands on the last item of the fetched page', async () => {
      const newPageInfo: CursorPageInfo = { hasNextPage: true, hasPreviousPage: false };
      const fetchPage = vi.fn().mockResolvedValue({ items: PAGE_B, pageInfo: newPageInfo });
      const onNavigate = vi.fn();
      const { view } = renderPagination({
        initialIndex: 0,
        initialPageInfo: { hasNextPage: false, hasPreviousPage: true },
        fetchPage,
        onNavigate,
      });

      await act(() => view.result.current.handlePrev());

      expect(onNavigate).toHaveBeenCalledExactlyOnceWith(PAGE_B[2], 2, PAGE_B, newPageInfo);
    });

    it('handleNext at the last index calls fetchPage("after", lastCursor)', async () => {
      const fetchPage = vi.fn().mockResolvedValue({
        items: PAGE_C,
        pageInfo: { hasNextPage: false, hasPreviousPage: true },
      });
      const { view } = renderPagination({
        initialItems: PAGE_A,
        initialIndex: 2,
        initialPageInfo: { hasNextPage: true, hasPreviousPage: false },
        fetchPage,
      });

      await act(() => view.result.current.handleNext());

      expect(fetchPage).toHaveBeenCalledExactlyOnceWith('after', PAGE_A[2].cursor);
    });

    it('handleNext lands on the first item of the fetched page', async () => {
      const newPageInfo: CursorPageInfo = { hasNextPage: false, hasPreviousPage: true };
      const fetchPage = vi.fn().mockResolvedValue({ items: PAGE_C, pageInfo: newPageInfo });
      const onNavigate = vi.fn();
      const { view } = renderPagination({
        initialItems: PAGE_A,
        initialIndex: 2,
        initialPageInfo: { hasNextPage: true, hasPreviousPage: false },
        fetchPage,
        onNavigate,
      });

      await act(() => view.result.current.handleNext());

      expect(onNavigate).toHaveBeenCalledExactlyOnceWith(PAGE_C[0], 0, PAGE_C, newPageInfo);
    });
  });

  describe('page-boundary navigation — fetch returns no items (exhausted)', () => {
    it('disables prev when fetchPage returns null, calls onSyncHistory not onNavigate', async () => {
      const onNavigate = vi.fn();
      const onSyncHistory = vi.fn();
      const { view } = renderPagination({
        initialIndex: 0,
        initialPageInfo: { hasNextPage: false, hasPreviousPage: true },
        fetchPage: vi.fn().mockResolvedValue(null),
        onNavigate,
        onSyncHistory,
      });

      await act(() => view.result.current.handlePrev());

      expect(view.result.current.hasPrev).toBe(false);
      expect(onNavigate).not.toHaveBeenCalled();
      expect(onSyncHistory).toHaveBeenCalledExactlyOnceWith(
        0,
        PAGE_A,
        expect.objectContaining({ hasPreviousPage: false }),
      );
    });

    it('disables next when fetchPage returns null, calls onSyncHistory not onNavigate', async () => {
      const onNavigate = vi.fn();
      const onSyncHistory = vi.fn();
      const { view } = renderPagination({
        initialItems: PAGE_A,
        initialIndex: 2,
        initialPageInfo: { hasNextPage: true, hasPreviousPage: false },
        fetchPage: vi.fn().mockResolvedValue(null),
        onNavigate,
        onSyncHistory,
      });

      await act(() => view.result.current.handleNext());

      expect(view.result.current.hasNext).toBe(false);
      expect(onNavigate).not.toHaveBeenCalled();
      expect(onSyncHistory).toHaveBeenCalledExactlyOnceWith(
        2,
        PAGE_A,
        expect.objectContaining({ hasNextPage: false }),
      );
    });

    it('disables prev when fetchPage returns an empty items array', async () => {
      const { view } = renderPagination({
        initialIndex: 0,
        initialPageInfo: { hasNextPage: false, hasPreviousPage: true },
        fetchPage: vi.fn().mockResolvedValue({
          items: [],
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
        }),
      });

      await act(() => view.result.current.handlePrev());

      expect(view.result.current.hasPrev).toBe(false);
    });

    it('disables next when fetchPage returns an empty items array', async () => {
      const { view } = renderPagination({
        initialItems: PAGE_A,
        initialIndex: 2,
        initialPageInfo: { hasNextPage: true, hasPreviousPage: false },
        fetchPage: vi.fn().mockResolvedValue({
          items: [],
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
        }),
      });

      await act(() => view.result.current.handleNext());

      expect(view.result.current.hasNext).toBe(false);
    });
  });

  describe('page-boundary navigation — fetch throws (network error)', () => {
    it('keeps prev enabled so the user can retry', async () => {
      const onNavigate = vi.fn();
      const { view } = renderPagination({
        initialIndex: 0,
        initialPageInfo: { hasNextPage: false, hasPreviousPage: true },
        fetchPage: vi.fn().mockRejectedValue(new Error('network error')),
        onNavigate,
      });

      await act(() => view.result.current.handlePrev());

      expect(view.result.current.hasPrev).toBe(true);
      expect(onNavigate).not.toHaveBeenCalled();
    });

    it('keeps next enabled so the user can retry', async () => {
      const onNavigate = vi.fn();
      const { view } = renderPagination({
        initialItems: PAGE_A,
        initialIndex: 2,
        initialPageInfo: { hasNextPage: true, hasPreviousPage: false },
        fetchPage: vi.fn().mockRejectedValue(new Error('network error')),
        onNavigate,
      });

      await act(() => view.result.current.handleNext());

      expect(view.result.current.hasNext).toBe(true);
      expect(onNavigate).not.toHaveBeenCalled();
    });

    it('succeeds on the second call after a first failure', async () => {
      const onNavigate = vi.fn();
      let calls = 0;
      const fetchPage = vi.fn().mockImplementation(() => {
        calls += 1;
        if (calls === 1) return Promise.reject(new Error('transient'));
        return Promise.resolve({
          items: PAGE_B,
          pageInfo: { hasNextPage: false, hasPreviousPage: true },
        });
      });
      const { view } = renderPagination({
        initialItems: PAGE_A,
        initialIndex: 2,
        initialPageInfo: { hasNextPage: true, hasPreviousPage: false },
        fetchPage,
        onNavigate,
      });

      // First click — fails silently
      await act(() => view.result.current.handleNext());
      expect(onNavigate).not.toHaveBeenCalled();
      expect(view.result.current.hasNext).toBe(true);

      // Second click — succeeds
      await act(() => view.result.current.handleNext());
      expect(onNavigate).toHaveBeenCalledExactlyOnceWith(
        PAGE_B[0],
        0,
        PAGE_B,
        expect.objectContaining({ hasPreviousPage: true }),
      );
    });
  });

  describe('loading guard', () => {
    it('sets loading true during a fetch and false after', async () => {
      let resolveFetch!: (value: null) => void;
      const fetchPage = vi.fn(
        () =>
          new Promise<null>((resolve) => {
            resolveFetch = resolve;
          }),
      );
      const { view } = renderPagination({
        initialIndex: 0,
        initialPageInfo: { hasNextPage: false, hasPreviousPage: true },
        fetchPage,
      });

      // Kick off but don't await yet
      act(() => {
        view.result.current.handlePrev();
      });
      expect(view.result.current.loading).toBe(true);

      // Resolve the fetch and wait for state to settle
      await act(() => {
        resolveFetch(null);
      });
      expect(view.result.current.loading).toBe(false);
    });

    it('ignores a second handlePrev call while a fetch is in flight', async () => {
      let resolveFetch!: (value: { items: typeof PAGE_B; pageInfo: CursorPageInfo }) => void;
      const fetchPage = vi.fn(
        () =>
          new Promise<{ items: typeof PAGE_B; pageInfo: CursorPageInfo }>((resolve) => {
            resolveFetch = resolve;
          }),
      );
      const { view } = renderPagination({
        initialIndex: 0,
        initialPageInfo: { hasNextPage: false, hasPreviousPage: true },
        fetchPage,
      });

      act(() => {
        view.result.current.handlePrev();
      });
      expect(view.result.current.loading).toBe(true);

      await act(() => {
        view.result.current.handlePrev();
      });

      expect(fetchPage).toHaveBeenCalledTimes(1);

      await act(() => {
        resolveFetch({ items: PAGE_B, pageInfo: { hasNextPage: true, hasPreviousPage: false } });
      });
    });

    it('ignores a second handleNext call while a fetch is in flight', async () => {
      let resolveFetch!: (value: { items: typeof PAGE_C; pageInfo: CursorPageInfo }) => void;
      const fetchPage = vi.fn(
        () =>
          new Promise<{ items: typeof PAGE_C; pageInfo: CursorPageInfo }>((resolve) => {
            resolveFetch = resolve;
          }),
      );
      const { view } = renderPagination({
        initialItems: PAGE_A,
        initialIndex: 2,
        initialPageInfo: { hasNextPage: true, hasPreviousPage: false },
        fetchPage,
      });

      act(() => {
        view.result.current.handleNext();
      });
      expect(view.result.current.loading).toBe(true);

      await act(() => {
        view.result.current.handleNext();
      });

      expect(fetchPage).toHaveBeenCalledTimes(1);

      await act(() => {
        resolveFetch({ items: PAGE_C, pageInfo: { hasNextPage: false, hasPreviousPage: true } });
      });
    });
  });

  describe('no-ops on disabled directions', () => {
    it('handlePrev does nothing when hasPrev is false', async () => {
      const onNavigate = vi.fn();
      const fetchPage = vi.fn();
      const { view } = renderPagination({
        initialIndex: 0,
        initialPageInfo: { hasNextPage: true, hasPreviousPage: false },
        onNavigate,
        fetchPage,
      });

      await act(() => view.result.current.handlePrev());

      expect(fetchPage).not.toHaveBeenCalled();
      expect(onNavigate).not.toHaveBeenCalled();
    });

    it('handleNext does nothing when hasNext is false', async () => {
      const onNavigate = vi.fn();
      const fetchPage = vi.fn();
      const { view } = renderPagination({
        initialItems: PAGE_A,
        initialIndex: 2,
        initialPageInfo: { hasNextPage: false, hasPreviousPage: true },
        onNavigate,
        fetchPage,
      });

      await act(() => view.result.current.handleNext());

      expect(fetchPage).not.toHaveBeenCalled();
      expect(onNavigate).not.toHaveBeenCalled();
    });
  });
});
