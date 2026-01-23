import { CustomerRole } from '@/types';

interface OpenPageByClickProps {
  href: string;
  role: number | string;
  isRegisterAndLogin: boolean;
  isAgenting: boolean;
  authorizedPages: string;
}

const hideAccountItems = [
  '/account.php?action=view_returns',
  '/account.php?action=inbox',
  '/account.php?action=recent_items',
];
const accountTarget = [
  {
    originUrl: '/account.php?action=order_status',
    newTargetUrl: '/orders',
  },
  {
    originUrl: '/account.php?action=address_book',
    newTargetUrl: '/addresses',
  },
  {
    originUrl: '/account.php?action=account_details',
    newTargetUrl: '/accountSettings',
  },
];

// Vault theme remove associated nav
const removeBCMenus = () => {
  hideAccountItems.forEach((item: string) => {
    const itemNodes = document.querySelectorAll(`[href^="${item}"]`);

    if (itemNodes.length > 0) {
      itemNodes.forEach((node: CustomFieldItems) => {
        node.parentNode.remove();
      });
    }
  });
};

const redirectBcMenus = (
  key: string,
  role: number,
  isAgenting: boolean,
  authorizedPages: string,
): string => {
  // Supermarket theme
  if (key.includes('/account.php') && !key.includes('?')) {
    switch (role) {
      case CustomerRole.SUPER_ADMIN:
        return '/dashboard';

      default:
        return authorizedPages;
    }
  }

  // Vault theme
  // superAdmin exits's url
  const superAdminExistUrl = ['/accountSettings'];
  const currentItem: CustomFieldItems =
    accountTarget.find((item) => key.includes(item.originUrl)) || {};

  // super admin
  if (currentItem.newTargetUrl && Number(role) === CustomerRole.SUPER_ADMIN) {
    return superAdminExistUrl.includes(currentItem.newTargetUrl) || isAgenting
      ? currentItem.newTargetUrl
      : '/dashboard';
  }

  if (
    (Number(role) === CustomerRole.JUNIOR_BUYER || Number(role) === CustomerRole.CUSTOM_ROLE) &&
    currentItem.newTargetUrl?.includes('order_status')
  ) {
    return authorizedPages;
  }

  if (currentItem.newTargetUrl) {
    return currentItem.newTargetUrl;
  }

  return authorizedPages;
};

const getCurrentLoginUrl = (href: string): string => {
  // quit login
  if (href.includes('logout')) {
    return '/login?loginFlag=loggedOutLogin';
  }

  if (href.includes('create_account')) {
    return '/register';
  }

  return '/login';
};

const openPageByClick = ({
  href,
  role: currentRole,
  isRegisterAndLogin,
  isAgenting,
  authorizedPages,
}: OpenPageByClickProps) => {
  if (href.includes('register')) {
    return '/register';
  }

  if (href.includes('/orders')) {
    return currentRole !== CustomerRole.GUEST ? authorizedPages : '/login';
  }

  if (
    Number(currentRole) === CustomerRole.JUNIOR_BUYER &&
    (href.includes('/orders') ||
      href.includes('/shoppingLists') ||
      href.includes('/login') ||
      href.includes('/account')) &&
    !href.includes('logout')
  ) {
    return authorizedPages;
  }

  // register and login click
  if (href.includes('/login') || isRegisterAndLogin || currentRole === CustomerRole.GUEST) {
    return getCurrentLoginUrl(href);
  }

  // other click
  return redirectBcMenus(href, Number(currentRole), isAgenting, authorizedPages);
};

export { openPageByClick, removeBCMenus };
