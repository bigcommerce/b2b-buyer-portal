import config from '@/lib/config';

export const requestIdleCallbackFunction: typeof window.requestIdleCallback =
  window.requestIdleCallback
    ? window.requestIdleCallback
    : (cb: IdleRequestCallback) => {
        const start = Date.now();

        return window.setTimeout(() => {
          cb({
            didTimeout: false,
            timeRemaining() {
              return Math.max(0, 50 - (Date.now() - start));
            },
          });
        }, 1);
      };

export class InitializationEnvironment {
  clickedLinkElement?: HTMLElement;

  #isInitVariable = false;

  isInitListener?: () => void;

  set isInit(value: boolean) {
    this.#isInitVariable = value;
    this.isInitListener?.();
  }

  get isInit() {
    return this.#isInitVariable;
  }
}

window.b2b = {
  ...window.b2b,
  initializationEnvironment: new InitializationEnvironment(),
};

export const initApp = async () => {
  if (window.b2b.initializationEnvironment.isInit) return;

  await import('./react-setup');
};

const clickLink = async (e: MouseEvent) => {
  window.b2b.initializationEnvironment.clickedLinkElement = e.target as HTMLElement;
  e.preventDefault();
  e.stopPropagation();
  await initApp();
};

export const bindLinks = () => {
  const links: NodeListOf<HTMLAnchorElement> = document.querySelectorAll(
    `${config['dom.registerElement']}, ${config['dom.allOtherElement']}`,
  );

  links.forEach((accessLink) => accessLink.addEventListener('click', clickLink));
};

export const unbindLinks = () => {
  const links: NodeListOf<HTMLAnchorElement> = document.querySelectorAll(
    `${config['dom.registerElement']}, ${config['dom.allOtherElement']}`,
  );

  links.forEach((accessLink) => accessLink.removeEventListener('click', clickLink));
};
