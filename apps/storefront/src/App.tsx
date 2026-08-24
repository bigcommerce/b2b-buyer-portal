import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { HashRouter } from 'react-router-dom';

import B3GlobalTip from '@/components/B3GlobalTip';
import GlobalDialog from '@/components/extraTip/GlobalDialog';
import B3RenderRouter from '@/components/layout/B3RenderRouter';
import { usePageMask } from '@/components/loading';
import B3CompanyHierarchyExternalButton from '@/components/outSideComponents/B3CompanyHierarchyExternalButton';
import B3HoverButton from '@/components/outSideComponents/B3HoverButton';
import B3MasqueradeGlobalTip from '@/components/outSideComponents/B3MasqueradeGlobalTip';
import { ThemeFrame } from '@/components/ThemeFrame';
import HeadlessController from '@/HeadlessController';
import useDomHooks from '@/hooks/dom/useDomHooks';
import { useB3AppOpen } from '@/hooks/useB3AppOpen';
import { useSetOpen } from '@/hooks/useSetOpen';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { GlobalContext } from '@/shared/global';
import { openPageByClick, removeBCMenus } from '@/utils/b3AccountItem';
import { handleHideRegisterPage } from '@/utils/b3HideRegister';
import { hideStorefrontElement } from '@/utils/b3HideStorefrontElement';
import { getQuoteEnabled } from '@/utils/b3Init';

import { b2bJumpPath } from './utils/b3CheckPermissions/b2bPermissionPath';
import setDayjsLocale from './utils/b3DateFormat/setDayjsLocale';
import { isUserGotoLogin } from './utils/b3logout';
import { initializeApp } from './utils/initializeApp';
import { removePreMountLoginMask, shouldUseDefaultLoginStyling } from './utils/preMountLoginMask';
import { CHECKOUT_URL, PATH_ROUTES } from './constants';
import {
  isB2BUserSelector,
  rolePermissionSelector,
  setGlobalCommonState,
  setOpenPageReducer,
  useAppDispatch,
  useAppSelector,
} from './store';

const FONT_URL = 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap';

export default function App() {
  const showPageMask = usePageMask();
  const {
    state: { quoteConfig, storefrontConfig, productQuoteEnabled, registerEnabled, bcLanguage },
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
  const isDefaultLoginStyling = useRef(shouldUseDefaultLoginStyling()).current;
  const initializedCustomerId = useRef<number | string | null>(null);
  const isInitializing = useRef(false);
  const currentClickedUrl = useAppSelector(({ global }) => global.currentClickedUrl);
  const isRegisterAndLogin = useAppSelector(({ global }) => global.isRegisterAndLogin);
  const { quotesCreateActionsPermission, shoppingListCreateActionsPermission } =
    useAppSelector(rolePermissionSelector);

  const authorizedPages = useMemo(() => {
    return isB2BUser ? b2bJumpPath(role) : PATH_ROUTES.ORDERS;
  }, [role, isB2BUser]);

  useEffect(() => {
    setDayjsLocale(bcLanguage);
  }, [bcLanguage]);

  const handleAccountClick = (href: string, isRegisterAndLogin: boolean) => {
    showPageMask(true);
    storeDispatch(
      setGlobalCommonState({
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

  const { pathname, search } = window.location;

  const loginAndRegister = () => {
    dispatch({
      type: 'common',
      payload: {
        isCheckout: pathname === CHECKOUT_URL,
      },
    });

    if (pathname.includes('login.php') && !search.includes('change_password')) {
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
        openUrl = '/forgotPassword';
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

    // initializeApp() can dispatch a resolved customerId mid-call, retriggering this
    // effect for the identity it's already handling; skip that self-retrigger.
    if (isInitializing.current || initializedCustomerId.current === customerId) return;
    isInitializing.current = true;

    const init = async () => {
      const { completed, resolvedCustomerId } = await initializeApp({
        customerId,
        role,
        b2bId,
        isAgenting,
        pathname,
        search,
        gotoPage,
        showPageMask,
        dispatch,
        styleDispatch,
        storeDispatch,
      });
      isInitializing.current = false;
      initializedCustomerId.current = completed ? (resolvedCustomerId ?? null) : null;
    };

    init();
    // ignore dispatch, gotoPage, loginAndRegister, setOpenPage, storeDispatch, styleDispatch
    // due they are functions that do not depend on any reactive value
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
          productQuoteEnabled: isB2BUser
            ? productQuoteEnabled && quotesCreateActionsPermission
            : productQuoteEnabled,
          cartQuoteEnabled: isB2BUser
            ? cartQuoteEnabled && quotesCreateActionsPermission
            : cartQuoteEnabled,
          shoppingListEnabled: isB2BUser
            ? shoppingListEnabled && shoppingListCreateActionsPermission
            : shoppingListEnabled,
          registerEnabled,
        },
      });
      setTimeout(() => {
        if (!window.b2b.initializationEnvironment.isInit) {
          window.b2b.initializationEnvironment.isInit = true;
        }
      });
    }
    if (isB2BUser) hideStorefrontElement('dom.hideThemePayments');

    // ignore dispatch due it's function that doesn't not depend on any reactive value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isB2BUser,
    isAgenting,
    role,
    quoteConfig,
    storefrontConfig,
    quotesCreateActionsPermission,
    shoppingListCreateActionsPermission,
  ]);

  useEffect(() => {
    if (isPageComplete) {
      showPageMask(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPageComplete]);

  // Remove the pre-mount login mask only once initialization has finished. The
  // mask sits just below the iframe, so keeping it until init completes is
  // invisible to the user once the iframe paints, but it crucially still covers
  // the native login.php form while the (transparent) in-iframe login page is
  // loading — removing it earlier (on isOpen) caused the native form to flicker
  // through. See utils/preMountLoginMask.
  useEffect(() => {
    if (isPageComplete && isDefaultLoginStyling) {
      removePreMountLoginMask();
    }
  }, [isPageComplete, isDefaultLoginStyling]);

  useEffect(() => {
    const init = async () => {
      if (isClickEnterBtn && isPageComplete && currentClickedUrl) {
        // graphql bc

        const gotoUrl = openPageByClick({
          href: currentClickedUrl,
          role,
          isRegisterAndLogin,
          isAgenting,
          authorizedPages,
        });

        const isGotoLogin = await isUserGotoLogin(gotoUrl);

        setOpenPage({
          isOpen: true,
          openUrl: isGotoLogin ? '/login' : gotoUrl,
        });

        showPageMask(false);
        storeDispatch(
          setGlobalCommonState({
            isClickEnterBtn: false,
          }),
        );
      }
    };

    init();
    // ignore dispatch, setOpenPage, and storeDispatch
    // due they are functions that do not depend on any reactive value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentClickedUrl, isAgenting, isClickEnterBtn, isPageComplete, isRegisterAndLogin, role]);

  useEffect(() => {
    const { hash } = window.location;

    if (!hash.includes('login') && !hash.includes('register')) {
      const recordOpenHash = isOpen ? hash : '';
      storeDispatch(
        setGlobalCommonState({
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
    // due they are functions that do not depend on any reactive value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    const handleHashChange = () => {
      const { hash } = window.location;
      if (!hash || hash === '#/') {
        setOpenPage({ isOpen: false });
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
    // ignore setOpenPage
    // due they are functions that do not depend on any reactive value
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
      <B3MasqueradeGlobalTip setOpenPage={setOpenPage} isOpen={isOpen} />
      <B3CompanyHierarchyExternalButton setOpenPage={setOpenPage} isOpen={isOpen} />
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
