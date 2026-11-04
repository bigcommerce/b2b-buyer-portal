import { useState } from 'react';

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
      orderBy: order === 'desc' ? sortKeys[e.key] : `-${sortKeys[e.key]}`,
    });
  };

  const resetSort = () => {
    setOrder(sortDirection || 'desc');
    setOrderBy(initKey);
    setFilterData({ ...filterData, orderBy: `-${sortKeys[initKey]}` });
  };

  return [handleSetOrderBy, order, orderBy, resetSort];
};

export { useSort };
