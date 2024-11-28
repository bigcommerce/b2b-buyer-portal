import { useContext } from 'react';

import { GlobalContext } from '@/shared/global';

import Loading from './Loading';

function B3PageMask() {
  const {
    state: { showPageMask },
  } = useContext(GlobalContext);

  return showPageMask ? <Loading /> : null;
}

export default B3PageMask;
