import { useCallback, useContext } from 'react';

import { GlobalContext } from '@/shared/global';

export const usePageMask = () => {
  const { dispatch } = useContext(GlobalContext);

  return useCallback(
    (isShow: boolean) => {
      const b2bStyleElement = document.getElementById('b2b-account-page-hide-body');

      if (b2bStyleElement) {
        b2bStyleElement.innerHTML = '';
      }

      dispatch({
        type: 'common',
        payload: {
          showPageMask: isShow,
        },
      });
    },
    [dispatch],
  );
};
