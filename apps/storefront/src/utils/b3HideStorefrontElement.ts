import config from '@b3/global-b3';

interface Setting {
  [key: string]: string;
}

interface GlobalB3 {
  [key: string]: string | Setting | undefined;
  setting?: Setting;
}

const hideStorefrontElement = (domElement: string): void => {
  const styleElement = document.createElement('style');

  styleElement.innerHTML = `
      ${(config as GlobalB3)[domElement]} {
        display: none !important;;
      }
    `;
  document.head.appendChild(styleElement);
};

export default hideStorefrontElement;
