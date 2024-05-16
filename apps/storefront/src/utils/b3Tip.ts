import { ReactElement } from 'react';
import { v1 as uuid } from 'uuid';

import { AlertTip, MsgsProps } from '@/shared/dynamicallyVariable/context/config';

interface SnackbarItemProps {
  duration?: number;
  jsx?: () => ReactElement;
  isClose?: boolean;
}

const getLocalHandler = (variant: AlertTip) => {
  return (message: string, options?: SnackbarItemProps) => {
    const msgs: Array<MsgsProps> = [
      {
        isClose: options?.isClose || false,
        id: uuid(),
        type: variant,
        msg: message || `${variant} without any info.`,
        jsx: options?.jsx,
        time: 5000,
      },
    ];

    window.tipDispatch?.({
      type: 'tip',
      payload: {
        tipMessage: {
          autoHideDuration: options?.duration || 5000,
          msgs,
        },
      },
    });
  };
};

export const snackbar = {
  error: getLocalHandler('error'),
  success: getLocalHandler('success'),
  info: getLocalHandler('info'),
  warning: getLocalHandler('warning'),
};

const getGlobalHandler = (variant: AlertTip) => {
  return (message: string, options?: SnackbarItemProps) => {
    const msgs = [
      {
        isClose: options?.isClose || false,
        id: uuid(),
        type: variant,
        msg: message || `${variant} without any info.`,
        jsx: options?.jsx,
        time: 5000,
      },
    ];

    window.globalTipDispatch({
      type: 'globalTip',
      payload: {
        globalTipMessage: {
          autoHideDuration: options?.duration || 5000,
          msgs,
        },
      },
    });
  };
};

export const globalSnackbar = {
  error: getGlobalHandler('error'),
  success: getGlobalHandler('success'),
  info: getGlobalHandler('info'),
  warning: getGlobalHandler('warning'),
};
