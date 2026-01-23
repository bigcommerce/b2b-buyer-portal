import config from '@/lib/config';

export const handleHideRegisterPage = (registerEnabled: boolean) => {
  const registerPageAll = document.querySelectorAll(config['dom.register']);
  // Text between sign in and register - [or]
  const navUserOrText = document.querySelectorAll('.navUser-or');

  if (registerPageAll.length > 0) {
    registerPageAll.forEach((page: CustomFieldItems) => {
      const node = page;

      node.style.display = registerEnabled ? 'inline-block' : 'none';
    });
  }

  if (navUserOrText.length > 0) {
    navUserOrText.forEach((text: CustomFieldItems) => {
      const node = text;

      node.style.display = registerEnabled ? 'inline-block' : 'none';
    });
  }
};
