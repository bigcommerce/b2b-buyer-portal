import CallbackManager from '@/utils/b3CallbackManager';

describe('Callback manager', () => {
  test('addEventListener register events if key does not exist', () => {
    const callbackManager = new CallbackManager();

    const callback = vi.fn();
    callbackManager.addEventListener('on-login', callback);
    callbackManager.dispatchEvent('on-login');

    expect(callback).toHaveBeenCalled();
  });

  test('addEventListener should not register undefined values and show console error (JS only)', () => {
    const callbackManager = new CallbackManager();

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(consoleSpy).toBeCalledTimes(0);
    // @ts-expect-error:next-line
    callbackManager.addEventListener('on-login');
    expect(consoleSpy).toHaveBeenCalledWith('callback should be a function');
  });

  test('addEventListener push new callback if key already exist', () => {
    const callbackManager = new CallbackManager();

    const callback = vi.fn();
    const tesFunc = vi.fn();

    callbackManager.addEventListener('on-logout', callback);
    callbackManager.addEventListener('on-logout', tesFunc);

    callbackManager.dispatchEvent('on-logout');

    expect(callback).toHaveBeenCalled();
    expect(tesFunc).toHaveBeenCalled();
  });

  test('removeEventListener delete from callback manager callback', () => {
    const callbackManager = new CallbackManager();

    const callback = vi.fn();

    callbackManager.addEventListener('on-add-to-shopping-list', callback);
    callbackManager.dispatchEvent('on-add-to-shopping-list');

    expect(callback).toHaveBeenCalled();

    callback.mockReset();

    callbackManager.removeEventListener('on-add-to-shopping-list', callback);
    callbackManager.dispatchEvent('on-add-to-shopping-list');

    expect(callback).not.toHaveBeenCalled();
  });

  test('dispatchEvent using payload sent during subscription', () => {
    const callbackManager = new CallbackManager();

    const fnMock = vi.fn();
    const data = { user: 'cat', pass: 'cat' };

    callbackManager.addEventListener('on-login', fnMock);
    callbackManager.dispatchEvent('on-login', data);

    expect(fnMock).toHaveBeenCalledWith(expect.objectContaining({ data }));
  });
});
