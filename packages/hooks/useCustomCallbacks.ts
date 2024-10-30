export enum CallbackKey {
  OnQuoteCreate = 'on-quote-create',
  OnAddToShoppingList = 'on-add-to-shopping-list',
  OnClickCartButton = 'on-click-cart-button',
  OnLogin = 'on-login',
  OnLogout = 'on-logout',
}

export const useCallbacks = <T, Q>(
  callbacks: CallbackKey,
  fn: (tParam: T, b: (data?: unknown) => boolean) => Promise<Q> | Q,
) => {
  const handleEvent = (data: unknown) => {
    return window.b2b.callbacks.dispatchEvent(callbacks, data);
  };

  return (tParam: T) => fn(tParam, handleEvent);
};
