import { Dispatch, SetStateAction, useCallback, useContext, useEffect } from 'react';

import {
  getContrastColor,
  getStyles,
  setMediaStyle,
  splitCustomCssValue,
} from '@/components/outSideComponents/utils/b3CustomStyles';
import { CART_URL, CHECKOUT_URL } from '@/constants';
import config from '@/lib/config';
import { useB3Lang } from '@/lib/lang';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { useAppSelector } from '@/store';
import { CompanyStatus } from '@/types';
import { OpenPageState } from '@/types/hooks';
import { B3SStorage } from '@/utils/b3Storage';
import { globalSnackbar } from '@/utils/b3Tip';

import { useGetButtonText } from '../useGetButtonText';
import useStorageState from '../useStorageState';

import { addProductsFromCartToQuote } from './utils';

type DispatchProps = Dispatch<SetStateAction<OpenPageState>>;

interface MutationObserverProps {
  setOpenPage: DispatchProps;
  cartQuoteEnabled: boolean;
}

interface IsShowBlockPendingAccountOrderCreationTipProps {
  cartTip: number;
  checkoutTip: number;
}

const useCartToQuote = ({ setOpenPage, cartQuoteEnabled }: MutationObserverProps) => {
  const b3Lang = useB3Lang();
  const { addToQuoteFromCookie: addToQuote, addLoading } = addProductsFromCartToQuote(
    setOpenPage,
    b3Lang,
  );

  const translationVarName = 'global.customStyles.addToAllQuoteBtn';
  const defaultButtonText = 'Add All To Quote';

  const isShowBlockPendingAccountOrderCreationTipInit = {
    cartTip: 0,
    checkoutTip: 0,
  };

  const [isShowBlockPendingAccountOrderCreationTip, setIsShowBlockPendingAccountOrderCreationTip] =
    useStorageState<IsShowBlockPendingAccountOrderCreationTipProps>(
      'sf-isShowBlockPendingAccountOrderCreationTip',
      isShowBlockPendingAccountOrderCreationTipInit,
      sessionStorage,
    );

  const {
    state: { addToAllQuoteBtn },
  } = useContext(CustomStyleContext);

  const companyStatus = useAppSelector(({ company }) => company.companyInfo.status);
  const blockPendingAccountOrderCreation = B3SStorage.get('blockPendingAccountOrderCreation');

  const checkIsInPage = (url: string) => window.location.href.includes(url);

  const { pathname } = window.location;

  useEffect(() => {
    if (checkIsInPage(CHECKOUT_URL) && companyStatus === CompanyStatus.REJECTED) {
      globalSnackbar.error(b3Lang('global.statusNotifications.accountRejectedOrderingDisabled'));
    }
  }, [pathname, companyStatus, b3Lang]);

  useEffect(() => {
    const showPendingAccountTip = () => {
      if (![CART_URL, CHECKOUT_URL].includes(pathname)) {
        return;
      }

      if (companyStatus || !blockPendingAccountOrderCreation) {
        return;
      }

      if (isShowBlockPendingAccountOrderCreationTip.cartTip && checkIsInPage(CART_URL)) {
        return;
      }

      if (isShowBlockPendingAccountOrderCreationTip.checkoutTip && checkIsInPage(CHECKOUT_URL)) {
        return;
      }

      if (checkIsInPage(CART_URL)) {
        globalSnackbar.warning(
          'Your account is pending approval. Ordering will be enabled after account approval',
        );
      }

      if (checkIsInPage(CHECKOUT_URL)) {
        globalSnackbar.error(
          'Your account is pending approval. Ordering will be enabled after account approval',
        );
      }

      setIsShowBlockPendingAccountOrderCreationTip({
        cartTip:
          Number(checkIsInPage(CART_URL)) + isShowBlockPendingAccountOrderCreationTip.cartTip,
        checkoutTip:
          Number(checkIsInPage(CHECKOUT_URL)) +
          isShowBlockPendingAccountOrderCreationTip.checkoutTip,
      });
    };

    showPendingAccountTip();
    // ignore to avoid adding state function otherwise it will cause many renders of tip
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, blockPendingAccountOrderCreation, companyStatus]);

  const quoteCallBack = useCallback(() => {
    const b3CartToQuote = document.querySelector('.b2b-cart-to-quote');

    const b2bLoading = document.querySelector('#b2b-div-loading');

    if (b3CartToQuote && !b2bLoading) {
      addLoading(b3CartToQuote);
      addToQuote();
    }
  }, [addLoading, addToQuote]);

  const {
    color = '',
    text = '',
    customCss = '',
    classSelector = '',
    locationSelector = '',
    enabled = false,
  } = addToAllQuoteBtn;

  const cartToQuoteBtnLabel = useGetButtonText(translationVarName, text, defaultButtonText);

  const cssInfo = splitCustomCssValue(customCss);
  const {
    cssValue,
    mediaBlocks,
  }: {
    cssValue: string;
    mediaBlocks: string[];
  } = cssInfo;
  const customTextColor = getStyles(cssValue).color || getContrastColor(color);

  useEffect(() => {
    const addToQuoteAll = document.querySelectorAll(config['dom.cartActions.container']);
    const CustomAddToQuoteAll = locationSelector ? document.querySelectorAll(locationSelector) : [];

    let cartQuoteBtnDom: CustomFieldItems | null = null;

    if (!addToQuoteAll.length && !CustomAddToQuoteAll.length) {
      return;
    }

    if (!cartQuoteEnabled || window.location.pathname.includes('checkout')) {
      document.querySelector('.b2b-cart-to-quote')?.remove();

      return;
    }

    if (document.querySelectorAll('.b2b-cart-to-quote').length) {
      const cartToQuoteBtns = document.querySelectorAll('.b2b-cart-to-quote');

      cartToQuoteBtns.forEach((button: CustomFieldItems) => {
        const cartToQuoteBtn = button;

        cartToQuoteBtn.innerHTML = cartToQuoteBtnLabel;
        cartToQuoteBtn.setAttribute('style', customCss);
        cartToQuoteBtn.style.backgroundColor = color;
        cartToQuoteBtn.style.color = customTextColor;
        cartToQuoteBtn.setAttribute('class', `b2b-cart-to-quote ${classSelector}`);

        setMediaStyle(mediaBlocks, `b2b-cart-to-quote ${classSelector}`);
      });

      return;
    }

    if (enabled) {
      (CustomAddToQuoteAll.length ? CustomAddToQuoteAll : addToQuoteAll).forEach(
        (node: CustomFieldItems) => {
          cartQuoteBtnDom = document.createElement('div');
          cartQuoteBtnDom.innerHTML = cartToQuoteBtnLabel;
          cartQuoteBtnDom.setAttribute('style', customCss);
          cartQuoteBtnDom.style.backgroundColor = color;
          cartQuoteBtnDom.style.color = customTextColor;
          cartQuoteBtnDom.setAttribute('class', `b2b-cart-to-quote ${classSelector}`);

          setMediaStyle(mediaBlocks, `b2b-cart-to-quote ${classSelector}`);
          node.appendChild(cartQuoteBtnDom);
          cartQuoteBtnDom.addEventListener('click', quoteCallBack, {
            capture: true,
          });
        },
      );
    }

    return () => {
      if (cartQuoteBtnDom) {
        cartQuoteBtnDom.removeEventListener('click', quoteCallBack);
      }
    };
  }, [
    cartQuoteEnabled,
    addToAllQuoteBtn,
    cartToQuoteBtnLabel,
    classSelector,
    color,
    customCss,
    customTextColor,
    enabled,
    locationSelector,
    mediaBlocks,
    quoteCallBack,
  ]);
};

export default useCartToQuote;
