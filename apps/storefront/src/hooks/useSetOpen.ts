import { useContext, useEffect } from 'react';

import { DynamicallyVariedContext } from '@/shared/dynamicallyVariable';
import { GlobalContext } from '@/shared/global';

const { height: defaultHeight, overflow: defaultOverflow } = document.body.style;

const useSetOpen = (isOpen: boolean, _?: string, params?: CustomFieldItems) => {
  const { dispatch } = useContext(GlobalContext);

  const { dispatch: dispatchMsg } = useContext(DynamicallyVariedContext);
  useEffect(() => {
    if (isOpen) {
      // The iframe screen is removed
      document.body.style.height = '100%';
      document.body.style.overflow = 'hidden';
      // The iframe button opens and assigns the url
      dispatch({
        type: 'common',
        payload: {
          openAPPParams: {
            quoteBtn: params?.quoteBtn || '',
            shoppingListBtn: params?.shoppingListBtn || '',
          },
        },
      });

      // close all global tips
      dispatchMsg({
        type: 'common',
        payload: {
          globalTipMessage: {
            msgs: [],
          },
          tipMessage: {
            msgs: [],
          },
        },
      });
    } else {
      document.body.style.height = defaultHeight;
      document.body.style.overflow = defaultOverflow;

      // close all tips
      dispatchMsg({
        type: 'common',
        payload: {
          tipMessage: {
            msgs: [],
          },
        },
      });
    }
    // ignore dispatch and dispatchMsg as they are not reactive values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, params?.quoteBtn, params?.shoppingListBtn]);
};

export default useSetOpen;
