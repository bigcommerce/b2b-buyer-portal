import config from '@/lib/config';
import { LangFormatFunction } from '@/lib/lang';
import { type SetOpenPage } from '@/pages/SetOpenPage';
import { searchProducts } from '@/shared/service/b2b';
import { validateProduct } from '@/shared/service/b2b/graphql/product';
import { GetCart, getCart } from '@/shared/service/bc/graphql/cart';
import { store } from '@/store';
import { B3LStorage, B3SStorage, getActiveCurrencyInfo, globalSnackbar, serialize } from '@/utils';
import { getProductOptionList, isAllRequiredOptionFilled } from '@/utils/b3AddToShoppingList';
import b2bLogger from '@/utils/b3Logger';
import {
  addQuoteDraftProduce,
  addQuoteDraftProducts,
  calculateProductsPrice,
  getCalculatedProductPrice,
  getVariantInfoOOSAndPurchase,
  LineItem,
  validProductQty,
} from '@/utils/b3Product/b3Product';
import { FeatureFlags } from '@/utils/featureFlags';

import { conversionProductsList } from '../../utils/b3Product/shared/config';

interface DiscountsProps {
  discountedAmount: number;
  id: string;
}

interface ProductOptionsProps {
  name: string;
  nameId: number;
  value: number | string;
  valueId: number;
}

interface CustomItemProps {
  quantity: number;
  sku: string;
}

interface DigitalItemProps extends CustomItemProps {
  options: ProductOptionsProps[];
  brand: string;
  couponAmount: number;
  discountAmount: number;
  discounts: DiscountsProps[];
  extendedSalePrice: number;
  imageUrl: string;
  isTaxable: boolean;
  originalPrice: number;
  parentId?: string;
  productId: number;
  salePrice: number;
  url: string;
  variantId: number;
}

interface PhysicalItemProps extends DigitalItemProps {
  giftWrapping: {
    amount: number;
    message: string;
    name: string;
  };
  isShippingRequire: boolean;
  parentEntityId?: string | null;
}

interface LineItemsProps {
  customItems: LineItem[];
  digitalItems: LineItem[];
  giftCertificates: LineItem[];
  physicalItems: LineItem[];
}

const addLoading = (b3CartToQuote: any) => {
  const loadingDiv = document.createElement('div');
  loadingDiv.setAttribute('id', 'b2b-div-loading');
  const loadingBtn = document.createElement('div');
  loadingBtn.setAttribute('class', 'b2b-btn-loading');
  loadingDiv.appendChild(loadingBtn);
  b3CartToQuote.appendChild(loadingDiv);
};

const removeElement = (_element: CustomFieldItems) => {
  const parentElement = _element.parentNode;
  if (parentElement) {
    parentElement.removeChild(_element);
  }
};

const removeLoading = () => {
  const b2bLoading = document.querySelector('#b2b-div-loading');
  if (b2bLoading) removeElement(b2bLoading);
};

const gotoQuoteDraft = (setOpenPage: SetOpenPage) => {
  setOpenPage({
    isOpen: true,
    openUrl: '/quoteDraft',
    params: {
      quoteBtn: 'add',
    },
  });
};

const getCartProducts = (lineItems: LineItemsProps) =>
  Object.values(lineItems)
    .flat()
    .reduce(
      (accumulator, { options = [], sku, ...product }) => {
        if (!sku) {
          accumulator.noSkuProducts.push(product);
          return accumulator;
        }
        if (!product.parentId) {
          accumulator.cartProductsList.push({
            ...product,
            sku,
            optionSelections: options.map(({ nameId, valueId }: ProductOptionsProps) => ({
              optionId: nameId,
              optionValue: valueId,
            })),
          });
        }
        return accumulator;
      },
      { cartProductsList: [], noSkuProducts: [] },
    );

const addProductsToDraftQuote = async (
  products: LineItem[],
  setOpenPage: SetOpenPage,
  b3Lang: LangFormatFunction,
  cartId?: string,
) => {
  // filter out products without SKU or variantId
  const productsWithSKUOrVariantId = products.filter(
    ({ sku, variantEntityId }) => sku || !Number.isNaN(Number(variantEntityId)),
  );

  if (productsWithSKUOrVariantId.length === 0) {
    throw new Error('No products with SKU or variantId found');
  }

  const companyInfoId = store.getState().company.companyInfo.id;
  const salesRepCompanyId = store.getState().b2bFeatures.masqueradeCompany.id;
  const companyId = companyInfoId || salesRepCompanyId;
  const { customerGroupId } = store.getState().company.customer;

  const { currency_code: currencyCode } = getActiveCurrencyInfo();

  // fetch data with products IDs
  const { productsSearch } = await searchProducts({
    productIds: Array.from(
      new Set(productsWithSKUOrVariantId.map(({ productEntityId }) => Number(productEntityId))),
    ),
    currencyCode,
    companyId,
    customerGroupId,
  });

  // get products prices
  const productsListSearch = conversionProductsList(productsSearch);
  const productsList = await calculateProductsPrice(productsWithSKUOrVariantId, productsListSearch);

  const isSuccess = validProductQty(productsList);
  if (isSuccess) {
    addQuoteDraftProducts(productsList);
  }

  if (isSuccess) {
    // Save the shopping cart id, used to clear the shopping cart after submitting the quote
    if (cartId) B3LStorage.set('cartToQuoteId', cartId);

    globalSnackbar.success(b3Lang('quoteDraft.notification.productPlural'), {
      action: {
        onClick: () => gotoQuoteDraft(setOpenPage),
        label: b3Lang('quoteDraft.notification.openQuote'),
      },
    });
  }
};

const addProductsFromCartToQuote = (setOpenPage: SetOpenPage, b3Lang: LangFormatFunction) => {
  const addToQuote = async (cartInfoWithOptions: GetCart) => {
    try {
      if (!cartInfoWithOptions.data.site.cart) {
        globalSnackbar.error(b3Lang('pdp.cartToQuote.error.notFound'));
        return;
      }

      const { lineItems, entityId } = cartInfoWithOptions.data.site.cart;

      const { cartProductsList, noSkuProducts } = getCartProducts(lineItems);

      if (noSkuProducts.length > 0) {
        globalSnackbar.error(b3Lang('quoteDraft.notification.cantAddProductsNoSku'));
      }

      if (cartProductsList.length === 0) {
        globalSnackbar.error(b3Lang('pdp.cartToQuote.error.empty'));
      }
      if (noSkuProducts.length === cartProductsList.length) return;

      const newCartProductsList = cartProductsList.filter(
        (product: PhysicalItemProps) => !product.parentEntityId,
      );
      await addProductsToDraftQuote(newCartProductsList, setOpenPage, b3Lang, entityId);
    } catch (e) {
      b2bLogger.error(e);
    } finally {
      removeLoading();
    }
  };

  const addToQuoteFromCookie = () => getCart().then(addToQuote);
  const addToQuoteFromCart = (cartId: string) => getCart(cartId).then(addToQuote);

  return {
    addToQuoteFromCookie,
    addToQuoteFromCart,
    addLoading,
  };
};

const addProductFromProductPageToQuote = (
  setOpenPage: SetOpenPage,
  isEnableProduct: boolean,
  b3Lang: LangFormatFunction,
  featureFlags: FeatureFlags,
) => {
  const addToQuote = async (node?: HTMLElement) => {
    try {
      const productView = node ? node.closest(config['dom.productView']) : document;
      if (!productView) return;
      const productId = (productView.querySelector('input[name=product_id]') as CustomFieldItems)
        ?.value;
      const qty = (productView.querySelector('[name="qty[]"]') as CustomFieldItems)?.value ?? 1;
      const sku = (productView.querySelector('[data-product-sku]')?.innerHTML ?? '').trim();
      const form = productView.querySelector('form[data-cart-item-add]') as HTMLFormElement;

      if (!sku) {
        globalSnackbar.error(b3Lang('quoteDraft.notification.cantAddProductsNoSku'));

        return;
      }
      const companyInfoId = store.getState().company.companyInfo.id;
      const companyId = companyInfoId || B3SStorage.get('salesRepCompanyId');
      const { customerGroupId } = store.getState().company.customer;

      const { currency_code: currencyCode } = getActiveCurrencyInfo();

      const { productsSearch } = await searchProducts({
        productIds: [Number(productId)],
        companyId,
        customerGroupId,
        currencyCode,
      });

      const newProductInfo: CustomFieldItems = conversionProductsList(productsSearch);
      const { allOptions } = newProductInfo[0];

      const optionMap = serialize(form);

      const optionList = getProductOptionList(optionMap);

      const { isValid, message } = isAllRequiredOptionFilled(allOptions, optionList);
      if (!isValid) {
        globalSnackbar.error(message);
        return;
      }

      if (featureFlags['B2B-3318.move_stock_and_backorder_validation_to_backend']) {
        const variantId = newProductInfo[0]?.variants.find(
          (variant: CustomFieldItems) => variant.sku === sku,
        )?.variant_id;

        const productOptions = optionList.map((option: CustomFieldItems) => ({
          optionId: Number(option.optionId.split('[')[1].split(']')[0]),
          optionValue: option.optionValue,
        }));

        const { responseType, message } = await validateProduct({
          productId: Number(productId),
          variantId: Number(variantId),
          quantity: Number(qty),
          productOptions,
        });

        if (responseType === 'ERROR') {
          globalSnackbar.error(message);

          return;
        }

        if (responseType === 'WARNING') {
          globalSnackbar.warning(message);
        }
      } else if (!isEnableProduct) {
        const currentProduct = getVariantInfoOOSAndPurchase({
          ...productsSearch[0],
          quantity: qty,
          variantSku: sku,
          productName: productsSearch[0]?.name,
          productsSearch: productsSearch[0],
        });

        const inventoryTracking = productsSearch[0]?.inventoryTracking || 'none';
        let inventoryLevel = productsSearch[0]?.inventoryLevel;
        if (inventoryTracking === 'variant') {
          const currentVariant = productsSearch[0]?.variants.find(
            (variant: CustomFieldItems) => variant.sku === sku,
          );

          inventoryLevel = currentVariant?.inventory_level;
        }

        if (currentProduct?.name) {
          const message =
            currentProduct.type === 'oos'
              ? b3Lang('quoteDraft.productPageToQuote.outOfStock', {
                  name: currentProduct?.name,
                  qty: inventoryLevel,
                })
              : b3Lang('quoteDraft.productPageToQuote.unavailable');

          globalSnackbar.error(message);
          return;
        }
      }

      const quoteListitem = await getCalculatedProductPrice({
        optionList,
        productsSearch: newProductInfo[0],
        sku,
        qty,
      });

      const newProducts: CustomFieldItems = [quoteListitem];
      const isSuccess = validProductQty(newProducts);
      if (quoteListitem && isSuccess) {
        await addQuoteDraftProduce(quoteListitem, qty, optionList || []);
        globalSnackbar.success(b3Lang('global.notification.addProductSingular'), {
          action: {
            onClick: () => gotoQuoteDraft(setOpenPage),
            label: b3Lang('quoteDraft.notification.openQuote'),
          },
        });
      } else if (!isSuccess) {
        globalSnackbar.error(b3Lang('global.notification.maximumPurchaseExceed'), {
          action: {
            onClick: () => gotoQuoteDraft(setOpenPage),
            label: b3Lang('quoteDraft.notification.openQuote'),
          },
        });
      } else {
        globalSnackbar.error('Price error');
      }
    } catch (e) {
      b2bLogger.error(e);
    } finally {
      removeLoading();
    }
  };

  return {
    addToQuote,
    addLoading,
  };
};

export {
  addProductFromProductPageToQuote,
  addProductsFromCartToQuote,
  addProductsToDraftQuote,
  removeElement,
};
