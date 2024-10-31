declare interface Window {
  b2b: {
    callbacks: {
      dispatchEvent: (
        callbackKey: import('./useB2BCallback').B2BEvent,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data?: any,
      ) => boolean;
    };
  };
  b2b: {
    isInit: boolean;
  };
}
