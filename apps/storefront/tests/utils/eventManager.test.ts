import { B2BEvent } from '@b3/hooks';

import CallbackManager from '@/utils/b3CallbackManager';

describe('Callback manager', () => {
  test('addEventListener register events if key does not exist', () => {
    const callback = vi.fn();
    CallbackManager.addEventListener(B2BEvent.OnLogin, callback);
    CallbackManager.dispatchEvent(B2BEvent.OnLogin);

    expect(callback).toHaveBeenCalled();
  });

  test('addEventListener should not register undefined values and show console error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(consoleSpy).toBeCalledTimes(0);
    // @ts-expect-error:next-line
    CallbackManager.addEventListener(B2BEvent.OnLogin);
    // @ts-expect-error:next-line
    expect(CallbackManager.callbacks.size).toBe(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  test('addEventListener push new callback if key already exist', () => {
    const callback = vi.fn();
    const tesFunc = vi.fn();
    CallbackManager.addEventListener(B2BEvent.OnLogout, callback);
    CallbackManager.addEventListener(B2BEvent.OnLogout, tesFunc);
    // @ts-expect-error:next-line
    expect(CallbackManager.callbacks.size).toBe(2);
  });

  test('removeEventListener delete from callback manager callback', () => {
    const callback = vi.fn();

    CallbackManager.addEventListener(B2BEvent.OnAddToShoppingList, callback);
    // @ts-expect-error:next-line
    expect(CallbackManager.callbacks.size).toBe(3);
    CallbackManager.removeEventListener(B2BEvent.OnAddToShoppingList, callback);
    // @ts-expect-error:next-line
    expect(CallbackManager.callbacks.size).toBe(3);
  });

  test('dispatchEvent using payload sent during subscription', () => {
    const payload = { user: 'cat', pass: 'cat' };
    const fnMock = vi.fn();
    fnMock(payload);

    CallbackManager.addEventListener(B2BEvent.OnLogin, fnMock);
    CallbackManager.dispatchEvent(B2BEvent.OnLogin, payload);

    expect(fnMock).toHaveBeenCalled();
  });
});
