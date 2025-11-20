import cloneDeep from 'lodash-es/cloneDeep';
import isEmpty from 'lodash-es/isEmpty';
import { v1 as uuid } from 'uuid';

import { getProductPricing } from '@/shared/service/b2b';
import { setDraftQuoteList, store } from '@/store';
import { setEnteredInclusiveTax } from '@/store/slices/storeConfigs';
import { Modifiers, ShoppingListProductItem } from '@/types';
import {
  AllOptionProps,
  CalculatedItems,
  CalculatedOptions,
  Product,
  Variant,
} from '@/types/products';
import { QuoteItem } from '@/types/quotes';
import { channelId, storeHash } from '@/utils/basicConfig';
import { getActiveCurrencyInfo } from '@/utils/currencyUtils';

import b2bLogger from '../b3Logger';
import { FeatureFlags } from '../featureFlags';

interface NewOptionProps {
  optionId: string;
  optionValue: number;
}

interface ProductOption {
  optionEntityId: number;
  optionValueEntityId: number;
  entityId: number;
  valueEntityId: number;
  text: string;
  number: number;
  date: {
    utc: string;
  };
}

interface ProductOptionString {
  optionId: string;
  optionValue: string;
}

interface ProductInfo extends Variant {
  quantity: number;
  productsSearch: ShoppingListProductItem;
  optionSelections?: ProductOptionString[];
}

interface OptionsProps {
  optionId: string | number;
  optionValue: string | number;
}

export interface LineItem {
  quantity: number;
  productEntityId: number;
  selectedOptions?: ProductOption[];
  sku?: string;
  variantEntityId?: number;
}

const getDateValuesArray = (id: number, value: number) => {
  const data = new Date(value * 1000);
  const year = data.getFullYear();
  const month = data.getMonth() + 1;
  const day = data.getDate();
  return [
    {
      option_id: id,
      value_id: month,
    },
    {
      option_id: id,
      value_id: year,
    },
    {
      option_id: id,
      value_id: day,
    },
  ];
};

const calculatedDate = (newOption: NewOptionProps, itemOption: Partial<AllOptionProps>) => {
  let date = [];
  const dateTypes = ['year', 'month', 'day'] as const;
  const isIncludeDate = (date: string) => newOption.optionId.includes(date);
  if (isIncludeDate(dateTypes[0]) || isIncludeDate(dateTypes[1]) || isIncludeDate(dateTypes[2])) {
    date = [
      {
        option_id: itemOption?.id ? Number(itemOption.id) : 0,
        value_id: Number(newOption.optionValue),
      },
    ];
  } else {
    const data = new Date(Number(newOption.optionValue) * 1000);
    const year = data.getFullYear();
    const month = data.getMonth() + 1;
    const day = data.getDate();
    date = [
      {
        option_id: itemOption?.id ? Number(itemOption.id) : 0,
        value_id: month,
      },
      {
        option_id: itemOption?.id ? Number(itemOption.id) : 0,
        value_id: year,
      },
      {
        option_id: itemOption?.id ? Number(itemOption.id) : 0,
        value_id: day,
      },
    ];
  }

  return date;
};

const getCalculatedParams = (
  optionList: CustomFieldItems[],
  variantItem: Partial<Variant>,
  allOptions: Partial<AllOptionProps>[] = [],
): Partial<CalculatedItems>[] | [] => {
  if (variantItem) {
    const arr: Partial<CalculatedOptions>[] = [];
    const date: Partial<CalculatedOptions>[] = [];

    (optionList || []).forEach((option: CustomFieldItems) => {
      const newOption = {
        optionId: option?.option_id || option.optionId,
        optionValue: option?.option_value || option.optionValue,
      };
      const itemOption = (allOptions || []).find(
        (select: Partial<AllOptionProps>) =>
          `${newOption.optionId}`.includes(`${select?.id}`) &&
          ((select.type !== 'text' && select.option_values?.length) ||
            (select.type === 'date' && newOption.optionValue)),
      );
      if (itemOption && newOption.optionValue) {
        if (itemOption.type === 'date' && Number(newOption.optionValue)) {
          date.push(...calculatedDate(newOption, itemOption));
        } else {
          arr.push({
            option_id: itemOption?.id ? Number(itemOption.id) : 0,
            value_id: Number(newOption.optionValue),
          });
        }
      }
    });

    return [
      {
        product_id: variantItem.product_id,
        variant_id: variantItem.variant_id,
        options: [...arr, ...date],
      },
    ];
  }

  return [];
};

const getBulkPrice = (calculatedPrices: any, qty: number) => {
  const { decimal_places: decimalPlaces = 2 } = getActiveCurrencyInfo();
  const { calculated_price: calculatedPrice, bulk_pricing: bulkPrices } = calculatedPrices;

  const calculatedTaxPrice = calculatedPrice.tax_inclusive;
  const calculatedNoTaxPrice = calculatedPrice.tax_exclusive;
  let enteredPrice = calculatedPrice.as_entered;
  const enteredInclusive = calculatedPrice.entered_inclusive;
  store.dispatch(setEnteredInclusiveTax(enteredInclusive));

  const tax = calculatedTaxPrice - calculatedNoTaxPrice;
  const taxRate = Number(calculatedNoTaxPrice) ? Number(tax) / calculatedNoTaxPrice : 0;

  let finalDiscount = 0;
  let itemTotalTaxPrice = 0;
  let singlePrice = 0;
  bulkPrices.forEach(
    ({ minimum, maximum, discount_type: discountType, discount_amount: bulkPrice }: any) => {
      if (qty >= minimum && qty <= (maximum || qty)) {
        switch (discountType) {
          case 'fixed':
            finalDiscount = 0;
            enteredPrice = bulkPrice;
            break;
          case 'percent':
            finalDiscount = enteredPrice * Number((bulkPrice / 100).toFixed(decimalPlaces));
            break;
          case 'price':
            finalDiscount = bulkPrice;
            break;
          default:
            break;
        }
      }
    },
  );

  if (finalDiscount > 0) {
    enteredPrice -= finalDiscount;
  }

  if (enteredInclusive) {
    itemTotalTaxPrice = enteredPrice;
    singlePrice = enteredPrice / (1 + taxRate);
  } else {
    singlePrice = enteredPrice;
    itemTotalTaxPrice = enteredPrice * (1 + taxRate);
  }

  const taxPrice = singlePrice * taxRate;

  const itemPrice = !enteredInclusive ? singlePrice : itemTotalTaxPrice;

  return {
    taxPrice,
    itemPrice,
  };
};

interface CalculatedProductPrice {
  optionList: CustomFieldItems[];
  productsSearch: Product;
  sku: string;
  qty: number;
}

const getCustomerGroupId = () => {
  let customerGroupId = 0;
  const currentState = store.getState();
  const customerInfo = currentState.company.customer;

  if (customerInfo.customerGroupId) customerGroupId = customerInfo.customerGroupId;

  const { isAgenting, customerGroupId: salesRepCustomerGroupId } =
    currentState.b2bFeatures.masqueradeCompany;

  if (isAgenting) return salesRepCustomerGroupId || customerGroupId;

  return customerGroupId;
};

/**
 * Calculate price for a product.
 *
 * @deprecated Use the new {@link calculateProductsPrice} function instead.
 */
const getCalculatedProductPrice = async (
  { optionList, productsSearch, sku, qty }: CalculatedProductPrice,
  calculatedValue?: CustomFieldItems,
) => {
  const { decimal_places: decimalPlaces = 2, currency_code: currencyCode } =
    getActiveCurrencyInfo();

  const { variants = [] } = productsSearch;

  const variantItem = variants.find((item) => item.sku?.toUpperCase() === sku.toUpperCase());

  if (variantItem) {
    const items = getCalculatedParams(optionList, variantItem, productsSearch?.allOptions || []);
    const customerGroupId = getCustomerGroupId();

    const data = {
      channel_id: channelId,
      currency_code: currencyCode,
      items,
      customer_group_id: customerGroupId,
    };

    let calculatedData = [];

    if (calculatedValue && !isEmpty(calculatedValue)) {
      calculatedData = [calculatedValue];
    } else {
      const res = await getProductPricing({
        storeHash,
        ...data,
      });

      calculatedData = res.data;
    }

    const { taxPrice, itemPrice } = getBulkPrice(calculatedData[0], qty);

    const quoteListitem = {
      node: {
        id: uuid(),
        variantSku: variantItem.sku,
        variantId: variantItem.variant_id,
        productsSearch,
        primaryImage: variantItem.image_url,
        productName: productsSearch.name,
        quantity: Number(qty),
        optionList: JSON.stringify(optionList),
        productId: variantItem.product_id,
        basePrice: Number(itemPrice.toFixed(decimalPlaces)),
        taxPrice: Number(taxPrice.toFixed(decimalPlaces)),
        calculatedValue: calculatedData[0],
      },
    };

    return quoteListitem;
  }

  return '';
};
const formatOptionsSelections = (options: ProductOption[], allOptions: Partial<AllOptionProps>[]) =>
  options.reduce((accumulator: CalculatedOptions[], option) => {
    const optionEntityId = option?.optionEntityId || option?.entityId || '';
    const optionValueEntityId = option?.optionValueEntityId || option?.valueEntityId || '';
    const matchedOption = allOptions.find(({ id, type, option_values }) => {
      if (optionEntityId && Number(optionEntityId) === id) {
        if (
          (type !== 'text' && option_values?.length) ||
          (type === 'date' && option.optionValueEntityId)
        ) {
          return true;
        }
      }
      return false;
    });

    if (matchedOption) {
      if (matchedOption.type === 'date') {
        const id = matchedOption.id ? Number(matchedOption.id) : 0;
        accumulator.push(...getDateValuesArray(id, Number(optionValueEntityId)));
      } else {
        accumulator.push({
          option_id: matchedOption.id ? Number(matchedOption.id) : 0,
          value_id: Number(optionValueEntityId),
        });
      }
    }

    return accumulator;
  }, []);

const getSelectedOptions = (
  selectedOptions: ProductOption[],
  allOptions: Partial<AllOptionProps>[],
) => {
  if (selectedOptions.length === 0) return [];
  const newSelectedOptions: ProductOptionString[] = [];

  selectedOptions.forEach((option: ProductOption) => {
    const optionEntityId = option?.optionEntityId || option?.entityId;
    let optionValueEntityId: string | number = option?.optionValueEntityId || option?.valueEntityId;

    const currentOptions = allOptions.find((option) => optionEntityId === option?.id);

    let isDate = false;
    if (currentOptions && !optionValueEntityId) {
      switch (currentOptions.type) {
        case 'date':
          isDate = true;
          optionValueEntityId = option.date.utc;
          break;
        case 'numbers_only_text':
          optionValueEntityId = option.number;
          break;
        default:
          optionValueEntityId = option.text;
          break;
      }
    }

    if (isDate) {
      const date = new Date(optionValueEntityId);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      newSelectedOptions.push(
        {
          optionId: `attribute[${optionEntityId}][month]`,
          optionValue: `${month}`,
        },
        {
          optionId: `attribute[${optionEntityId}][day]`,
          optionValue: `${day}`,
        },
        {
          optionId: `attribute[${optionEntityId}][year]`,
          optionValue: `${year}`,
        },
      );
    } else {
      newSelectedOptions.push({
        optionId: `attribute[${optionEntityId}]`,
        optionValue: `${optionValueEntityId}`,
      });
    }
  });

  return newSelectedOptions;
};

const formatLineItemsToGetPrices = (items: LineItem[], productsSearch: ShoppingListProductItem[]) =>
  items.reduce(
    (
      formattedLineItems: {
        items: CalculatedItems[];
        variants: ProductInfo[];
      },
      { selectedOptions = [], productEntityId, sku, variantEntityId, quantity },
    ) => {
      const selectedProduct = productsSearch.find(({ id }) => id === productEntityId);
      const variantItem = selectedProduct?.variants?.find(
        ({ sku: skuResult, variant_id: variantIdResult }) =>
          sku === skuResult || variantIdResult === variantEntityId,
      );

      if (!variantItem || !selectedProduct) {
        return formattedLineItems;
      }
      const { allOptions = [] } = selectedProduct;

      const options = formatOptionsSelections(selectedOptions, allOptions);

      formattedLineItems.items.push({
        product_id: variantItem.product_id,
        variant_id: variantItem.variant_id,
        options,
      });
      formattedLineItems.variants.push({
        ...variantItem,
        quantity,
        productsSearch: selectedProduct,
        optionSelections: getSelectedOptions(selectedOptions, allOptions),
      });
      return formattedLineItems;
    },
    { items: [], variants: [] },
  );
const calculateProductsPrice = async (
  lineItems: LineItem[],
  products: ShoppingListProductItem[],
  calculatedValue: CustomFieldItems[] = [],
) => {
  const { decimal_places: decimalPlaces = 2, currency_code: currencyCode } =
    getActiveCurrencyInfo();

  let calculatedPrices = calculatedValue;
  const { variants, items } = formatLineItemsToGetPrices(lineItems, products);

  // check if it's included calculatedValue
  // if not, prepare items array to get prices by `/v3/pricing/products` endpoint
  // then fetch them
  if (calculatedValue.length === 0) {
    const data = {
      channel_id: channelId,
      customer_group_id: getCustomerGroupId(),
      currency_code: currencyCode,
      items,
    };
    const res = await getProductPricing({
      storeHash,
      ...data,
    });
    calculatedPrices = res.data;
  }

  // create quote array structure and return it
  return calculatedPrices.map((calculatedPrice, index) => {
    const {
      productsSearch,
      quantity,
      optionSelections,
      sku: variantSku,
      variant_id: variantId,
      image_url: primaryImage,
      product_id: productId,
    } = variants[index];
    const { taxPrice, itemPrice } = getBulkPrice(calculatedPrice, quantity);
    return {
      node: {
        id: uuid(),
        variantSku,
        variantId,
        productsSearch,
        primaryImage,
        productName: productsSearch.name,
        quantity,
        optionList: JSON.stringify(optionSelections),
        productId,
        basePrice: itemPrice.toFixed(decimalPlaces),
        taxPrice: taxPrice.toFixed(decimalPlaces),
        calculatedValue: calculatedPrice,
      },
    };
  });
};

const calculateProductListPrice = async (products: Partial<Product>[], type = '1') => {
  const { decimal_places: decimalPlaces = 2, currency_code: currencyCode } =
    getActiveCurrencyInfo();
  try {
    let isError = false;
    let i = 0;
    let itemsOptions: Partial<CalculatedItems>[] | [] = [];
    while (i < products.length && !isError) {
      let newSelectOptionList = [];
      let allOptions: Partial<AllOptionProps>[] = [];
      let variants: Partial<Variant>[] = [];
      let variantId = 0;
      let modifiers: Partial<Modifiers>[] = [];
      let optionsV3: Partial<Modifiers>[] = [];

      if (type === '1') {
        newSelectOptionList = products[i].newSelectOptionList;
        allOptions = products[i]?.allOptions || [];
        variants = products[i]?.variants || [];
        variantId = products[i].variantId;
        modifiers = products[i]?.modifiers || [];
        optionsV3 = products[i]?.optionsV3 || [];
      } else if (type === '2') {
        newSelectOptionList = JSON.parse(products[i]?.node?.optionList) || [];
        allOptions = products[i]?.node?.productsSearch?.allOptions || [];
        variants = products[i]?.node?.productsSearch?.variants || [];
        variantId = products[i].node.variantId;
        modifiers = products[i]?.node?.productsSearch?.modifiers || [];
        optionsV3 = products[i]?.node?.productsSearch?.optionsV3 || [];
      }

      let allOptionsArr: Partial<AllOptionProps>[] = allOptions;

      if (!allOptionsArr.length) {
        allOptionsArr = [...modifiers, ...optionsV3];
      }

      i += 1;

      const variantItem = variants.find(
        (item: Partial<Variant>) => item.variant_id === Number(variantId),
      );

      if (variantItem) {
        const items =
          getCalculatedParams(newSelectOptionList, variantItem, allOptionsArr || []) || [];
        itemsOptions = [...itemsOptions, ...items];
      } else {
        isError = true;
      }
    }

    if (isError) {
      return products;
    }

    const customerGroupId = getCustomerGroupId();

    const data = {
      channel_id: channelId,
      currency_code: currencyCode,
      items: itemsOptions,
      customer_group_id: customerGroupId,
    };

    const res = await getProductPricing({
      storeHash,
      ...data,
    });

    const { data: calculatedData } = res;

    products.forEach((product: Partial<Product>, index: number) => {
      const productNode = product;
      let qty = 0;

      if (type === '1') {
        qty = product?.quantity ? Number(product.quantity) : 0;
      } else {
        qty = product?.node?.quantity ? Number(product.node.quantity) : 0;
      }

      const { taxPrice, itemPrice } = getBulkPrice(calculatedData[index], qty);

      if (type === '1') {
        productNode.basePrice = itemPrice.toFixed(decimalPlaces);
        productNode.taxPrice = taxPrice.toFixed(decimalPlaces);
        productNode.tax = taxPrice.toFixed(decimalPlaces);
        productNode.calculatedValue = calculatedData[index];
      } else if (type === '2') {
        productNode.node.basePrice = itemPrice.toFixed(decimalPlaces);
        productNode.node.taxPrice = taxPrice.toFixed(decimalPlaces);
        productNode.node.tax = taxPrice.toFixed(decimalPlaces);
        productNode.node.calculatedValue = calculatedData[index];
      }
    });
    return products;
  } catch (error) {
    b2bLogger.error(error);
    return [];
  }
};

const setModifierQtyPrice = async (product: CustomFieldItems, qty: number, isRequest = true) => {
  try {
    const { productsSearch, optionList, variantSku, calculatedValue } = product;

    let newProduct: CustomFieldItems | string = {};

    if (isRequest) {
      newProduct = await getCalculatedProductPrice(
        {
          productsSearch,
          optionList: JSON.parse(optionList),
          sku: variantSku,
          qty,
        },
        calculatedValue,
      );
    } else {
      newProduct = getCalculatedProductPrice(
        {
          productsSearch,
          optionList: JSON.parse(optionList),
          sku: variantSku,
          qty,
        },
        calculatedValue,
      );
    }

    if (newProduct && (newProduct as CustomFieldItems)?.node?.id) {
      (newProduct as CustomFieldItems).node.id = product.id;

      return (newProduct as CustomFieldItems).node;
    }

    return product;
  } catch (e) {
    b2bLogger.error(e);
    return product;
  }
};

const compareOption = (langList: CustomFieldItems[], shortList: CustomFieldItems[]) => {
  let flag = true;
  langList.forEach((item: CustomFieldItems) => {
    const option = shortList.find((list: CustomFieldItems) => list.optionId === item.optionId);
    if (!option) {
      if (item?.optionValue) flag = false;
    } else if (item.optionValue !== option.optionValue) flag = false;
  });
  return flag;
};

const addQuoteDraftProducts = (products: CustomFieldItems[]) => {
  const { draftQuoteList } = store.getState().quoteInfo;

  if (draftQuoteList.length === 0) {
    store.dispatch(setDraftQuoteList(products as QuoteItem[]));
    return;
  }

  const draftQuote = cloneDeep(draftQuoteList);
  if (products.length) {
    products.forEach((quoteProduct: CustomFieldItems) => {
      const optionList = JSON.parse(quoteProduct.node.optionList);
      const draftQuoteProduct = draftQuote.find((item: CustomFieldItems) => {
        const oldOptionList = JSON.parse(item.node.optionList);
        const isAdd =
          oldOptionList.length > optionList.length
            ? compareOption(oldOptionList, optionList)
            : compareOption(optionList, oldOptionList);

        return item.node.variantSku === quoteProduct.node.variantSku && isAdd;
      });

      if (draftQuoteProduct) {
        draftQuoteProduct.node.quantity += quoteProduct.node.quantity;
        if (quoteProduct.node?.calculatedValue) {
          draftQuoteProduct.node.calculatedValue = quoteProduct.node.calculatedValue;
        }
      } else {
        draftQuote.push(quoteProduct as QuoteItem);
      }
    });
  }

  store.dispatch(setDraftQuoteList(draftQuote));
};

const validProductQty = (products: CustomFieldItems) => {
  const { draftQuoteList } = store.getState().quoteInfo;

  let canAdd = true;
  products.forEach((product: CustomFieldItems) => {
    const draftQuote = draftQuoteList.find(
      (item) => item.node.variantSku === product.node.variantSku,
    );
    const optionList = JSON.parse(product.node.optionList) || [];

    if (draftQuote) {
      const oldOptionList = JSON.parse(draftQuote.node.optionList);
      let quantityFromStore = draftQuote.node.quantity;
      const isAdd =
        oldOptionList.length > optionList.length
          ? compareOption(oldOptionList, optionList)
          : compareOption(optionList, oldOptionList);

      if (isAdd) {
        quantityFromStore += Number(product.node.quantity);
      }

      if (Number(quantityFromStore) > 1000000) {
        canAdd = false;
      }
    } else if (Number(product.node.quantity) > 1000000) {
      canAdd = false;
    }
  });

  return canAdd;
};

const addQuoteDraftProduce = async (
  quoteListitem: CustomFieldItems,
  qty: number,
  optionList: CustomFieldItems[],
) => {
  const draftList = cloneDeep(store.getState().quoteInfo.draftQuoteList);

  const draft = draftList.find(
    (item: QuoteItem) => item?.node?.variantSku === quoteListitem.node.variantSku,
  );

  if (draft) {
    // TODO optionList compare
    const oldOptionList = JSON.parse(draft.node.optionList);

    const isAdd =
      oldOptionList.length > optionList.length
        ? compareOption(oldOptionList, optionList)
        : compareOption(optionList, oldOptionList);

    if (isAdd) {
      draft.node.quantity += Number(qty);

      const { optionList, productsSearch, variantSku, quantity, calculatedValue } = draft.node;

      const product = await getCalculatedProductPrice(
        {
          optionList: typeof optionList === 'string' ? JSON.parse(optionList) : optionList,
          productsSearch,
          sku: variantSku || '',
          qty: quantity,
        },
        calculatedValue,
      );

      if (product) {
        draft.node = product.node;
      }
    } else {
      draftList.push(quoteListitem as QuoteItem);
    }
  } else {
    draftList.push(quoteListitem as QuoteItem);
  }

  store.dispatch(setDraftQuoteList(draftList));
};

const getBCPrice = (basePrice: number, taxPrice: number) => {
  const {
    global: { showInclusiveTaxPrice },
    storeConfigs: {
      currencies: { enteredInclusiveTax },
    },
  } = store.getState();

  let price: number;
  if (enteredInclusiveTax) {
    price = showInclusiveTaxPrice ? basePrice : basePrice - taxPrice;
  } else {
    price = showInclusiveTaxPrice ? basePrice + taxPrice : basePrice;
  }

  return price;
};

const getValidOptionsList = (
  options: OptionsProps[] | CustomFieldItems,
  originProduct: CustomFieldItems,
) => {
  const targetType = ['text', 'numbers_only_text', 'multi_line_text'];
  const originOptions = originProduct?.modifiers || originProduct?.allOptions;
  const newOptions: CustomFieldItems = [];
  options.forEach((option: { optionId: number | string; optionValue: number | string }) => {
    const currentOption = originOptions.find((item: { id: string | number }) => {
      const optionId = option.optionId.toString();
      const targetId = optionId?.includes('attribute')
        ? optionId.split('[')[1].split(']')[0]
        : optionId;

      return Number(targetId) === Number(item.id);
    });

    if (!option.optionValue || Number(option.optionValue) === 0) {
      if (currentOption?.type === 'checkbox') {
        const optionValues = currentOption?.option_values || [];

        const checkboxValue = optionValues.find(
          (value: { value_data: { checked_value: boolean }; label: string }) =>
            !value?.value_data?.checked_value || value?.label === 'No',
        );
        newOptions.push({
          optionId: option.optionId,
          optionValue: checkboxValue.id.toString(),
        });
      }
      if (
        (targetType.includes(currentOption.type) || currentOption.type.includes('text')) &&
        option.optionValue
      ) {
        newOptions.push(option);
      }
    } else {
      newOptions.push(option);
    }
  });

  return newOptions;
};

interface DisplayPriceProps {
  price: string | number;
  productInfo: CustomFieldItems;
  isProduct?: boolean;
  showText?: string;
  forcedSkip?: boolean;
}

export const getProductInfoDisplayPrice = (
  price: string | number,
  productInfo: CustomFieldItems,
  featureFlags: FeatureFlags,
) => {
  const currentPrice = price || '0';
  const {
    availability,
    inventoryLevel,
    inventoryTracking,
    quantity,
    availableToSell,
    unlimitedBackorder,
  } = productInfo;

  if (availability === 'disabled') {
    return '';
  }

  if (inventoryTracking === 'none') {
    return currentPrice;
  }

  if (featureFlags['B2B-3318.move_stock_and_backorder_validation_to_backend']) {
    if (!unlimitedBackorder && Number(quantity) > Number(availableToSell)) {
      return '';
    }
  } else if (Number(quantity) > Number(inventoryLevel)) {
    return '';
  }

  return currentPrice;
};

export const getVariantInfoOOSAndPurchase = (productInfo: CustomFieldItems) => {
  const newProductInfo = productInfo?.node ? productInfo.node : productInfo;

  const inventoryTracking: string = newProductInfo?.productsSearch
    ? newProductInfo.productsSearch.inventoryTracking
    : newProductInfo.inventoryTracking;

  const { quantity, availability } = newProductInfo;

  const productInventoryLevel =
    newProductInfo?.productsSearch?.inventoryLevel || newProductInfo?.inventoryLevel || 0;

  if (availability === 'disabled') {
    return {
      type: 'non-purchasable',
      name: newProductInfo?.productName || '',
    };
  }

  const variantSku = newProductInfo?.variantSku || newProductInfo?.sku;

  const variants = !isEmpty(newProductInfo?.productsSearch)
    ? newProductInfo.productsSearch.variants
    : newProductInfo?.variants || [];

  const variant = variants ? variants.find((item: Variant) => item.sku === variantSku) : {};
  if (variant && variant?.sku) {
    const { purchasing_disabled: purchasingDisabled, inventory_level: inventoryLevel } = variant;

    if (purchasingDisabled)
      return {
        type: 'non-purchasable',
        name: newProductInfo?.productName || '',
      };

    if (inventoryTracking === 'product' && Number(quantity) > productInventoryLevel) {
      return {
        type: 'oos',
        name: newProductInfo?.productName || '',
      };
    }

    if (inventoryTracking === 'variant' && Number(quantity) > inventoryLevel) {
      return {
        type: 'oos',
        name: newProductInfo?.productName || '',
      };
    }
  }

  return {};
};

export const getVariantInfoDisplayPrice = (
  price: string | number,
  productInfo: CustomFieldItems,
  featureFlags: FeatureFlags,
  option?: {
    sku?: string;
  },
) => {
  const currentPrice = price || '0';
  const newProductInfo = productInfo?.node ? productInfo.node : productInfo;

  const inventoryTracking: string = newProductInfo?.productsSearch
    ? newProductInfo.productsSearch.inventoryTracking
    : newProductInfo.inventoryTracking;

  const { quantity } = newProductInfo;

  const productInventoryLevel = newProductInfo?.productsSearch
    ? newProductInfo.productsSearch.inventoryLevel
    : newProductInfo.inventoryLevel;

  const productAvailableToSell = newProductInfo?.productsSearch
    ? newProductInfo.productsSearch.availableToSell
    : newProductInfo.availableToSell;

  const productUnlimitedBackorder = newProductInfo?.productsSearch
    ? newProductInfo.productsSearch.unlimitedBackorder
    : newProductInfo.unlimitedBackorder;

  const availability = newProductInfo?.productsSearch
    ? newProductInfo.productsSearch.availability
    : newProductInfo.availability;

  if (availability === 'disabled') {
    return '';
  }

  const variantSku = option?.sku || newProductInfo?.variantSku || newProductInfo?.sku;

  const newVariants = !isEmpty(newProductInfo?.productsSearch)
    ? newProductInfo.productsSearch.variants
    : newProductInfo?.variants || [];

  const variant = newVariants ? newVariants.find((item: Variant) => item.sku === variantSku) : {};

  if (variant && variant?.sku) {
    const {
      purchasing_disabled: variantPurchasingDisabled,
      inventory_level: variantInventoryLevel,
      available_to_sell: variantAvailableToSell,
      unlimited_backorder: variantUnlimitedBackorder,
    } = variant;

    if (variantPurchasingDisabled) return '';

    if (inventoryTracking === 'none') return currentPrice;

    if (featureFlags['B2B-3318.move_stock_and_backorder_validation_to_backend']) {
      const availableToSell =
        inventoryTracking === 'product' ? productAvailableToSell : variantAvailableToSell;
      const unlimitedBackorder =
        inventoryTracking === 'product' ? productUnlimitedBackorder : variantUnlimitedBackorder;

      if (!unlimitedBackorder && Number(quantity) > Number(availableToSell)) {
        return '';
      }
    } else {
      const inventoryLevel =
        inventoryTracking === 'product' ? productInventoryLevel : variantInventoryLevel;

      if (Number(quantity) > Number(inventoryLevel)) {
        return '';
      }
    }
  }

  return currentPrice;
};

const getDisplayPrice = ({
  price,
  productInfo,
  isProduct,
  showText = '',
  forcedSkip = false,
}: DisplayPriceProps): string | number => {
  const {
    global: {
      blockPendingQuoteNonPurchasableOOS: { isEnableProduct },
      featureFlags,
    },
  } = store.getState();

  if (!isEnableProduct && !forcedSkip) return price;

  const newProductInfo = productInfo?.node ? productInfo.node : productInfo;

  if (newProductInfo?.purchaseHandled) return price;

  const newPrice = isProduct
    ? getProductInfoDisplayPrice(price, newProductInfo, featureFlags)
    : getVariantInfoDisplayPrice(price, newProductInfo, featureFlags);

  return newPrice || showText || '';
};

const judgmentBuyerProduct = ({ productInfo, isProduct, price }: DisplayPriceProps): boolean => {
  const {
    global: { featureFlags },
  } = store.getState();

  const newProductInfo = productInfo?.node ? productInfo.node : productInfo;

  if (newProductInfo?.purchaseHandled) return true;

  const newPrice = isProduct
    ? getProductInfoDisplayPrice(price, newProductInfo, featureFlags)
    : getVariantInfoDisplayPrice(price, newProductInfo, featureFlags);

  return !!newPrice;
};

export {
  addQuoteDraftProduce,
  addQuoteDraftProducts,
  calculateProductListPrice,
  calculateProductsPrice,
  compareOption,
  getBCPrice,
  getCalculatedProductPrice,
  getDisplayPrice,
  getValidOptionsList,
  judgmentBuyerProduct,
  setModifierQtyPrice,
  validProductQty,
};
