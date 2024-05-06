import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { updateOverflowStyle } from '@/store';

const useScrollBar = (open: boolean) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(updateOverflowStyle(open ? 'hidden' : 'initial'));
    // ignore dispatch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
};

export default useScrollBar;
