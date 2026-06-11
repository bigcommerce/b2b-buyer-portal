import { store } from '@/store';
import { getBCPrice, getDisplayPrice } from '@/utils/b3Product/b3Product';
import { getActiveCurrencyInfo } from '@/utils/currencyUtils';

interface Summary {
  subtotal: number;
  shipping: number;
  tax: number;
  grandTotal: number;
  totalIsTbd: boolean;
}

const defaultSummary: Summary = {
  subtotal: 0,
  shipping: 0,
  tax: 0,
  grandTotal: 0,
  totalIsTbd: false,
};

const { decimal_places: decimalPlaces = 2 } = getActiveCurrencyInfo();

const priceCalc = (price: number) => parseFloat(price.toFixed(decimalPlaces));

export const addPrice = () => {
  const { draftQuoteList } = store.getState().quoteInfo;
  const { showInclusiveTaxPrice } = store.getState().global;

  const newQuoteSummary = draftQuoteList.reduce(
    (summary: Summary, product: CustomFieldItems) => {
      const {
        basePrice,
        taxPrice: productTax = 0,
        quantity,
        additionalCalculatedPrices = [],
      } = product.node;

      let { subtotal, grandTotal, tax } = summary;

      const { shipping } = summary;

      let additionalCalculatedPriceTax = 0;

      let additionalCalculatedPrice = 0;

      additionalCalculatedPrices.forEach((item: CustomFieldItems) => {
        additionalCalculatedPriceTax += item.additionalCalculatedPriceTax;
        additionalCalculatedPrice += item.additionalCalculatedPrice;
      });

      subtotal += priceCalc(
        getBCPrice(Number(basePrice) + additionalCalculatedPrice, Number(productTax)) * quantity,
      );
      tax += priceCalc((Number(productTax) + additionalCalculatedPriceTax) * quantity);

      grandTotal = showInclusiveTaxPrice ? subtotal + shipping : subtotal + shipping + tax;

      // The actual display format of the price is not important here; we want to know whether a the
      // price _should_ be displayed.
      let { totalIsTbd } = summary;
      if (
        getDisplayPrice({
          price: String(basePrice),
          productInfo: product,
          showText: 'DO NOT DISPLAY',
        }) === 'DO NOT DISPLAY'
      ) {
        totalIsTbd = true;
      }

      return {
        grandTotal,
        shipping,
        tax,
        subtotal,
        totalIsTbd,
      };
    },
    {
      ...defaultSummary,
    },
  );

  return newQuoteSummary;
};
