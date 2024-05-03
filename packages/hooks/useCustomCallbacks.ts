export enum CallbackKey {
  onQuoteCreate = 'on-quote-create',
  onAddToShoppingList = 'on-add-to-shopping-list',
  onClickCartButton = 'on-click-cart-button',
}

export const useCallbacks = (
  callbacks: CallbackKey[] | CallbackKey,
  fn: (...args: any[]) => Promise<any> | any,
) => {
  const handleEvent = (data: any) => {
    if (Array.isArray(callbacks)) {
      return callbacks.reduce(
        (acc, callback) => (!acc ? false : window.b2b.callbacks.dispatchEvent(callback, data)),
        true,
      );
    }

    return window.b2b.callbacks.dispatchEvent(callbacks, data);
  };

  return (...args: any[]) => fn(...args, handleEvent);
};
