import { ReactElement } from 'react';
import { NavigateFunction } from 'react-router-dom';
import { v1 as uuid } from 'uuid';

import { AlertTip, MsgsProps } from '@/shared/dynamicallyVariable/context/config';

import { platform } from './basicConfig';

type Position =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'bottom-center';

interface ToastOptions {
  action?: {
    label: string;
    onClick: () => void;
  };
  description?: string;
  position?: Position;
  dismissLabel?: string;
}

interface SnackbarItemProps {
  duration?: number;
  jsx?: () => ReactElement;
  isClose?: boolean;
}

const getLocalHandler = (variant: AlertTip) => {
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

const getNewLocalHandler = (variant: AlertTip) => {
  return (
    message: string,
    options?: Pick<ToastOptions, 'action' | 'description'> & SnackbarItemProps,
  ) => {
    const msgs: Array<MsgsProps> = [
      {
        id: uuid(),
        type: variant,
        msg: message || `${variant} without any info.`,
        action: options?.action,
        isClose: options?.isClose || false,
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

export const snackbar =
  platform === 'catalyst'
    ? window.catalyst.toast
    : {
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

const getNewGlobalHandler = (variant: AlertTip) => {
  return (
    message: string,
    options?: Pick<ToastOptions, 'action' | 'description'> & SnackbarItemProps,
  ) => {
    const msgs = [
      {
        id: uuid(),
        type: variant,
        msg: message || `${variant} without any info.`,
        action: options?.action,
        isClose: options?.isClose || false,
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

export const globalSnackbar =
  platform === 'catalyst'
    ? window.catalyst.toast
    : {
        error: getGlobalHandler('error'),
        success: getGlobalHandler('success'),
        info: getGlobalHandler('info'),
        warning: getGlobalHandler('warning'),
      };

interface LinkOptions {
  isCustomEvent?: boolean;
  isOutLink?: boolean;
  navigate: NavigateFunction;
}

export const handleTipLink = (
  link: string,
  { isCustomEvent, isOutLink, navigate }: LinkOptions,
) => {
  if (isCustomEvent) {
    if (!window.b2b.callbacks.dispatchEvent('on-click-cart-button')) {
      return;
    }
  }
  if (isOutLink) {
    window.location.href = link;
  } else {
    navigate(link);
  }
};
