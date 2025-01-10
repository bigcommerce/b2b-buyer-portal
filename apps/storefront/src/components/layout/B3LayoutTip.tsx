import { useContext, useEffect } from 'react';
import { flushSync } from 'react-dom';

import { DynamicallyVariableContext } from '@/shared/dynamicallyVariable';
import { MsgsProps } from '@/shared/dynamicallyVariable/context/config';

import B3Tip from '../B3Tip';

function B3LayoutTip() {
  const {
    state: { tipMessage },
    dispatch,
  } = useContext(DynamicallyVariableContext);

  useEffect(() => {
    window.tipDispatch = dispatch;
    // disabling as dispatch does not need to be in the deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setMsgs = (msgs: [] | Array<MsgsProps> = []) => {
    dispatch({
      type: 'common',
      payload: {
        tipMessage: {
          ...tipMessage,
          msgs,
        },
      },
    });
  };

  const { msgs = [], autoHideDuration = 5000, vertical = 'top', horizontal = 'right' } = tipMessage;

  const handleClose = (id: number | string) => {
    const newMsgs = msgs.filter((msg) => msg.id !== id);

    setMsgs(newMsgs);
  };

  const closeMsgs = (id: number | string, reason: string) => {
    if (reason === 'clickaway') return;

    flushSync(() => {
      if (msgs.length) {
        const newMsgs = msgs.filter((item: MsgsProps) => item.id !== id);

        dispatch({
          type: 'common',
          payload: {
            tipMessage: {
              ...tipMessage,
              msgs: newMsgs,
            },
          },
        });
      }
    });
  };

  return (
    <B3Tip
      msgs={msgs}
      handleAllClose={closeMsgs}
      autoHideDuration={autoHideDuration}
      handleItemClose={handleClose}
      // handleItemClose={isClose ? handleClose : undefined}
      vertical={vertical}
      horizontal={horizontal}
    />
  );
}

export default B3LayoutTip;
