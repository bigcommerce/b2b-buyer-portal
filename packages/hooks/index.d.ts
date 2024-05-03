declare interface Window {
  b2b: {
    callbacks: {
      dispatchEvent: (
        callbackKey: import('./useCustomCallbacks').CallbackKey,
        data: unknown,
      ) => boolean;
    };
  };
  b2b: {
    isInit: boolean;
  };
}
