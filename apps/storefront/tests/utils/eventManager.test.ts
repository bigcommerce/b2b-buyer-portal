import { B2BEvent } from '@b3/hooks';

import CallbackManager from '@/utils/b3CallbackManager';

describe('Callback manager', () => {
  test('addEventListener register events', () => {
    const callback = vi.fn();
    CallbackManager.addEventListener(B2BEvent.OnLogin, callback);
    CallbackManager.dispatchEvent(B2BEvent.OnLogin);

    expect(callback).toHaveBeenCalled();
  });

  test('addEventListener should not register undefined values and show console error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // @ts-expect-error:next-line
    expect(CallbackManager.callbacks.size).toBe(0);
    expect(consoleSpy).toBeCalledTimes(0);
    // @ts-expect-error:next-line
    CallbackManager.addEventListener(B2BEvent.OnLogin);
    // @ts-expect-error:next-line
    expect(CallbackManager.callbacks.size).toBe(0);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
