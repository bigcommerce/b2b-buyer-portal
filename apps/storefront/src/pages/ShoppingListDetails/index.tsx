import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Grid, useTheme } from '@mui/material';
import { v1 as uuid } from 'uuid';

import B3Spin from '@/components/spin/B3Spin';
import { CART_URL, CHECKOUT_URL, PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { GlobalContext } from '@/shared/global';
import {
  deleteB2BShoppingListItem,
  deleteBcShoppingListItem,
  getB2BJuniorPlaceOrder,
  getB2BShoppingListDetails,
  getBcShoppingListDetails,
  updateB2BShoppingList,
  updateBcShoppingList,
} from '@/shared/service/b2b';
import { getVariantInfoBySkus, searchProducts } from '@/shared/service/b2b/graphql/product';
import { deleteCart, getCart } from '@/shared/service/bc/graphql/cart';
import {
  activeCurrencyInfoSelector,
  isB2BUserSelector,
  rolePermissionSelector,
  useAppSelector,
} from '@/store';
import { CustomerRole } from '@/types/company';
import { ShoppingListStatus } from '@/types/shoppingList';
import { verifyLevelPermission } from '@/utils/b3CheckPermissions/check';
import { b2bPermissionsMap } from '@/utils/b3CheckPermissions/config';
import b2bLogger from '@/utils/b3Logger';
import {
  addQuoteDraftProducts,
  calculateProductListPrice,
  getBCPrice,
  validProductQty,
} from '@/utils/b3Product/b3Product';
import {
  addLineItems,
  conversionProductsList,
  CustomerInfoProps,
  ListItemProps,
  ProductsProps,
  SearchProps,
  ShoppingListInfoProps,
} from '@/utils/b3Product/shared/config';
import { snackbar } from '@/utils/b3Tip';
import b3TriggerCartNumber from '@/utils/b3TriggerCartNumber';
import { channelId } from '@/utils/basicConfig';
import {
  CartError,
  createOrUpdateExistingCart as rawCreateOrUpdateExistingCart,
  deleteCartData,
  updateCart as rawUpdateCart,
} from '@/utils/cartUtils';
import {
  convertStockAndThresholdValidationErrorToWarning,
  validateProducts,
} from '@/utils/validateProducts';

import { type PageProps } from '../PageProps';

import AddToShoppingList from './components/AddToShoppingList';
import ReAddToCart from './components/ReAddToCart';
import ShoppingDetailDeleteItems from './components/ShoppingDetailDeleteItems';
import ShoppingDetailFooter from './components/ShoppingDetailFooter';
import ShoppingDetailHeader from './components/ShoppingDetailHeader';
import ShoppingDetailTable from './components/ShoppingDetailTable';
import {
  ShoppingListDetailsContext,
  ShoppingListDetailsProvider,
} from './context/ShoppingListDetailsContext';

interface TableRefProps extends HTMLInputElement {
  initSearch: () => void;
}

interface UpdateShoppingListParamsProps {
  id: number;
  name: string;
  description: string;
  status?: number;
  channelId?: number;
}

const mapToProductsFailedArray = (items: ProductsProps[]) => {
  return items.map((item: ProductsProps) => {
    return {
      ...item,
      isStock: item.node.productsSearch.inventoryTracking === 'none' ? '0' : '1',
      minQuantity: item.node.productsSearch.orderQuantityMinimum,
      maxQuantity: item.node.productsSearch.orderQuantityMaximum,
      stock: item.node.productsSearch.unlimitedBackorder
        ? Infinity
        : item.node.productsSearch.availableToSell,
    };
  });
};

const calculateSubTotal = (checkedArr: CustomFieldItems) => {
  if (checkedArr.length > 0) {
    let total = 0.0;

    checkedArr.forEach((item: ListItemProps) => {
      const {
        node: { quantity, basePrice, taxPrice },
      } = item;

      const price = getBCPrice(Number(basePrice), Number(taxPrice));

      total += price * Number(quantity);
    });

    return (1000 * total) / 1000;
  }

  return 0.0;
};

const verifyInventory = (checkedArr: ProductsProps[], inventoryInfos: ProductsProps[]) => {
  const validateFailureArr: ProductsProps[] = [];
  const validateSuccessArr: ProductsProps[] = [];

  checkedArr.forEach((item: ProductsProps) => {
    const { node } = item;

    const inventoryInfo: CustomFieldItems =
      inventoryInfos.find((option: CustomFieldItems) => option.variantSku === node.variantSku) ||
      {};

    if (inventoryInfo) {
      let isPassVerify = true;
      if (
        inventoryInfo.isStock === '1' &&
        (node?.quantity ? Number(node.quantity) : 0) > inventoryInfo.stock
      )
        isPassVerify = false;

      if (
        inventoryInfo.minQuantity !== 0 &&
        (node?.quantity ? Number(node.quantity) : 0) < inventoryInfo.minQuantity
      )
        isPassVerify = false;

      if (
        inventoryInfo.maxQuantity !== 0 &&
        (node?.quantity ? Number(node.quantity) : 0) > inventoryInfo.maxQuantity
      )
        isPassVerify = false;

      if (isPassVerify) {
        validateSuccessArr.push({
          node,
        });
      } else {
        validateFailureArr.push({
          node: {
            ...node,
          },
          stock: inventoryInfo.stock,
          isStock: inventoryInfo.isStock,
          maxQuantity: inventoryInfo.maxQuantity,
          minQuantity: inventoryInfo.minQuantity,
        });
      }
    }
  });

  return {
    validateFailureArr,
    validateSuccessArr,
  };
};

interface Option {
  option_id: string | number;
  option_value: string | number;
}

const getOptionsList = (options: Option[]) =>
  options.map((opt) => ({
    optionId: opt.option_id,
    optionValue: opt.option_value,
  }));

function useData() {
  const { id = '' } = useParams();
  const {
    state: { openAPPParams, productQuoteEnabled = false },
  } = useContext(GlobalContext);
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const { currency_code: currencyCode } = useAppSelector(activeCurrencyInfoSelector);
  const role = useAppSelector(({ company }) => company.customer.role);
  const companyId = useAppSelector(({ company }) => company.companyInfo.id);
  const customerGroupId = useAppSelector(({ company }) => company.customer.customerGroupId);

  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);

  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;

  const {
    shoppingListCreateActionsPermission,
    purchasabilityPermission,
    submitShoppingListPermission,
  } = useAppSelector(rolePermissionSelector);

  const isCanAddToCart = isB2BUser ? purchasabilityPermission : true;

  const getProducts = async (productIds: number[]) => {
    const options = { productIds, currencyCode, companyId, customerGroupId };
    const { productsSearch } = await searchProducts(options);

    return conversionProductsList(productsSearch);
  };

  const getShoppingList = (params: SearchProps) => {
    const options = { ...params, id };

    return isB2BUser ? getB2BShoppingListDetails(options) : getBcShoppingListDetails(options);
  };

  const deleteShoppingListItem = (itemId: string | number) => {
    const options = { itemId, shoppingListId: id };

    return isB2BUser ? deleteB2BShoppingListItem(options) : deleteBcShoppingListItem(options);
  };

  const isJuniorBuyer = Number(role) === CustomerRole.JUNIOR_BUYER;

  return {
    id,
    openAPPParams,
    productQuoteEnabled,
    isB2BUser,
    isAgenting,
    primaryColor,
    shoppingListCreateActionsPermission,
    submitShoppingListPermission,
    isCanAddToCart,
    getProducts,
    getShoppingList,
    deleteShoppingListItem,
    isJuniorBuyer,
  };
}

// 0: Admin, 1: Senior buyer, 2: Junior buyer, 3: Super admin

const createOrUpdateExistingCart = (products: ProductsProps[]) =>
  rawCreateOrUpdateExistingCart(addLineItems(products));

const updateCart = (cartInfo: any, products: ProductsProps[]) =>
  rawUpdateCart(cartInfo, addLineItems(products));

const partialAddToCart = async (checkedArr: ProductsProps[]) => {
  try {
    await createOrUpdateExistingCart(checkedArr);
    return [];
  } catch (apiError: unknown) {
    if (!(apiError instanceof CartError)) {
      throw apiError;
    }

    const { success, error, warning } = await validateProducts(
      checkedArr.map((item) => ({
        productId: item.node.productId,
        variantId: item.node.variantId,
        quantity: item.node.quantity ?? 0,
        productOptions: getOptionsList(JSON.parse(item.node.optionList || '[]')),
        item,
      })),
    );

    if (success.length > 0) {
      await createOrUpdateExistingCart(success.map((p) => p.product.item));
    }

    return [...error, ...warning];
  }
};

function ShoppingListDetails({ setOpenPage }: PageProps) {
  const {
    id,
    openAPPParams,
    productQuoteEnabled,
    isB2BUser,
    isAgenting,
    primaryColor,
    shoppingListCreateActionsPermission,
    submitShoppingListPermission,
    isCanAddToCart,
    getProducts,
    getShoppingList,
    deleteShoppingListItem,
    isJuniorBuyer,
  } = useData();

  const companyId = useAppSelector(({ company }) => company.companyInfo.id);
  const customerGroupId = useAppSelector(({ company }) => company.customer.customerGroupId);

  const navigate = useNavigate();
  const [isMobile] = useMobile();
  const { dispatch } = useContext(ShoppingListDetailsContext);

  const b3Lang = useB3Lang();

  const tableRef = useRef<TableRefProps | null>(null);

  const featureFlags = useFeatureFlags();
  const backendValidationEnabled =
    featureFlags['B2B-3318.move_stock_and_backorder_validation_to_backend'] ?? false;

  const [checkedArr, setCheckedArr] = useState<ProductsProps[]>([]);
  const [shoppingListInfo, setShoppingListInfo] = useState<null | ShoppingListInfoProps>(null);
  const [customerInfo, setCustomerInfo] = useState<null | CustomerInfoProps>(null);
  const [isRequestLoading, setIsRequestLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [deleteItemId, setDeleteItemId] = useState<number | string>('');

  const [successProductsCount, setSuccessProductsCount] = useState<number>(0);
  const [validateFailureProducts, setValidateFailureProducts] = useState<ProductsProps[]>([]);

  const [allowJuniorPlaceOrder, setAllowJuniorPlaceOrder] = useState<boolean>(false);
  const [isCanEditShoppingList, setIsCanEditShoppingList] = useState<boolean>(true);

  const b2bAndBcShoppingListActionsPermissions = isB2BUser
    ? shoppingListCreateActionsPermission && isCanEditShoppingList
    : true;

  const submitShoppingList = useMemo(() => {
    if (isB2BUser && shoppingListInfo) {
      const { companyInfo, customerInfo } = shoppingListInfo;
      const { submitShoppingListPermission: submitShoppingListPermissionCode } = b2bPermissionsMap;
      const submitShoppingListPermissionLevel = verifyLevelPermission({
        code: submitShoppingListPermissionCode,
        companyId: Number(companyInfo?.companyId || 0),
        userId: Number(customerInfo?.userId || 0),
      });

      return submitShoppingListPermissionLevel;
    }

    return submitShoppingListPermission;
  }, [submitShoppingListPermission, isB2BUser, shoppingListInfo]);
  const b2bSubmitShoppingListPermission = isB2BUser ? submitShoppingList : isJuniorBuyer;

  const isJuniorApprove =
    shoppingListInfo?.status === ShoppingListStatus.Approved && b2bSubmitShoppingListPermission;

  const isReadForApprove =
    shoppingListInfo?.status === ShoppingListStatus.ReadyForApproval ||
    shoppingListInfo?.status === ShoppingListStatus.Rejected ||
    // Status code 20 was previously misused as Rejected in the frontend, which is actually Deleted
    // We need to add Deleted here so that the shopping lists that were previously rejected remain the same behavior
    shoppingListInfo?.status === ShoppingListStatus.Deleted;

  const goToShoppingLists = () => {
    navigate('/shoppingLists');
  };

  useEffect(() => {
    dispatch({
      type: 'init',
      payload: {
        id: parseInt(id, 10) || 0,
      },
    });
    // disabling as we don't need a dispatcher here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleGetProductsById = async (listProducts: ListItemProps[]) => {
    if (listProducts.length > 0) {
      try {
        const productIds: number[] = [];
        listProducts.forEach((item) => {
          const { node } = item;
          if (!productIds.includes(node.productId)) {
            productIds.push(node.productId);
          }
        });

        const newProductsSearch = await getProducts(productIds);

        listProducts.forEach((item) => {
          const { node } = item;

          const productInfo = newProductsSearch.find((search: CustomFieldItems) => {
            const { id: productId } = search;

            return node.productId === productId;
          });

          node.productsSearch = productInfo || {};
          node.productName = productInfo?.name || node.productName;
          node.productUrl = productInfo?.productUrl || node.productUrl;

          node.disableCurrentCheckbox = false;
          if (node.quantity === 0) {
            node.disableCurrentCheckbox = true;
          }
        });

        return listProducts;
      } catch (error: unknown) {
        if (error instanceof Error) {
          snackbar.error(error.message);
        }
      }
    }

    return [];
  };

  const getShoppingListDetails = async (params: SearchProps) => {
    const shoppingListDetailInfo = await getShoppingList(params);
    setIsRequestLoading(true);
    const {
      products: { edges, totalCount },
    } = shoppingListDetailInfo;

    const listProducts = await handleGetProductsById(edges);

    await calculateProductListPrice(listProducts, '2');

    if (isB2BUser) setCustomerInfo(shoppingListDetailInfo.customerInfo);
    setShoppingListInfo(shoppingListDetailInfo);
    setIsRequestLoading(false);
    if (!listProducts) {
      return {
        edges: [],
        totalCount: 0,
      };
    }

    return {
      edges: listProducts,
      totalCount,
    };
  };

  const handleUpdateShoppingList = async (status: number) => {
    setIsRequestLoading(true);
    try {
      const params: UpdateShoppingListParamsProps = {
        id: Number(id),
        name: shoppingListInfo?.name || '',
        description: shoppingListInfo?.description || '',
      };

      if (isB2BUser) {
        await updateB2BShoppingList({
          ...params,
          status,
        });
      } else {
        await updateBcShoppingList({
          ...params,
          channelId,
        });
      }

      snackbar.success(b3Lang('shoppingList.shoppingListStatusUpdated'));
      tableRef.current?.initSearch();
    } finally {
      setIsRequestLoading(false);
    }
  };

  const updateList = () => {
    tableRef.current?.initSearch();
  };

  const handleCancelClick = () => {
    setDeleteOpen(false);
    setDeleteItemId('');
  };

  const handleDeleteItems = async (itemId: number | string = '') => {
    setIsRequestLoading(true);

    try {
      if (itemId) {
        await deleteShoppingListItem(itemId);

        if (checkedArr.length > 0) {
          const newCheckedArr = checkedArr.filter((item) => {
            const { itemId: checkedItemId } = item.node;

            return itemId !== checkedItemId;
          });

          setCheckedArr([...newCheckedArr]);
        }
      } else {
        if (checkedArr.length === 0) return;
        checkedArr.forEach(async (item) => {
          const { node } = item;

          await deleteShoppingListItem(node.itemId);
        });

        setCheckedArr([]);
      }

      snackbar.success(b3Lang('shoppingList.productRemoved'));
    } finally {
      setIsRequestLoading(false);
      updateList();
    }
  };

  const handleDeleteProductClick = async () => {
    await handleDeleteItems(Number(deleteItemId));
    await handleCancelClick();
  };

  const getJuniorPlaceOrder = async () => {
    const {
      storeConfigSwitchStatus: { isEnabled },
    } = await getB2BJuniorPlaceOrder();

    setAllowJuniorPlaceOrder(isEnabled === '1' && isCanAddToCart);
  };

  useEffect(() => {
    if (isJuniorApprove) getJuniorPlaceOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isJuniorApprove]);

  useEffect(() => {
    if (isB2BUser && shoppingListInfo) {
      const { companyInfo, customerInfo } = shoppingListInfo;

      const { shoppingListCreateActionsPermission } = b2bPermissionsMap;
      const shoppingListActionsPermission = verifyLevelPermission({
        code: shoppingListCreateActionsPermission,
        companyId: Number(companyInfo?.companyId || 0),
        userId: Number(customerInfo?.userId || 0),
      });

      setIsCanEditShoppingList(shoppingListActionsPermission);
    }
  }, [shoppingListInfo, isB2BUser]);

  const shouldRedirectToCheckoutAfterRetry = (): void => {
    if (
      allowJuniorPlaceOrder &&
      submitShoppingListPermission &&
      shoppingListInfo?.status === ShoppingListStatus.Approved
    ) {
      window.location.href = CHECKOUT_URL;
    } else {
      snackbar.success(b3Lang('shoppingList.footer.productsAddedToCart'), {
        action: {
          label: b3Lang('shoppingList.footer.viewCart'),
          onClick: () => {
            if (window.b2b.callbacks.dispatchEvent('on-click-cart-button')) {
              window.location.href = CART_URL;
            }
          },
        },
      });
      b3TriggerCartNumber();
    }

    setSuccessProductsCount(0);
    setValidateFailureProducts([]);
  };

  const retryAddToCartFrontend = async (products: ProductsProps[]) => {
    const isValidate = products.every((item: ProductsProps) => item.isValid);

    if (!isValidate) {
      snackbar.error(b3Lang('shoppingList.reAddToCart.fillCorrectQuantity'));
      return;
    }

    const res = await createOrUpdateExistingCart(products);

    if (!res.errors) {
      shouldRedirectToCheckoutAfterRetry();
    }

    if (res.errors) {
      snackbar.error(res.message);
    }

    b3TriggerCartNumber();
  };

  const retryAddToCartBackend = async (products: ProductsProps[]) => {
    try {
      const errors = await partialAddToCart(products);

      setSuccessProductsCount(products.length - errors.length);
      setValidateFailureProducts(mapToProductsFailedArray(errors.map((p) => p.product.item)));

      if (!errors.length) {
        shouldRedirectToCheckoutAfterRetry();
      }

      b3TriggerCartNumber();
    } catch (e: unknown) {
      if (e instanceof Error) {
        snackbar.error(e.message);
      }
    }
  };

  const addToQuote = async (products: CustomFieldItems[]) => {
    if (backendValidationEnabled) {
      const validatedProducts = await validateProducts(products);
      const { success, warning, error } =
        convertStockAndThresholdValidationErrorToWarning(validatedProducts);

      error.forEach((err) => {
        if (err.error.type === 'network') {
          snackbar.error(
            b3Lang('quotes.productValidationFailed', {
              productName: err.product.node?.productName || '',
            }),
          );
        } else {
          snackbar.error(err.error.message);
        }
      });

      const validProducts = [...success, ...warning].map((product) => product.product);

      addQuoteDraftProducts(validProducts);

      return validProducts.length > 0;
    }

    addQuoteDraftProducts(products);

    return true;
  };

  const handleAddSelectedToQuote = async () => {
    if (checkedArr.length === 0) {
      snackbar.error(b3Lang('shoppingList.footer.selectOneItem'));
      return;
    }

    setIsRequestLoading(true);

    try {
      const productsWithSku = checkedArr.filter((checkedItem) => {
        const {
          node: { variantSku },
        } = checkedItem;

        return variantSku !== '' && variantSku !== null && variantSku !== undefined;
      });

      const noSkuProducts = checkedArr.filter((checkedItem) => {
        const {
          node: { variantSku },
        } = checkedItem;

        return !variantSku;
      });

      if (noSkuProducts.length > 0) {
        snackbar.error(b3Lang('shoppingList.footer.cantAddProductsNoSku'));
      }

      if (noSkuProducts.length === checkedArr.length) return;

      const productIds: number[] = [];
      productsWithSku.forEach((product) => {
        const { node } = product;

        if (!productIds.includes(Number(node.productId))) {
          productIds.push(Number(node.productId));
        }
      });

      const { productsSearch } = await searchProducts({
        productIds,
        companyId,
        customerGroupId,
      });

      const newProductInfo: CustomFieldItems = conversionProductsList(productsSearch);
      let errorMessage = '';
      let isFoundVariant = true;

      const newProducts: CustomFieldItems[] = [];
      productsWithSku.forEach((product) => {
        const {
          node: {
            basePrice,
            optionList,
            variantSku,
            productId,
            productName,
            quantity,
            variantId,
            tax,
          },
        } = product;

        const optionsList = getOptionsList(JSON.parse(optionList));

        const currentProductSearch = newProductInfo.find(
          (product: CustomFieldItems) => Number(product.id) === Number(productId),
        );

        const variantItem = currentProductSearch?.variants.find(
          (item: CustomFieldItems) => item.sku === variantSku,
        );

        if (!variantItem) {
          errorMessage = b3Lang('shoppingList.footer.notFoundSku', {
            sku: variantSku,
          });
          isFoundVariant = false;
        }

        const quoteListitem = {
          node: {
            id: uuid(),
            variantSku: variantItem?.sku || variantSku,
            variantId,
            productsSearch: {
              ...currentProductSearch,
              newSelectOptionList: optionsList,
              variantId,
            },
            primaryImage: variantItem?.image_url || PRODUCT_DEFAULT_IMAGE,
            productName,
            quantity: Number(quantity) || 1,
            optionList: JSON.stringify(optionsList),
            productId,
            basePrice,
            tax,
          },
        };

        newProducts.push(quoteListitem);
      });

      const isValidQty = validProductQty(newProducts);

      if (!isFoundVariant) {
        snackbar.error(errorMessage);

        return;
      }

      if (isValidQty) {
        await calculateProductListPrice(newProducts, '2');

        const success = await addToQuote(newProducts);
        if (success) {
          snackbar.success(b3Lang('shoppingList.footer.productsAddedToQuote'), {
            action: {
              label: b3Lang('shoppingList.footer.viewQuote'),
              onClick: () => {
                navigate('/quoteDraft');
              },
            },
          });
        }
      } else {
        snackbar.error(b3Lang('shoppingList.footer.productsLimit'), {
          action: {
            label: b3Lang('shoppingList.footer.viewQuote'),
            onClick: () => {
              navigate('/quoteDraft');
            },
          },
        });
      }
    } catch (e) {
      b2bLogger.error(e);
    } finally {
      setIsRequestLoading(false);
    }
  };

  const retryAddToCart = backendValidationEnabled ? retryAddToCartBackend : retryAddToCartFrontend;

  const shouldRedirectToCheckoutAfterAddToCart = () => {
    if (
      allowJuniorPlaceOrder &&
      b2bSubmitShoppingListPermission &&
      shoppingListInfo?.status === ShoppingListStatus.Approved
    ) {
      window.location.href = CHECKOUT_URL;
    } else {
      snackbar.success(b3Lang('shoppingList.footer.productsAddedToCart'), {
        action: {
          label: b3Lang('shoppingList.footer.viewCart'),
          onClick: () => {
            if (window.b2b.callbacks.dispatchEvent('on-click-cart-button')) {
              window.location.href = CART_URL;
            }
          },
        },
      });
      b3TriggerCartNumber();
    }
  };

  const handleAddToCartOnFrontend = async () => {
    const skus: string[] = [];

    let cantPurchase = '';

    checkedArr.forEach((item: ProductsProps) => {
      const { node } = item;

      if (node.productsSearch.availability === 'disabled') {
        cantPurchase += `${node.variantSku},`;
      }

      skus.push(node.variantSku);
    });

    if (cantPurchase) {
      snackbar.error(
        b3Lang('shoppingList.footer.unavailableProducts', {
          skus: cantPurchase.slice(0, -1),
        }),
      );
      return;
    }

    const getInventoryInfos = await getVariantInfoBySkus(skus);

    const { validateFailureArr, validateSuccessArr } = verifyInventory(
      checkedArr,
      getInventoryInfos?.variantSku || [],
    );

    if (validateSuccessArr.length !== 0) {
      const cartInfo = await getCart();
      let res = null;

      if (allowJuniorPlaceOrder && cartInfo.data.site.cart) {
        await deleteCart(deleteCartData(cartInfo.data.site.cart.entityId));
        res = await updateCart(cartInfo, validateSuccessArr);
      } else {
        res = await createOrUpdateExistingCart(validateSuccessArr);
        b3TriggerCartNumber();
      }
      if (res && res.errors) {
        snackbar.error(res.errors[0].message);
      } else if (validateFailureArr.length === 0) {
        shouldRedirectToCheckoutAfterAddToCart();
      }
    }

    setValidateFailureProducts(validateFailureArr);
    setSuccessProductsCount(validateSuccessArr.length);
  };

  const handleAddToCartBackend = async () => {
    try {
      const cartInfo = await getCart();
      if (allowJuniorPlaceOrder && cartInfo.data.site.cart) {
        await deleteCart(deleteCartData(cartInfo.data.site.cart.entityId));
        await updateCart(cartInfo, checkedArr);
      } else {
        const errors = await partialAddToCart(checkedArr);

        setSuccessProductsCount(checkedArr.length - errors.length);
        setValidateFailureProducts(mapToProductsFailedArray(errors.map((p) => p.product.item)));

        if (!errors.length) {
          shouldRedirectToCheckoutAfterAddToCart();
        }

        b3TriggerCartNumber();
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setValidateFailureProducts(mapToProductsFailedArray(checkedArr));
        snackbar.error(e.message);
        // eslint-disable-next-line no-console
        console.error(e);
      }
    }
  };

  const addToCart = backendValidationEnabled ? handleAddToCartBackend : handleAddToCartOnFrontend;

  // Add selected product to cart
  const handleAddProductsToCart = async () => {
    if (checkedArr.length === 0) {
      snackbar.error(b3Lang('shoppingList.footer.selectOneItem'));
      return;
    }

    setValidateFailureProducts([]);
    setSuccessProductsCount(0);

    try {
      setIsRequestLoading(true);
      await addToCart();
    } finally {
      setIsRequestLoading(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        <ShoppingDetailHeader
          isB2BUser={isB2BUser}
          shoppingListInfo={shoppingListInfo}
          customerInfo={customerInfo}
          goToShoppingLists={goToShoppingLists}
          handleUpdateShoppingList={handleUpdateShoppingList}
          setOpenPage={setOpenPage}
          isAgenting={isAgenting}
          openAPPParams={openAPPParams}
          customColor={primaryColor}
        />

        <Grid
          container
          spacing={2}
          sx={{
            marginTop: '0',
            overflow: 'auto',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            paddingBottom: '20px',
            marginBottom: isMobile ? '6rem' : 0,
          }}
        >
          <Box
            sx={
              isMobile
                ? {
                    flexBasis: '100%',
                    pl: '16px',
                  }
                : {
                    flexBasis: '690px',
                    flexGrow: 1,
                    ml: '16px',
                    pt: '16px',
                  }
            }
          >
            <B3Spin isSpinning={isRequestLoading} spinningHeight="auto">
              <Grid
                item
                sx={
                  isMobile
                    ? {
                        flexBasis: '100%',
                      }
                    : {
                        flexBasis: '690px',
                        flexGrow: 1,
                      }
                }
              >
                <ShoppingDetailTable
                  ref={tableRef}
                  isReadForApprove={isReadForApprove}
                  isJuniorApprove={isJuniorApprove}
                  allowJuniorPlaceOrder={allowJuniorPlaceOrder}
                  setCheckedArr={setCheckedArr}
                  shoppingListInfo={shoppingListInfo}
                  isRequestLoading={isRequestLoading}
                  setIsRequestLoading={setIsRequestLoading}
                  shoppingListId={id}
                  getShoppingListDetails={getShoppingListDetails}
                  setDeleteOpen={setDeleteOpen}
                  setDeleteItemId={setDeleteItemId}
                  isB2BUser={isB2BUser}
                  productQuoteEnabled={productQuoteEnabled}
                  isCanEditShoppingList={isCanEditShoppingList}
                  isJuniorBuyer={isJuniorBuyer}
                />
              </Grid>
            </B3Spin>
          </Box>

          <Grid item sx={isMobile ? { flexBasis: '100%' } : { flexBasis: '340px' }}>
            {b2bAndBcShoppingListActionsPermissions && !isReadForApprove && !isJuniorApprove && (
              <AddToShoppingList
                updateList={updateList}
                type="shoppingList"
                isB2BUser={isB2BUser}
              />
            )}
          </Grid>
        </Grid>

        {!isReadForApprove &&
          (allowJuniorPlaceOrder || productQuoteEnabled || !isJuniorApprove) && (
            <ShoppingDetailFooter
              shoppingListInfo={shoppingListInfo}
              allowJuniorPlaceOrder={allowJuniorPlaceOrder}
              selectedSubTotal={calculateSubTotal(checkedArr)}
              selectedProductCount={checkedArr.length}
              onDelete={() => setDeleteOpen(true)}
              onAddToCart={handleAddProductsToCart}
              onAddToQuote={handleAddSelectedToQuote}
              isB2BUser={isB2BUser}
              customColor={primaryColor}
              isCanEditShoppingList={isCanEditShoppingList}
              isJuniorBuyer={isJuniorBuyer}
            />
          )}
      </Box>

      <ReAddToCart
        isOpen={validateFailureProducts.length > 0}
        onCancel={() => {
          setSuccessProductsCount(0);
          setValidateFailureProducts([]);
        }}
        onAddToCart={retryAddToCart}
        shoppingListInfo={shoppingListInfo}
        products={validateFailureProducts}
        successProducts={successProductsCount}
        allowJuniorPlaceOrder={allowJuniorPlaceOrder}
      />

      <ShoppingDetailDeleteItems
        open={deleteOpen}
        handleCancelClick={handleCancelClick}
        handleDeleteProductClick={handleDeleteProductClick}
      />
    </>
  );
}

function ShoppingListDetailsContent({ setOpenPage }: PageProps) {
  return (
    <ShoppingListDetailsProvider>
      <ShoppingListDetails setOpenPage={setOpenPage} />
    </ShoppingListDetailsProvider>
  );
}

export default ShoppingListDetailsContent;
