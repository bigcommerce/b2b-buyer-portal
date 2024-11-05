import { B2BEvent } from '@b3/hooks';

import CallbackManager from '@/utils/b3CallbackManager';

describe('Callback manager', () => {
  const callbackManager = new CallbackManager();

  beforeEach(async () => {
    callbackManager.callbacks.clear();
  });

  test('addEventListener register events if key does not exist', () => {
    const callback = vi.fn();
    callbackManager.addEventListener(B2BEvent.OnLogin, callback);
    callbackManager.dispatchEvent(B2BEvent.OnLogin);

    expect(callback).toHaveBeenCalled();
  });

  test('addEventListener should not register undefined values and show console error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(consoleSpy).toBeCalledTimes(0);
    // @ts-expect-error:next-line
    callbackManager.addEventListener(B2BEvent.OnLogin);
    expect(callbackManager.callbacks.size).toBe(0);
    expect(consoleSpy).toHaveBeenCalled();
  });

  test('addEventListener push new callback if key already exist', () => {
    const callback = vi.fn();
    const tesFunc = vi.fn();
    callbackManager.addEventListener(B2BEvent.OnLogout, callback);
    callbackManager.addEventListener(B2BEvent.OnLogout, tesFunc);
    expect(callbackManager.callbacks.get(B2BEvent.OnLogout)?.length).toBe(2);
  });

  test('removeEventListener delete from callback manager callback', () => {
    const callback = vi.fn();

    callbackManager.addEventListener(B2BEvent.OnAddToShoppingList, callback);
    expect(callbackManager.callbacks.get(B2BEvent.OnAddToShoppingList)?.length).toBe(1);
    callbackManager.removeEventListener(B2BEvent.OnAddToShoppingList, callback);
    expect(callbackManager.callbacks.get(B2BEvent.OnAddToShoppingList)?.length).toBe(0);
  });

  test('dispatchEvent using payload sent during subscription', () => {
    const payload = { user: 'cat', pass: 'cat' };
    const fnMock = vi.fn();
    fnMock(payload);

    callbackManager.addEventListener(B2BEvent.OnLogin, fnMock);
    callbackManager.dispatchEvent(B2BEvent.OnLogin, payload);

    expect(fnMock).toHaveBeenCalled();
  });
});
