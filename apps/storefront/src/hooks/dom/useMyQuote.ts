import { Dispatch, SetStateAction, useCallback, useContext, useEffect, useRef } from 'react';
import config from '@b3/global-b3';
import { useB3Lang } from '@b3/lang';
import cloneDeep from 'lodash-es/cloneDeep';

import {
  getContrastColor,
  getStyles,
  setMediaStyle,
  splitCustomCssValue,
} from '@/components/outSideComponents/utils/b3CustomStyles';
import { ADD_TO_QUOTE_DEFAULT_VALUE, TRANSLATION_ADD_TO_QUOTE_VARIABLE } from '@/constants';
import { CustomStyleContext } from '@/shared/customStyleButton';
import {
  resetDraftQuoteInfo,
  resetDraftQuoteList,
  setQuoteUserId,
  useAppDispatch,
  useAppSelector,
} from '@/store';
import { CustomerRole } from '@/types';
import { OpenPageState } from '@/types/hooks';
import { setCartPermissions } from '@/utils';

import useGetButtonText from '../useGetButtonText';

import useDomVariation from './useDomVariation';
import usePurchasableQuote from './usePurchasableQuote';
import { addProductFromProductPageToQuote, removeElement } from './utils';

type DispatchProps = Dispatch<SetStateAction<OpenPageState>>;

interface MutationObserverProps {
  setOpenPage: DispatchProps;
  productQuoteEnabled: boolean;
  role: number | string;
  customerId?: number | string;
}

const useMyQuote = ({ setOpenPage, productQuoteEnabled, role }: MutationObserverProps) => {
  const b3Lang = useB3Lang();
  const dispatch = useAppDispatch();
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
  const cache = useRef({});
  const {
    state: { addQuoteBtn, quoteOnNonPurchasableProductPageBtn },
  } = useContext(CustomStyleContext);

  // quote method and go to draft
  const { addToQuote, addLoading } = addProductFromProductPageToQuote(
    setOpenPage,
    isEnableProduct,
    b3Lang,
  );

  const quoteCallBack = useCallback(
    (e: React.MouseEvent) => {
      const b3MyQuote = e.target as HTMLElement;
      const b2bLoading = document.querySelector('#b2b-div-loading');
      if (b3MyQuote && !b2bLoading) {
        addLoading(b3MyQuote);
        addToQuote(b3MyQuote);
      }
    },
    [addLoading, addToQuote],
  );

  const cd = () => {
    const isLoggedInAndB2BAccount = role !== CustomerRole.GUEST && role !== CustomerRole.B2C;

    setCartPermissions(isLoggedInAndB2BAccount);
  };

  const [openQuickView] = useDomVariation(config['dom.setToQuote'], cd);

  const [isBuyPurchasable] = usePurchasableQuote(openQuickView);

  const {
    color = '',
    text = '',
    customCss = '',
    classSelector = '',
    locationSelector = '',
    enabled = false,
  } = addQuoteBtn;

  const {
    color: noPurchasableQuoteColor = '',
    text: noPurchasableQuoteText = '',
    customCss: noPurchasableQuoteCustomCss = '',
    classSelector: noPurchasableQuoteClassSelector = '',
    locationSelector: noPurchasableQuoteLocationSelector = '',
    enabled: noPurchasableQuoteEnabled = false,
  } = quoteOnNonPurchasableProductPageBtn;

  const newText = isBuyPurchasable ? text : noPurchasableQuoteText;
  const myQuoteBtnLabel = useGetButtonText(
    TRANSLATION_ADD_TO_QUOTE_VARIABLE,
    newText,
    ADD_TO_QUOTE_DEFAULT_VALUE,
  );

  const cssInfo = splitCustomCssValue(isBuyPurchasable ? customCss : noPurchasableQuoteCustomCss);
  const {
    cssValue,
    mediaBlocks,
  }: {
    cssValue: string;
    mediaBlocks: string[];
  } = cssInfo;
  const customTextColor =
    getStyles(cssValue).color ||
    getContrastColor(isBuyPurchasable ? color : noPurchasableQuoteColor);

  const clearQuoteDom = () => {
    const myQuoteBtn = document.querySelectorAll('.b2b-add-to-quote');
    myQuoteBtn.forEach((item: CustomFieldItems) => {
      removeElement(item);
    });
  };

  const clearNoPurchasableQuoteDom = () => {
    const myNoPurchasableQuoteBtn = document.querySelectorAll('.b2b-add-to-no-purchasable-quote');
    myNoPurchasableQuoteBtn.forEach((item: CustomFieldItems) => {
      removeElement(item);
    });
  };

  const addBtnStyle = useCallback(() => {
    const myQuoteBtn = document.querySelectorAll('.b2b-add-to-quote');
    myQuoteBtn.forEach((quote: CustomFieldItems) => {
      const myQuote = quote;
      myQuote.innerHTML = myQuoteBtnLabel;
      myQuote.setAttribute('style', isBuyPurchasable ? customCss : noPurchasableQuoteCustomCss);
      myQuote.style.backgroundColor = isBuyPurchasable ? color : noPurchasableQuoteColor;
      myQuote.style.color = customTextColor;
      myQuote.setAttribute(
        'class',
        `b2b-add-to-quote ${isBuyPurchasable ? classSelector : noPurchasableQuoteClassSelector}`,
      );

      setMediaStyle(
        mediaBlocks,
        `b2b-add-to-quote ${isBuyPurchasable ? classSelector : noPurchasableQuoteClassSelector}`,
      );
    });
  }, [
    classSelector,
    color,
    customCss,
    customTextColor,
    isBuyPurchasable,
    mediaBlocks,
    myQuoteBtnLabel,
    noPurchasableQuoteClassSelector,
    noPurchasableQuoteColor,
    noPurchasableQuoteCustomCss,
  ]);

  useEffect(() => {
    const purchasableQuote = (
      CustomAddToQuoteAll: NodeListOf<Element> | never[],
      addToQuoteAll: NodeListOf<Element>,
      isBuyer: boolean,
    ) => {
      const quoteNode = isBuyer ? '.b2b-add-to-quote' : '.b2b-add-to-no-purchasable-quote';
      const quoteNodeStyle = isBuyer ? 'b2b-add-to-quote' : 'b2b-add-to-no-purchasable-quote';

      if (document.querySelectorAll(quoteNode)?.length) {
        const cacheQuoteDom = cache.current;

        const isAddStyle = Object.keys(cacheQuoteDom).every(
          (key: string) =>
            (cacheQuoteDom as CustomFieldItems)[key] === (addQuoteBtn as CustomFieldItems)[key],
        );
        if (!isAddStyle) {
          addBtnStyle();
          cache.current = cloneDeep(addQuoteBtn);
        }
      }

      if (isBuyPurchasable ? enabled : noPurchasableQuoteEnabled) {
        (CustomAddToQuoteAll.length ? CustomAddToQuoteAll : addToQuoteAll).forEach(
          (node: CustomFieldItems) => {
            const children = node.parentNode.querySelectorAll(quoteNode);
            if (!children.length) {
              let myQuote: CustomFieldItems | null = null;
              myQuote = document.createElement('div');
              myQuote.innerHTML = myQuoteBtnLabel;
              myQuote.setAttribute(
                'style',
                isBuyPurchasable ? customCss : noPurchasableQuoteCustomCss,
              );
              myQuote.style.backgroundColor = isBuyPurchasable ? color : noPurchasableQuoteColor;
              myQuote.style.color = customTextColor;
              myQuote.setAttribute(
                'class',
                `${quoteNodeStyle} ${
                  isBuyPurchasable ? classSelector : noPurchasableQuoteClassSelector
                }`,
              );

              setMediaStyle(
                mediaBlocks,
                `${quoteNodeStyle} ${
                  isBuyPurchasable ? classSelector : noPurchasableQuoteClassSelector
                }`,
              );
              if (CustomAddToQuoteAll.length) {
                node.appendChild(myQuote);
              } else {
                node.parentNode.appendChild(myQuote);
              }
              myQuote.addEventListener('click', quoteCallBack, {
                capture: true,
              });
            }
          },
        );
        cache.current = cloneDeep(addQuoteBtn);
      } else {
        clearQuoteDom();
      }
    };

    if (!productQuoteEnabled) {
      clearQuoteDom();
      clearNoPurchasableQuoteDom();
      return;
    }

    if (!isBuyPurchasable) {
      clearQuoteDom();
      const noPurchasableQuoteAll = document.querySelectorAll(config['dom.setToNoPurchasable']);

      const CustomAddToQuoteAll = noPurchasableQuoteLocationSelector
        ? document.querySelectorAll(noPurchasableQuoteLocationSelector)
        : [];

      if (!noPurchasableQuoteAll.length && !CustomAddToQuoteAll.length) return;

      if (noPurchasableQuoteAll.length) {
        purchasableQuote(CustomAddToQuoteAll, noPurchasableQuoteAll, false);
      }
    } else {
      clearNoPurchasableQuoteDom();
      const addToQuoteAll = document.querySelectorAll(config['dom.setToQuote']);
      const CustomAddToQuoteAll = locationSelector
        ? document.querySelectorAll(locationSelector)
        : [];

      if (!addToQuoteAll.length && !CustomAddToQuoteAll.length) return;
      purchasableQuote(CustomAddToQuoteAll, addToQuoteAll, true);
    }

    // eslint-disable-next-line
    return () => {
      const myQuoteBtn = document.querySelectorAll('.b2b-add-to-quote');
      myQuoteBtn.forEach((item: CustomFieldItems) => {
        item.removeEventListener('click', quoteCallBack);
      });
    };
  }, [
    openQuickView,
    productQuoteEnabled,
    addQuoteBtn,
    isBuyPurchasable,
    locationSelector,
    noPurchasableQuoteLocationSelector,
    quoteCallBack,
    addBtnStyle,
    classSelector,
    color,
    customCss,
    customTextColor,
    enabled,
    mediaBlocks,
    myQuoteBtnLabel,
    noPurchasableQuoteClassSelector,
    noPurchasableQuoteColor,
    noPurchasableQuoteCustomCss,
    noPurchasableQuoteEnabled,
  ]);
};

export default useMyQuote;
