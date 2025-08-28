import { useCallback, useLayoutEffect, useState } from 'react';

import { CHECKOUT_URL } from '@/constants';
import config from '@/lib/config';
import { useAppSelector } from '@/store';
import { CustomerRole } from '@/types';
import { OpenPageState } from '@/types/hooks';

import useMutationObservable from './useMutationObservable';

interface ChildNodeListProps extends ChildNode {
  href?: string;
  localName?: string;
}

const useB3AppOpen = (initOpenState: OpenPageState) => {
  const [checkoutRegisterNumber, setCheckoutRegisterNumber] = useState<number>(0);

  const callback = useCallback(() => {
    setCheckoutRegisterNumber(() => checkoutRegisterNumber + 1);
  }, [checkoutRegisterNumber]);
  const role = useAppSelector((state) => state.company.customer.role);
  const authorizedPages = initOpenState?.authorizedPages || '/orders';

  const [openPage, setOpenPage] = useState<OpenPageState>({
    isOpen: initOpenState.isOpen,
    openUrl: '',
    params: {},
  });

  const handleJudgeSearchNode = (element: MouseEvent) => {
    let isSearchNode = false;
    const target = element.target as HTMLAnchorElement;
    const searchNodeKey = ['alt', 'title', 'name'];

    searchNodeKey.forEach((key) => {
      if (target.getAttribute(key) && target.getAttribute(key)?.includes('search')) {
        isSearchNode = true;
      }
    });

    if (
      !isSearchNode &&
      typeof target.className === 'string' &&
      target.className?.includes('search')
    ) {
      const parentNode = target?.parentNode as HTMLAnchorElement;
      const childNodeList = target?.childNodes;

      if (parentNode && (parentNode?.title === 'search' || parentNode?.name === 'search')) {
        isSearchNode = true;
      }

      if (childNodeList && childNodeList.length > 0) {
        childNodeList.forEach((childNode) => {
          const child = childNode as HTMLAnchorElement;

          if (child && (child?.title === 'search' || child?.name === 'search')) {
            isSearchNode = true;
          }
        });
      }
    }

    return isSearchNode;
  };

  const handleJudgeCheckoutNormalHref = (element: MouseEvent) => {
    if (window?.location?.pathname !== CHECKOUT_URL) return false;

    const target = element.target as HTMLAnchorElement;

    if (target.getAttribute('href') && target.getAttribute('href') === '#') return true;

    return false;
  };

  useLayoutEffect(() => {
    const registerArr = Array.from(
      config['dom.registerElement'].length > 0
        ? document.querySelectorAll(config['dom.registerElement'])
        : [],
    );
    const allOtherArr = Array.from(
      config['dom.allOtherElement'].length > 0
        ? document.querySelectorAll(config['dom.allOtherElement'])
        : [],
    );

    if (registerArr.length || allOtherArr.length) {
      const handleTriggerClick = (e: MouseEvent) => {
        if (
          registerArr.includes(e.target as Element) ||
          allOtherArr.includes(e.target as Element)
        ) {
          const isSearchNode = handleJudgeSearchNode(e);
          const isCheckoutNormalHref = handleJudgeCheckoutNormalHref(e);

          if (isSearchNode || isCheckoutNormalHref) return false;
          e.preventDefault();
          e.stopPropagation();

          const isRegisterArrInclude = registerArr.includes(e.target as Element);
          const tagHref = (e.target as HTMLAnchorElement)?.href;
          let href = tagHref || authorizedPages;

          if (!tagHref || typeof tagHref !== 'string') {
            let parentNode = (e.target as HTMLAnchorElement)?.parentNode;
            let parentHref = (parentNode as HTMLAnchorElement)?.href;
            let number = 0;

            while (number < 3 && !parentHref) {
              parentNode = (parentNode as HTMLAnchorElement)?.parentNode;

              const newUrl = (parentNode as HTMLAnchorElement)?.href;

              if (newUrl && typeof newUrl === 'string') {
                parentHref = newUrl;
                number += 3;
              } else {
                number += 1;
              }
            }

            if (parentHref) {
              href = parentHref || authorizedPages;
            } else {
              const childNodeList = (e.target as HTMLAnchorElement)?.childNodes;

              if (childNodeList.length > 0) {
                childNodeList.forEach((node: ChildNodeListProps) => {
                  const nodeHref = node?.href;

                  if (nodeHref && node.localName === 'a') {
                    href = nodeHref || authorizedPages;
                  }
                });
              }
            }
          }

          const isLogin = role !== CustomerRole.GUEST;
          const hrefArr = href.split('/#');

          if (hrefArr[1] === '') {
            href = isLogin ? authorizedPages : '/login';
          }

          if (
            isLogin &&
            href.includes('/login') &&
            !href.includes('action=create_account') &&
            !href.includes('action=logout')
          ) {
            href = authorizedPages;
          }

          if (initOpenState?.handleEnterClick) {
            initOpenState.handleEnterClick(href, isRegisterArrInclude);
          }
        }

        return false;
      };

      window.addEventListener('click', handleTriggerClick, {
        capture: true,
      });

      return () => {
        window.removeEventListener('click', handleTriggerClick);
      };
    }

    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutRegisterNumber, initOpenState, role]);

  useMutationObservable(config['dom.checkoutRegisterParentElement'], callback);

  return [openPage, setOpenPage] as const;
};

export default useB3AppOpen;
