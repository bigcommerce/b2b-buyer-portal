import { B2BEvent } from '@b3/hooks';

import b2bLogger from './b3Logger';

type CallbackEvent = {
  data: CustomFieldItems;
  preventDefault: () => void;
};

type Callback = (event: CallbackEvent) => any;

class CallbackManager {
  callbacks: Map<B2BEvent, Callback[]>;

  constructor() {
    this.callbacks = new Map<B2BEvent, Callback[]>();
  }

  /**
   * Registers a callback function for a specific event and returns a unique hash for it.
   * @param callbackKey The event key (e.g., 'onAddToCart').
   * @param callback The callback function to register.
   * @returns A unique hash identifying the registered callback.
   */
  addEventListener(callbackKey: B2BEvent, callback: Callback): void {
    if (typeof callback !== 'function') {
      console.error('callback should be a function'); // eslint-disable-line no-console
      return;
    }

    if (!this.callbacks.has(callbackKey)) {
      this.callbacks.set(callbackKey, [callback]);
    } else {
      const list = this.callbacks.get(callbackKey) ?? [];
      const inList = list.find((cb) => cb === callback);

      if (!inList) {
        list.push(callback);
      }
    }
  }

  /**
   * Unregister a callback identified by a hash and event key.
   * @param callbackKey The event key (e.g., 'onAddToCart').
   * @param hash The unique hash of the callback to unregister.
   * @returns True if the callback was successfully removed, false otherwise.
   */
  removeEventListener(callbackKey: B2BEvent, callback: Callback): boolean {
    if (!this.callbacks.has(callbackKey)) {
      return false;
    }
    const list = this.callbacks.get(callbackKey) ?? [];
    const index = list.findIndex((cb) => cb === callback);
    if (index === -1) {
      return false;
    }
    list.splice(index, 1);
    this.callbacks.set(callbackKey, list);
    return true;
  }

  /**
   * Triggers all callbacks registered for a specific event.
   * @param callbackKey The event key (e.g., 'onAddToCart').
   * @param data The data to pass to the callback.
   * @returns True if all callbacks were successfully executed, false otherwise.
   */
  dispatchEvent(callbackKey: B2BEvent, data?: any): boolean {
    let success = true;
    const event = {
      data,
      preventDefault: () => {
        success = false;
      },
    };
    if (!this.callbacks.has(callbackKey)) {
      return true;
    }
    const list = this.callbacks.get(callbackKey) ?? [];
    list.forEach((callback) => {
      try {
        callback(event);
      } catch (e) {
        success = false;
        if (e instanceof Error) {
          b2bLogger.error(e.message);
        }
      }
    });
    return success;
  }
}

export default new CallbackManager();
