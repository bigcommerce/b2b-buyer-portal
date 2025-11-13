import { useRef } from 'react';

interface PaginationTableRefProps<T> extends HTMLInputElement {
  getList: () => void;
  setList: (items?: T[]) => void;
  getSelectedValue: () => void;
  refresh: () => void;
}

function useTableRef<T>(): any {
  const paginationTableRef = useRef<PaginationTableRefProps<T> | null>(null);

  return [paginationTableRef];
}

export { useTableRef };
