import { useContext } from 'react';

import { GlobaledContext } from '@/shared/global';

import Loading from './Loading';

function B3PageMask() {
  const {
    state: { showPageMask },
  } = useContext(GlobaledContext);

  return showPageMask ? <Loading /> : null;
}

export default B3PageMask;
