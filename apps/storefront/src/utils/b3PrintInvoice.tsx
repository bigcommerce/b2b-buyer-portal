import { store } from '@/store';

import b2bLogger from './b3Logger';
import { BigCommerceStorefrontAPIBaseURL, platform } from './basicConfig';

const bindDom = (html: string, domId: string) => {
  let iframeDom = document.getElementById(domId) as HTMLIFrameElement | null;
  if (!iframeDom) {
    iframeDom = document.createElement('iframe');
    iframeDom.src = 'about:blank';
    iframeDom.id = domId;
    iframeDom.style.display = 'none';
    document.body.appendChild(iframeDom);
  }
  const iframeDoc = iframeDom.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();
  }
  iframeDom.style.display = 'block';
};

const normalizeUrl = (url: string) => url.trim().replace(/\/$/, '');

/**
 * Base URL for the Stencil storefront (where account.php exists).
 * On headless, derives from storeInfo.urls (store URL vs storefront URL) for the current channel.
 */
export const getPrintInvoiceBaseUrl = (): string => {
  if (platform === 'bigcommerce') return BigCommerceStorefrontAPIBaseURL;
  const { storeInfo } = store.getState().global;
  const storeUrlNormalized = normalizeUrl(BigCommerceStorefrontAPIBaseURL);
  const urls = storeInfo?.urls ?? [];
  const storefrontUrl =
    urls.find((url) => {
      if (!url) return false;
      return normalizeUrl(url) !== storeUrlNormalized;
    }) ?? BigCommerceStorefrontAPIBaseURL;
  return normalizeUrl(storefrontUrl);
};

export const getPrintInvoiceUrl = (orderId: string) =>
  `${getPrintInvoiceBaseUrl()}/account.php?action=print_invoice&order_id=${orderId}`;

export const b2bPrintInvoice = async (orderId: string, domId: string) => {
  const url = getPrintInvoiceUrl(orderId);

  if (platform !== 'bigcommerce') {
    window.open(url);
    return;
  }

  await fetch(url)
    .then((response: Response) => {
      if (response.ok) {
        return response.text();
      }
      throw new Error('Network response was not ok.');
    })
    .then((html: string) => {
      bindDom(html, domId);
    })
    .catch((error: Error) => {
      b2bLogger.error('Error Invoice:', error);
    });
};
