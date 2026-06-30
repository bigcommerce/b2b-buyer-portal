import { openPageByClick } from '@/utils/b3AccountItem';

interface ResolveInitNavigationInput {
  companyLoginFlag: string | null;
  shouldOpenAllowedPage: boolean;
  isAccountPageWithoutHash: boolean;
  pathname: string;
  search: string;
  role: number;
  isAgenting: boolean;
  authorizedPages: string;
}

type InitNavigation = { type: 'goto'; url: string } | { type: 'allowedAppPage' } | { type: 'mask' };

export const resolveInitNavigation = ({
  companyLoginFlag,
  shouldOpenAllowedPage,
  isAccountPageWithoutHash,
  pathname,
  search,
  role,
  isAgenting,
  authorizedPages,
}: ResolveInitNavigationInput): InitNavigation => {
  if (companyLoginFlag) {
    return { type: 'goto', url: `/login?loginFlag=${companyLoginFlag}` };
  }

  if (!shouldOpenAllowedPage) {
    return { type: 'mask' };
  }

  if (isAccountPageWithoutHash && search) {
    return {
      type: 'goto',
      url: openPageByClick({
        href: `${pathname}${search}`,
        role,
        isRegisterAndLogin: false,
        isAgenting,
        authorizedPages,
      }),
    };
  }

  return { type: 'allowedAppPage' };
};
