export type EventType =
  | 'on-quote-create'
  | 'on-add-to-shopping-list'
  | 'on-click-cart-button'
  | 'on-cart-created'
  | 'on-login'
  | 'on-registered'
  | 'on-logout';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Args = Record<string, any>;

export const dispatchEvent = (event: EventType, data?: Args): boolean => {
  return window.b2b.callbacks.dispatchEvent(event, data);
};
