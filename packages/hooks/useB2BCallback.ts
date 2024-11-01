export enum B2BEvent {
  OnQuoteCreate = 'on-quote-create',
  OnAddToShoppingList = 'on-add-to-shopping-list',
  OnClickCartButton = 'on-click-cart-button',
  OnLogin = 'on-login',
  OnLogout = 'on-logout',
}

type Dispatch<Payload> = (data?: Payload) => boolean;

// useB2BCallback injects a dispatch function to the event handler
export const useB2BCallback = <EventHandlerReturn, Payload>(
  event: B2BEvent,
  eventHandler: (
    dispatch: Dispatch<Payload>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) => Promise<EventHandlerReturn> | EventHandlerReturn,
) => {
  const dispatch = (data?: Payload) => window.b2b.callbacks.dispatchEvent(event, data);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
  return (...args: any[]) => eventHandler(dispatch, ...args);
};
