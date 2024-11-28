import { lazy, useContext, useEffect, useState } from 'react';
import { HashRouter } from 'react-router-dom';

import { usePageMask } from '@/components';
import GlobalDialog from '@/components/extraTip/GlobalDialog';
import B3RenderRouter from '@/components/layout/B3RenderRouter';
import { useB3AppOpen, useSetOpen } from '@/hooks';
import useDomHooks from '@/hooks/dom/useDomHooks';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { GlobalContext } from '@/shared/global';
import { gotoAllowedAppPage } from '@/shared/routes';
import { setChannelStoreType } from '@/shared/service/b2b';
import { CustomerRole } from '@/types';
import {
  getQuoteEnabled,
  handleHideRegisterPage,
  hideStorefrontElement,
  openPageByClick,
  removeBCMenus,
} from '@/utils';

import clearInvoiceCart from './utils/b3ClearCart';
import b2bLogger from './utils/b3Logger';
import { isUserGotoLogin } from './utils/b3logout';
import { getCompanyInfo, getCurrentCustomerInfo, loginInfo } from './utils/loginInfo';
import {
  getStoreTaxZoneRates,
  getTemPlateConfig,
  setStorefrontConfig,
} from './utils/storefrontConfig';
import { CHECKOUT_URL } from './constants';
import {
  isB2BUserSelector,
  rolePermissionSelector,
  setGlabolCommonState,
  setOpenPageReducer,
  useAppDispatch,
  useAppSelector,
} from './store';

const B3GlobalTip = lazy(() => import('@/components/B3GlobalTip'));

const B3HoverButton = lazy(() => import('@/components/outSideComponents/B3HoverButton'));

const B3MasquradeGobalTip = lazy(
  () => import('@/components/outSideComponents/B3MasquradeGobalTip'),
);

const HeadlessController = lazy(() => import('@/components/HeadlessController'));

const ThemeFrame = lazy(() => import('@/components/ThemeFrame'));

const FONT_URL = 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap';

export default function App() {
  const showPageMask = usePageMask();
  const {
    state: { quoteConfig, storefrontConfig, productQuoteEnabled, registerEnabled },
    dispatch,
  } = useContext(GlobalContext);

  const isB2BUser = useAppSelector(isB2BUserSelector);
  const storeDispatch = useAppDispatch();
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);
  const customerId = useAppSelector(({ company }) => company.customer.id);
  const emailAddress = useAppSelector(({ company }) => company.customer.emailAddress);
  const role = useAppSelector((state) => state.company.customer.role);
  const b2bId = useAppSelector((state) => state.company.customer.b2bId);
  const isClickEnterBtn = useAppSelector(({ global }) => global.isClickEnterBtn);
  const isPageComplete = useAppSelector(({ global }) => global.isPageComplete);
  const currentClickedUrl = useAppSelector(({ global }) => global.currentClickedUrl);
  const isRegisterAndLogin = useAppSelector(({ global }) => global.isRegisterAndLogin);
  const bcGraphqlToken = useAppSelector(({ company }) => company.tokens.bcGraphqlToken);
  const companyRoleName = useAppSelector((state) => state.company.customer.companyRoleName);

  const b2bPermissions = useAppSelector(rolePermissionSelector);

  const { getShoppingListPermission, getOrderPermission } = b2bPermissions;
  const [authorizedPages, setAuthorizedPages] = useState<string>('/orders');
  const IsRealJuniorBuyer =
    +role === CustomerRole.JUNIOR_BUYER && companyRoleName === 'Junior Buyer';

  useEffect(() => {
    let currentAuthorizedPages = authorizedPages;

    if (isB2BUser) {
      currentAuthorizedPages = getShoppingListPermission ? '/shoppingLists' : '/accountSettings';

      if (getOrderPermission)
        currentAuthorizedPages = IsRealJuniorBuyer ? currentAuthorizedPages : '/orders';
    }

    setAuthorizedPages(currentAuthorizedPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [IsRealJuniorBuyer, getShoppingListPermission, getOrderPermission]);

  const handleAccountClick = (href: string, isRegisterAndLogin: boolean) => {
    showPageMask(true);
    storeDispatch(
      setGlabolCommonState({
        isClickEnterBtn: true,
        currentClickedUrl: href,
        isRegisterAndLogin,
      }),
    );
  };

  const [{ isOpen, openUrl, params }, setOpenPage] = useB3AppOpen({
    isOpen: false,
    handleEnterClick: handleAccountClick,
    authorizedPages,
  });

  const {
    state: {
      portalStyle: { backgroundColor },
      cssOverride,
    },
    dispatch: styleDispatch,
  } = useContext(CustomStyleContext);

  const CUSTOM_STYLES = `
  body {
    background: ${backgroundColor};
    font-family: Roboto;
  }`;

  const [customStyles, setCustomStyle] = useState<string>(CUSTOM_STYLES);

  useDomHooks({ setOpenPage, isOpen });

  // open storefront
  useSetOpen(isOpen, openUrl, params);

  const { pathname, href, search } = window.location;

  const loginAndRegister = () => {
    dispatch({
      type: 'common',
      payload: {
        isCheckout: pathname === CHECKOUT_URL,
      },
    });

    if (/login.php/.test(pathname) && !href.includes('change_password')) {
      dispatch({
        type: 'common',
        payload: {
          isCloseGotoBCHome: true,
        },
      });

      let openUrl = '/login';
      if (/action=create_account/.test(search)) {
        openUrl = '/register';
      }
      if (/action=reset_password/.test(search)) {
        openUrl = '/forgotpassword';
      }

      setOpenPage({
        isOpen: true,
        openUrl,
      });
    }
  };

  const gotoPage = (url: string) => {
    setOpenPage({
      isOpen: true,
      openUrl: url,
    });
  };

  useEffect(() => {
    handleHideRegisterPage(registerEnabled);
  }, [registerEnabled]);

  useEffect(() => {
    removeBCMenus();
  }, []);

  useEffect(() => {
    storeDispatch(setOpenPageReducer(setOpenPage));
    loginAndRegister();
    const init = async () => {
      // bc graphql token
      if (!bcGraphqlToken) {
        await loginInfo();
      }
      setChannelStoreType();

      try {
        await Promise.allSettled([
          getStoreTaxZoneRates(),
          setStorefrontConfig(dispatch),
          getTemPlateConfig(styleDispatch, dispatch),
          getCompanyInfo(role, b2bId),
        ]);
      } catch (e) {
        b2bLogger.error(e);
      }

      const userInfo = {
        role: +role,
        isAgenting,
      };

      if (!customerId) {
        const info = await getCurrentCustomerInfo();
        if (info) {
          userInfo.role = info?.role;
        }
      }

      // background login enter judgment and refresh
      if (!href.includes('checkout') && !(customerId && !window.location.hash)) {
        await gotoAllowedAppPage(+userInfo.role, gotoPage);
      } else {
        showPageMask(false);
      }

      if (customerId) {
        clearInvoiceCart();
      }

      storeDispatch(
        setGlabolCommonState({
          isPageComplete: true,
        }),
      );
    };

    init();
    // ignore dispatch, gotoPage, loginAndRegister, setOpenPage, storeDispatch, styleDispatch
    // due they are funtions that do not depend on any reactive value
    // ignore href because is not a reactive value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b2bId, customerId, emailAddress, isAgenting, isB2BUser, role]);

  useEffect(() => {
    if (quoteConfig.length > 0 && storefrontConfig) {
      const { productQuoteEnabled, cartQuoteEnabled, shoppingListEnabled, registerEnabled } =
        getQuoteEnabled(quoteConfig, storefrontConfig, role, isB2BUser, isAgenting);

      dispatch({
        type: 'common',
        payload: {
          productQuoteEnabled,
          cartQuoteEnabled,
          shoppingListEnabled,
          registerEnabled,
        },
      });
      setTimeout(() => {
        window.b2b.initializationEnvironment.isInit = true;
      });
    }
    if (isB2BUser) hideStorefrontElement('dom.hideThemePayments');

    // ignore dispatch due it's funtion that doesn't not depend on any reactive value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isB2BUser, isAgenting, role, quoteConfig, storefrontConfig]);

  useEffect(() => {
    if (isOpen) {
      showPageMask(false);
    }
    // ignore dispatch due it's funtion that doesn't not depend on any reactive value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    const init = async () => {
      if (isClickEnterBtn && isPageComplete && currentClickedUrl) {
        // graphql bc

        const gotoUrl = openPageByClick({
          href: currentClickedUrl,
          role,
          isRegisterAndLogin,
          isAgenting,
          IsRealJuniorBuyer,
          authorizedPages,
        });

        const isGotoLogin = await isUserGotoLogin(gotoUrl);

        setOpenPage({
          isOpen: true,
          openUrl: isGotoLogin ? '/login' : gotoUrl,
        });

        showPageMask(false);
        storeDispatch(
          setGlabolCommonState({
            isClickEnterBtn: false,
          }),
        );
      }
    };

    init();
    // ignore dispatch, setOpenPage, and storeDispatch
    // due they are funtions that do not depend on any reactive value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentClickedUrl, isAgenting, isClickEnterBtn, isPageComplete, isRegisterAndLogin, role]);

  useEffect(() => {
    const { hash } = window.location;

    if (!hash.includes('login') && !hash.includes('register')) {
      const recordOpenHash = isOpen ? hash : '';
      storeDispatch(
        setGlabolCommonState({
          recordOpenHash,
        }),
      );
    }

    if (isOpen && hash === '#/') {
      setOpenPage({
        isOpen: false,
        openUrl: '',
      });
    }
    const anchorLinks = hash ? hash.split('#')[1] : '';
    if (anchorLinks && !anchorLinks.includes('/')) {
      showPageMask(false);
    }
    // ignore setOpenPage ad storeDispatch
    // due they are funtions that do not depend on any reactive value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    const { hash = '' } = window.location;

    const handleHashChange = () => (!hash || hash === '#/') && setOpenPage({ isOpen: false });

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
    // ignore setOpenPage
    // due they are funtions that do not depend on any reactive value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const cssValue = (cssOverride.css || '').replace(/\};/g, '}');

    const newStyle = `${CUSTOM_STYLES}\n${cssValue}`;

    setCustomStyle(newStyle);
  }, [cssOverride?.css, CUSTOM_STYLES]);

  return (
    <>
      <HashRouter>
        <div className="bundle-app">
          <ThemeFrame
            className={isOpen ? 'active-frame' : undefined}
            fontUrl={FONT_URL}
            customStyles={customStyles}
          >
            {isOpen ? (
              <B3RenderRouter isOpen={isOpen} openUrl={openUrl} setOpenPage={setOpenPage} />
            ) : null}
          </ThemeFrame>
        </div>
      </HashRouter>
      <B3MasquradeGobalTip setOpenPage={setOpenPage} isOpen={isOpen} />
      <B3HoverButton
        isOpen={isOpen}
        productQuoteEnabled={productQuoteEnabled}
        setOpenPage={setOpenPage}
      />
      <HeadlessController setOpenPage={setOpenPage} />
      <B3GlobalTip />
      <GlobalDialog />
    </>
  );
}
