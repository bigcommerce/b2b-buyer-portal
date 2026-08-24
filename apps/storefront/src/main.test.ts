vi.mock('./react-setup', () => ({}));

describe('main bootstrap isInitListener', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '';
    window.history.pushState({}, '', '/');
    localStorage.clear();
  });

  it('replays the stored click exactly once even if isInit is assigned true again', async () => {
    await import('./main');

    const anchor = document.createElement('a');
    const clickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => {});
    window.b2b.initializationEnvironment.clickedLinkElement = anchor;

    window.b2b.initializationEnvironment.isInit = true;
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(window.b2b.initializationEnvironment.clickedLinkElement).toBeUndefined();

    window.b2b.initializationEnvironment.isInit = true;
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
