import { v1 as uuid } from 'uuid';

import { AlertTip, MsgsProps } from '@/shared/dynamicallyVariable/context/config';

interface ToastOptions {
  action?: {
    label: string;
    onClick: () => void;
  };
  description?: string;
}

const getLocalHandler = (variant: AlertTip) => {
  return (message: string, options?: ToastOptions) => {
    const msgs: Array<MsgsProps> = [
      {
        id: uuid(),
        type: variant,
        msg: message || `${variant} without any info.`,
        action: options?.action,
        time: 5000,
        description: options?.description,
      },
    ];

    window.tipDispatch?.({
      type: 'tip',
      payload: {
        tipMessage: {
          autoHideDuration: 5000,
          msgs,
        },
      },
    });
  };
};

export const snackbar = window.catalyst?.toast || {
  error: getLocalHandler('error'),
  success: getLocalHandler('success'),
  info: getLocalHandler('info'),
  warning: getLocalHandler('warning'),
};

const getGlobalHandler = (variant: AlertTip) => {
  return (message: string, options?: ToastOptions) => {
    const msgs = [
      {
        id: uuid(),
        type: variant,
        msg: message || `${variant} without any info.`,
        action: options?.action,
        time: 5000,
        description: options?.description,
      },
    ];

    window.globalTipDispatch({
      type: 'globalTip',
      payload: {
        globalTipMessage: {
          autoHideDuration: 5000,
          msgs,
        },
      },
    });
  };
};

export const globalSnackbar = window.catalyst?.toast || {
  error: getGlobalHandler('error'),
  success: getGlobalHandler('success'),
  info: getGlobalHandler('info'),
  warning: getGlobalHandler('warning'),
};
