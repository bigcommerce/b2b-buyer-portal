import { Dispatch, SetStateAction, useCallback, useContext, useEffect, useRef } from 'react';
import cloneDeep from 'lodash-es/cloneDeep';

import {
  getContrastColor,
  getStyles,
  setMediaStyle,
  splitCustomCssValue,
} from '@/components/outSideComponents/utils/b3CustomStyles';
import { ADD_TO_QUOTE_DEFAULT_VALUE, TRANSLATION_ADD_TO_QUOTE_VARIABLE } from '@/constants';
import config from '@/lib/config';
import { useB3Lang } from '@/lib/lang';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { BtnProperties } from '@/shared/customStyleButton/context/config';
import {
  resetDraftQuoteInfo,
  resetDraftQuoteList,
  setQuoteUserId,
  useAppDispatch,
  useAppSelector,
} from '@/store';
import { CustomerRole } from '@/types';
import { OpenPageState } from '@/types/hooks';
import { setCartPermissions } from '@/utils/b3CheckPermissions/juniorRolePermissions';

import { useFeatureFlags } from '../useFeatureFlags';
import { useGetButtonText } from '../useGetButtonText';
import { useIsBackorderEnabled } from '../useIsBackorderEnabled';

import useDomVariation from './useDomVariation';
import usePurchasableQuote from './usePurchasableQuote';
import { addProductFromProductPageToQuote, removeElement } from './utils';

const clearQuoteDom = () => {
  const quoteButtons = document.querySelectorAll('.b2b-add-to-quote');
  quoteButtons.forEach((button) => {
    removeElement(button);
  });
};

const clearNoPurchasableQuoteDom = () => {
  const nonPurchasableQuoteButtons = document.querySelectorAll('.b2b-add-to-no-purchasable-quote');
  nonPurchasableQuoteButtons.forEach((button) => {
    removeElement(button);
  });
};

type DispatchProps = Dispatch<SetStateAction<OpenPageState>>;

interface UseMyQuoteProps {
  setOpenPage: DispatchProps;
  productQuoteEnabled: boolean;
  role: number | string;
  customerId?: number | string;
}

export const useMyQuote = ({ setOpenPage, productQuoteEnabled, role }: UseMyQuoteProps) => {
  const b3Lang = useB3Lang();
  const dispatch = useAppDispatch();
  const isBackorderEnabled = useIsBackorderEnabled();
  const featureFlags = useFeatureFlags();

  const quoteDraftUserId = useAppSelector(({ quoteInfo }) => quoteInfo.draftQuoteInfo.userId);
  const b2bId = useAppSelector(({ company }) => company.customer.b2bId);
  const isEnableProduct =
    useAppSelector(({ global }) => global.blockPendingQuoteNonPurchasableOOS.isEnableProduct) ||
    false;

  useEffect(() => {
    const isLoginAndNotB2CAccount = role !== CustomerRole.GUEST && role !== CustomerRole.B2C;

    if (
      quoteDraftUserId &&
      isLoginAndNotB2CAccount &&
      Number(quoteDraftUserId) !== 0 &&
      Number(quoteDraftUserId) !== b2bId
    ) {
      dispatch(resetDraftQuoteInfo());
      dispatch(resetDraftQuoteList());
      if (typeof b2bId === 'number') {
        dispatch(setQuoteUserId(b2bId));
      }
    }
    // ignore dispatch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b2bId, role, quoteDraftUserId]);

  const { addToQuote, addLoading } = addProductFromProductPageToQuote(
    setOpenPage,
    isEnableProduct,
    b3Lang,
    isBackorderEnabled,
    featureFlags,
  );

  const quoteCallBack = useCallback(
    (e: MouseEvent) => {
      const b3MyQuote = e.target as HTMLElement;
      const b2bLoading = document.querySelector('#b2b-div-loading');
      if (b3MyQuote && !b2bLoading) {
        addLoading(b3MyQuote);
        addToQuote(b3MyQuote);
      }
    },
    [addLoading, addToQuote],
  );

  const setCartPermissionsCallback = useCallback(() => {
    const isLoggedInAndB2BAccount = role !== CustomerRole.GUEST && role !== CustomerRole.B2C;

    setCartPermissions(isLoggedInAndB2BAccount);
  }, [role]);

  const [openQuickView] = useDomVariation(config['dom.setToQuote'], setCartPermissionsCallback);
  const [isProductPurchasable] = usePurchasableQuote(openQuickView);

  const cache = useRef<BtnProperties | null>(null);
  const {
    state: { addQuoteBtn, quoteOnNonPurchasableProductPageBtn },
  } = useContext(CustomStyleContext);

  const { color, text, customCss, classSelector, locationSelector, enabled } = addQuoteBtn;
  const {
    color: nonPurchasableColor,
    text: nonPurchasableText,
    customCss: nonPurchasableCustomCss,
    classSelector: nonPurchasableClassSelector,
    locationSelector: nonPurchasableLocationSelector,
    enabled: nonPurchasableEnabled,
  } = quoteOnNonPurchasableProductPageBtn;

  const buttonText = isProductPurchasable ? text : nonPurchasableText;
  const quoteButtonLabel = useGetButtonText(
    TRANSLATION_ADD_TO_QUOTE_VARIABLE,
    buttonText,
    ADD_TO_QUOTE_DEFAULT_VALUE,
  );

  const { cssValue, mediaBlocks } = splitCustomCssValue(
    isProductPurchasable ? customCss : nonPurchasableCustomCss,
  );

  const customTextColor =
    getStyles(cssValue).color ||
    getContrastColor(isProductPurchasable ? color : nonPurchasableColor);

  useEffect(() => {
    const addButtonStyles = (
      buttonSelector: string,
      buttonClass: string,
      isProductPurchasable: boolean,
    ) => {
      const quoteButtons = document.querySelectorAll<HTMLElement>(buttonSelector);
      quoteButtons.forEach((button) => {
        /* eslint-disable no-param-reassign */
        button.innerHTML = quoteButtonLabel;
        button.setAttribute('style', isProductPurchasable ? customCss : nonPurchasableCustomCss);
        button.style.backgroundColor = isProductPurchasable ? color : nonPurchasableColor;
        button.style.color = customTextColor;
        button.setAttribute(
          'class',
          `${buttonClass} ${isProductPurchasable ? classSelector : nonPurchasableClassSelector}`,
        );
        /* eslint-enable no-param-reassign */

        setMediaStyle(
          mediaBlocks,
          `${buttonClass} ${isProductPurchasable ? classSelector : nonPurchasableClassSelector}`,
        );
      });
    };

    const renderQuoteButton = (elements: HTMLElement[], isProductPurchasable: boolean) => {
      const buttonSelector = isProductPurchasable
        ? '.b2b-add-to-quote'
        : '.b2b-add-to-no-purchasable-quote';
      const buttonClass = isProductPurchasable
        ? 'b2b-add-to-quote'
        : 'b2b-add-to-no-purchasable-quote';
      const buttonProperties = isProductPurchasable
        ? addQuoteBtn
        : quoteOnNonPurchasableProductPageBtn;

      if (document.querySelectorAll(buttonSelector).length) {
        const cacheQuoteDom = cache.current;

        if (cacheQuoteDom) {
          const isSameStyles = Object.keys(cacheQuoteDom).every(
            (key) =>
              cacheQuoteDom[key as keyof BtnProperties] ===
              buttonProperties[key as keyof BtnProperties],
          );

          if (!isSameStyles) {
            addButtonStyles(buttonSelector, buttonClass, isProductPurchasable);
            cache.current = cloneDeep(buttonProperties);
          }
        }
      }

      const shouldRenderButton = isProductPurchasable ? enabled : nonPurchasableEnabled;
      if (shouldRenderButton) {
        elements.forEach((el) => {
          const children = el.querySelectorAll(buttonSelector);
          if (!children.length) {
            const quoteButton = document.createElement('div');
            quoteButton.innerHTML = quoteButtonLabel;
            quoteButton.setAttribute(
              'style',
              isProductPurchasable ? customCss : nonPurchasableCustomCss,
            );
            quoteButton.style.backgroundColor = isProductPurchasable ? color : nonPurchasableColor;
            quoteButton.style.color = customTextColor;
            quoteButton.setAttribute(
              'class',
              `${buttonClass} ${
                isProductPurchasable ? classSelector : nonPurchasableClassSelector
              }`,
            );
            quoteButton.addEventListener('click', quoteCallBack, {
              capture: true,
            });

            setMediaStyle(
              mediaBlocks,
              `${buttonClass} ${
                isProductPurchasable ? classSelector : nonPurchasableClassSelector
              }`,
            );

            el.appendChild(quoteButton);
          }
        });
        cache.current = cloneDeep(buttonProperties);
      } else {
        clearQuoteDom();
        clearNoPurchasableQuoteDom();
      }
    };

    if (!productQuoteEnabled) {
      clearQuoteDom();
      clearNoPurchasableQuoteDom();
      return;
    }

    if (!isProductPurchasable) {
      clearQuoteDom();

      const nonPurchasableElements = [
        ...document.querySelectorAll(config['dom.setToNoPurchasable']),
      ]
        .map((el) => el.parentElement)
        .filter((el) => el !== null);

      const customNonPurchasableElements = nonPurchasableLocationSelector
        ? [...document.querySelectorAll<HTMLElement>(nonPurchasableLocationSelector)]
        : [];

      if (nonPurchasableElements.length) {
        const elements = customNonPurchasableElements.length
          ? customNonPurchasableElements
          : nonPurchasableElements;

        renderQuoteButton(elements, false);
      }
    } else {
      clearNoPurchasableQuoteDom();

      const defaultElements = [...document.querySelectorAll(config['dom.setToQuote'])]
        .map((el) => el.parentElement)
        .filter((el) => el !== null);

      const customElements = locationSelector
        ? [...document.querySelectorAll<HTMLElement>(locationSelector)]
        : [];

      if (!defaultElements.length && !customElements.length) return;

      const elements = customElements.length ? customElements : defaultElements;
      renderQuoteButton(elements, true);
    }
  }, [
    addQuoteBtn,
    classSelector,
    color,
    customCss,
    customTextColor,
    enabled,
    isProductPurchasable,
    locationSelector,
    mediaBlocks,
    nonPurchasableClassSelector,
    nonPurchasableColor,
    nonPurchasableCustomCss,
    nonPurchasableEnabled,
    nonPurchasableLocationSelector,
    openQuickView,
    productQuoteEnabled,
    quoteButtonLabel,
    quoteCallBack,
    quoteOnNonPurchasableProductPageBtn,
  ]);
};
