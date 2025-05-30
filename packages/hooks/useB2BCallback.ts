export type EventType =
  | 'on-quote-create'
  | 'on-add-to-shopping-list'
  | 'on-click-cart-button'
  | 'on-login'
  | 'on-cart-created'
  | 'on-registered'
  | 'on-logout'
  | 'on-start-masquerade'
  | 'on-end-masquerade';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Args = Record<string, any>;

export const dispatchEvent = (event: EventType, data?: Args): boolean => {
  return window.b2b.callbacks.dispatchEvent(event, data);
};
