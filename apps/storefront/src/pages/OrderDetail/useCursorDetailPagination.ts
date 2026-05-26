import { useCallback, useRef, useState } from 'react';

/** Minimum shape every paginated item must satisfy. */
export interface CursorItem {
  id: string;
  cursor: string;
}

export interface CursorPageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CursorDetailPaginationOptions<TItem extends CursorItem> {
  /** Initial items from the list view (one full page). */
  initialItems: TItem[];
  /** Index of the item currently being viewed. */
  initialIndex: number;
  /** Page-boundary flags from the list view's most recent pageInfo. */
  initialPageInfo: CursorPageInfo;
  /**
   * Called when a page boundary is crossed.
   * Should fetch the adjacent page and return its items + pageInfo,
   * or null if the fetch fails / returns nothing.
   */
  fetchPage: (
    mode: 'before' | 'after',
    cursor: string,
  ) => Promise<{ items: TItem[]; pageInfo: CursorPageInfo } | null>;
  /**
   * Called when navigation moves to a different item.
   * Use this to trigger data loading and update the router URL.
   */
  onNavigate: (item: TItem, index: number, items: TItem[], pageInfo: CursorPageInfo) => void;
  /**
   * Called when only pageInfo changes but the current item stays the same
   * (i.e. a boundary fetch returned nothing and the direction is now exhausted).
   * Use this to persist the updated pageInfo into history state without
   * triggering a data reload.
   */
  onSyncHistory: (index: number, items: TItem[], pageInfo: CursorPageInfo) => void;
}

interface CursorDetailPaginationResult {
  hasPrev: boolean;
  hasNext: boolean;
  loading: boolean;
  handlePrev: () => Promise<void>;
  handleNext: () => Promise<void>;
}

/**
 * Generic cursor-based prev/next navigation for detail pages.
 *
 * Handles in-page navigation (zero API calls) and page-boundary fetches.
 * Domain-specific concerns (which API to call, how to update the router)
 * are delegated to `fetchPage`, `onNavigate`, and `onSyncHistory`.
 */
export function useCursorDetailPagination<TItem extends CursorItem>({
  initialItems,
  initialIndex,
  initialPageInfo,
  fetchPage,
  onNavigate,
  onSyncHistory,
}: CursorDetailPaginationOptions<TItem>): CursorDetailPaginationResult {
  const [items, setItems] = useState<TItem[]>(initialItems);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [pageInfo, setPageInfo] = useState<CursorPageInfo>(initialPageInfo);
  const [loading, setLoading] = useState(false);

  const loadingRef = useRef(false);
  const pageInfoRef = useRef(pageInfo);
  pageInfoRef.current = pageInfo;

  const hasPrev = currentIndex > 0 || pageInfo.hasPreviousPage;
  const hasNext = currentIndex < items.length - 1 || pageInfo.hasNextPage;

  const exhaustBoundary = useCallback(
    (direction: 'prev' | 'next') => {
      const updatedPageInfo =
        direction === 'prev'
          ? { ...pageInfoRef.current, hasPreviousPage: false }
          : { ...pageInfoRef.current, hasNextPage: false };
      setPageInfo(updatedPageInfo);
      onSyncHistory(currentIndex, items, updatedPageInfo);
    },
    [currentIndex, items, onSyncHistory],
  );

  const handlePrev = useCallback(async () => {
    if (!hasPrev || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      if (currentIndex > 0) {
        // In-page: instant, zero API calls.
        const newIndex = currentIndex - 1;
        setCurrentIndex(newIndex);
        onNavigate(items[newIndex], newIndex, items, pageInfo);
      } else {
        // Page boundary: fetch the previous page and land on its last item.
        const page = await fetchPage('before', items[0].cursor);
        if (page && page.items.length > 0) {
          const newIndex = page.items.length - 1;
          setItems(page.items);
          setCurrentIndex(newIndex);
          setPageInfo(page.pageInfo);
          onNavigate(page.items[newIndex], newIndex, page.items, page.pageInfo);
        } else {
          exhaustBoundary('prev');
        }
      }
    } catch {
      // Boundary fetch failed (e.g. network) — leave pageInfo unchanged so the user can retry.
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [hasPrev, currentIndex, items, pageInfo, fetchPage, onNavigate, exhaustBoundary]);

  const handleNext = useCallback(async () => {
    if (!hasNext || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      if (currentIndex < items.length - 1) {
        // In-page: instant, zero API calls.
        const newIndex = currentIndex + 1;
        setCurrentIndex(newIndex);
        onNavigate(items[newIndex], newIndex, items, pageInfo);
      } else {
        // Page boundary: fetch the next page and land on its first item.
        const page = await fetchPage('after', items[items.length - 1].cursor);
        if (page && page.items.length > 0) {
          setItems(page.items);
          setCurrentIndex(0);
          setPageInfo(page.pageInfo);
          onNavigate(page.items[0], 0, page.items, page.pageInfo);
        } else {
          exhaustBoundary('next');
        }
      }
    } catch {
      // Boundary fetch failed (e.g. network) — leave pageInfo unchanged so the user can retry.
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [hasNext, currentIndex, items, pageInfo, fetchPage, onNavigate, exhaustBoundary]);

  return { hasPrev, hasNext, loading, handlePrev, handleNext };
}
