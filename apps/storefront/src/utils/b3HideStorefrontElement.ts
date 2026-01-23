import config from '@/lib/config';

type Setting = Record<string, string>;

interface GlobalB3 {
  [key: string]: string | Setting | undefined;
  setting?: Setting;
}

export const hideStorefrontElement = (domElement: string): void => {
  const styleElement = document.createElement('style');

  styleElement.innerHTML = `
      ${(config as GlobalB3)[domElement]} {
        display: none !important;;
      }
    `;
  document.head.appendChild(styleElement);
};
