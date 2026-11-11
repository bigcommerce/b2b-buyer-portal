import { useCallback, useState } from 'react';

const toOrderBy = (direction: 'asc' | 'desc', field: string) =>
  `${direction === 'asc' ? '' : '-'}${field}`;

const useSort = <T>(
  sortKeys: { [key: string]: string },
  initKey: string,
  filterData: T,
  setFilterData: React.Dispatch<React.SetStateAction<T>>,
  sortDirection?: 'asc' | 'desc',
): [(e: { key: string }) => void, 'asc' | 'desc', string, () => void] => {
  const [order, setOrder] = useState<'asc' | 'desc'>(sortDirection || 'desc');
  const [orderBy, setOrderBy] = useState<string>(initKey);

  const handleSetOrderBy = (e: { key: string }) => {
    const sortDirection = order === 'asc' ? 'desc' : 'asc';
    setOrder(sortDirection);
    setOrderBy(e.key);
    setFilterData({
      ...filterData,
      orderBy: toOrderBy(sortDirection, sortKeys[e.key]),
    });
  };

  const resetSort = useCallback(() => {
    const initDirection = sortDirection || 'desc';
    setOrder(initDirection);
    setOrderBy(initKey);
    setFilterData((prev) => ({ ...prev, orderBy: toOrderBy(initDirection, sortKeys[initKey]) }));
  }, [sortKeys, initKey, sortDirection, setFilterData]);

  return [handleSetOrderBy, order, orderBy, resetSort];
};

export { toOrderBy, useSort };
