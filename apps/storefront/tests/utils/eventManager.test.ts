import { B2BEvent } from '@b3/hooks';

import CallbackManager from '@/utils/b3CallbackManager';

describe('Callback manager', () => {
  test('addEventListener register events', () => {
    const cbManager = new CallbackManager();

    const callback = vi.fn();
    cbManager.addEventListener(B2BEvent.OnLogin, callback);
    cbManager.dispatchEvent(B2BEvent.OnLogin);

    expect(callback).toHaveBeenCalled();
  });

  test('addEventListener should not register undefined values and show console error', () => {
    const cbManager = new CallbackManager();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(cbManager.callbacks.size).toBe(0);
    expect(consoleSpy).toBeCalledTimes(0);

    // @ts-expect-error:next-line
    cbManager.addEventListener(B2BEvent.OnLogin);

    expect(cbManager.callbacks.size).toBe(0);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
