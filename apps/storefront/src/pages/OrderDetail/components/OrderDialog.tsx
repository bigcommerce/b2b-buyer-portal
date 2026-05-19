import { useEffect, useMemo, useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Typography } from '@mui/material';
import Cookies from 'js-cookie';

import { B3CustomForm } from '@/components/B3CustomForm';
import B3Dialog from '@/components/B3Dialog';
import { CART_URL } from '@/constants';
import { useBackorderStorefrontMessaging } from '@/hooks/useBackorderStorefrontMessaging';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import {
  addProductToBcShoppingList,
  addProductToShoppingList,
  getVariantInfoBySkus,
} from '@/shared/service/b2b';
import {
  type CatalogQuickVariantSku,
  QUOTE_VALIDATION_ERROR_CODES,
} from '@/shared/service/b2b/graphql/product';
import { isB2BUserSelector, useAppSelector } from '@/store';
import b2bLogger from '@/utils/b3Logger';
import { snackbar } from '@/utils/b3Tip';
import b3TriggerCartNumber from '@/utils/b3TriggerCartNumber';
import { BigCommerceStorefrontAPIBaseURL } from '@/utils/basicConfig';
import { createOrUpdateExistingCart } from '@/utils/cartUtils';
import {
  VALIDATED_PRODUCT_ERROR_TYPES,
  validateProductsLegacy as rawValidateProducts,
} from '@/utils/validateProducts';

import { EditableProductItem, OrderProductItem } from '../../../types';
import getReturnFormFields from '../shared/config';

import CreateShoppingList from './CreateShoppingList';
import OrderCheckboxProduct from './OrderCheckboxProduct';
import OrderShoppingList from './OrderShoppingList';

interface ReturnListProps {
  returnId: number;
  returnQty: number;
}

interface DialogData {
  dialogTitle: string;
  type: string;
  description: string;
  confirmText: string;
}

interface OrderDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  products?: OrderProductItem[];
  type?: string;
  currentDialogData?: DialogData;
  itemKey: string;
  orderId: number;
}

interface ReturnListProps {
  returnId: number;
  returnQty: number;
}

const getXsrfToken = (): string | undefined => {
  const token = Cookies.get('XSRF-TOKEN');

  if (!token) {
    return undefined;
  }

  return decodeURIComponent(token);
};

const validateProducts = async (products: EditableProductItem[]) => {
  return rawValidateProducts(
    products.map((product) => ({
      ...product,
      quantity: parseInt(`${product.editQuantity}`, 10) || 1,
      productId: product.product_id,
      variantId: product.variant_id,

      productOptions: (product.product_options || []).map((option) => ({
        optionId: option.product_option_id,
        optionValue: option.value,
      })),

      allOptions: product.product_options,
    })),
    'CART',
  );
};

export default function OrderDialog({
  open,
  products = [],
  type,
  currentDialogData = undefined,
  setOpen,
  itemKey,
  orderId,
}: OrderDialogProps) {
  const navigate = useNavigate();
  const { isBackorderEnabled, isBackorderMessagingContextEnabled, hasAnyBackorderDisplay } =
    useBackorderStorefrontMessaging();
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const [isOpenCreateShopping, setOpenCreateShopping] = useState(false);
  const [openShoppingList, setOpenShoppingList] = useState(false);
  const [editableProducts, setEditableProducts] = useState<EditableProductItem[]>([]);
  const [variantInfoList, setVariantInfoList] = useState<CatalogQuickVariantSku[]>([]);
  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [checkedArr, setCheckedArr] = useState<number[]>([]);
  const [returnArr, setReturnArr] = useState<ReturnListProps[]>([]);
  const [reorderValidationBanner, setReorderValidationBanner] = useState(false);

  const [returnFormFields] = useState(getReturnFormFields());

  const [isMobile] = useMobile();

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    setValue,
  } = useForm({
    mode: 'all',
  });
  const b3Lang = useB3Lang();

  const handleClose = () => {
    setOpen(false);
  };

  const showSuccessSnackbarWithCartLink = (message: string): void => {
    snackbar.success(message, {
      action: {
        label: b3Lang('orderDetail.viewCart'),
        onClick: () => {
          if (window.b2b.callbacks.dispatchEvent('on-click-cart-button')) {
            window.location.href = CART_URL;
          }
        },
      },
    });
  };

  const sendReturnRequest = async (
    returnReason: FieldValues,
    returnArr: ReturnListProps[],
    orderId: number,
  ) => {
    if (!Object.keys(returnReason).length || !returnArr.length) {
      snackbar.error(b3Lang('purchasedProducts.error.selectOneItem'));
      return;
    }
    const transformedData = returnArr.reduce((result, item) => {
      const resultedData = result;
      const key = `return_qty[${item.returnId}]`;
      resultedData[key] = item.returnQty;
      return result;
    }, returnReason);
    transformedData.authenticity_token = getXsrfToken();
    transformedData.order_id = orderId;

    const urlencoded = new URLSearchParams(transformedData);

    const requestOptions: any = {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      referrer: `${BigCommerceStorefrontAPIBaseURL}/account.php?action=new_return&order_id=${orderId}`,
      body: urlencoded,
      mode: 'no-cors',
    };

    try {
      setIsRequestLoading(true);
      const returnResult = await fetch(
        `${BigCommerceStorefrontAPIBaseURL}/account.php?action=save_new_return`,
        requestOptions,
      );
      if (returnResult.status === 200 && returnResult.url.includes('saved_new_return')) {
        snackbar.success(b3Lang('purchasedProducts.success.successfulApplication'));
      } else {
        snackbar.error('purchasedProducts.error.failedApplication');
      }
      setIsRequestLoading(false);
      handleClose();
    } catch (err) {
      b2bLogger.error(err);
    }
  };

  const handleReturn = () => {
    handleSubmit((data) => {
      sendReturnRequest(data, returnArr, orderId);
    })();
  };

  const validateProductNumber = (variantInfoList: CustomFieldItems, skus: string[]) => {
    let isValid = true;

    skus.forEach((sku) => {
      const variantInfo: CustomFieldItems | null = (variantInfoList || []).find(
        (variant: CustomFieldItems) => variant.variantSku.toUpperCase() === sku.toUpperCase(),
      );
      const product = editableProducts.find((product) => product.sku === sku);
      if (!variantInfo || !product) {
        return;
      }

      const { maxQuantity = 0, minQuantity = 0, stock = 0, isStock = '0' } = variantInfo;

      const quantity = product?.editQuantity || 1;

      if (isStock === '1' && quantity > stock) {
        product.helperText = b3Lang('purchasedProducts.outOfStock');
        isValid = false;
      } else if (minQuantity !== 0 && quantity < minQuantity) {
        product.helperText = b3Lang('purchasedProducts.minQuantity', {
          minQuantity,
        });
        isValid = false;
      } else if (maxQuantity !== 0 && quantity > maxQuantity) {
        product.helperText = b3Lang('purchasedProducts.maxQuantity', {
          maxQuantity,
        });
        isValid = false;
      } else {
        product.helperText = '';
      }
    });

    if (!isValid) {
      setEditableProducts([...editableProducts]);
    }

    return isValid;
  };

  const handleReorderOnFrontend = async () => {
    const items: CustomFieldItems[] = [];
    const skus: string[] = [];
    editableProducts.forEach((product) => {
      if (checkedArr.includes(product.variant_id)) {
        items.push({
          quantity: parseInt(`${product.editQuantity}`, 10) || 1,
          productId: product.product_id,
          variantId: product.variant_id,
          optionSelections: (product.product_options || []).map((option) => ({
            optionId: option.product_option_id,
            optionValue: option.value,
          })),
          allOptions: product.product_options,
        });

        skus.push(product.sku);
      }
    });

    if (skus.length <= 0) {
      return;
    }

    if (!validateProductNumber(variantInfoList, skus)) {
      snackbar.error(b3Lang('purchasedProducts.error.fillCorrectQuantity'));
      return;
    }

    // This will throw if there are errors, no need to check the response
    await createOrUpdateExistingCart(items);

    setOpen(false);
    snackbar.success(b3Lang('orderDetail.reorder.productsAdded'), {
      action: {
        label: b3Lang('orderDetail.viewCart'),
        onClick: () => {
          if (window.b2b.callbacks.dispatchEvent('on-click-cart-button')) {
            window.location.href = CART_URL;
          }
        },
      },
    });
  };

  const handleReorderBackend = async () => {
    const items = editableProducts.filter((product) => checkedArr.includes(product.variant_id));

    if (items.length <= 0) {
      return;
    }

    setReorderValidationBanner(false);

    const validationResult = await validateProducts(items);

    const helperTextMap = new Map<number, string>();

    validationResult.warning.forEach(({ product, message }) => {
      helperTextMap.set(product.variantId, message);
    });

    validationResult.error.forEach(({ product, error }) => {
      if (error.type === VALIDATED_PRODUCT_ERROR_TYPES.NETWORK) {
        helperTextMap.set(product.variantId, b3Lang('orderDetail.reorder.failedToAdd.helperText'));
      } else if (error.type === VALIDATED_PRODUCT_ERROR_TYPES.VALIDATION) {
        helperTextMap.set(
          product.variantId,
          error.errorCode === QUOTE_VALIDATION_ERROR_CODES.OOS
            ? b3Lang('orderDetail.reorder.onlyAvailable', { count: error.availableToSell })
            : error.message || '',
        );
      }
    });

    const hasValidationErrors = validationResult.error.some(
      ({ error }) => error.type === VALIDATED_PRODUCT_ERROR_TYPES.VALIDATION,
    );
    const hasNetworkErrors = validationResult.error.some(
      ({ error }) => error.type === VALIDATED_PRODUCT_ERROR_TYPES.NETWORK,
    );

    if (hasValidationErrors && !hasNetworkErrors) {
      setReorderValidationBanner(true);
    }

    if (hasNetworkErrors) {
      snackbar.error(b3Lang('orderDetail.reorder.addToCartError'));
    }

    const successVariantIds = validationResult.success.map(({ product }) => product.variantId);

    setEditableProducts((prevProducts) =>
      prevProducts.map((product) => {
        if (helperTextMap.has(product.variant_id)) {
          return {
            ...product,
            helperText: helperTextMap.get(product.variant_id) || '',
          };
        }

        if (successVariantIds.includes(product.variant_id)) {
          return { ...product, helperText: '' };
        }

        return product;
      }),
    );

    if (validationResult.success.length === 0) {
      if (!hasValidationErrors && !hasNetworkErrors) {
        snackbar.error(b3Lang('orderDetail.reorder.addToCartError'));
      }
      return;
    }

    const validItems = validationResult.success.map(({ product }) => ({
      ...product,
      optionSelections: product.productOptions,
    }));

    // This will throw if there are errors, no need to check the response
    await createOrUpdateExistingCart(validItems);

    const successfulVariantIds = validItems.map((item) => item.variantId);

    if (successfulVariantIds.length === checkedArr.length) {
      setOpen(false);
      setReorderValidationBanner(false);
      showSuccessSnackbarWithCartLink(b3Lang('orderDetail.reorder.productsAdded'));
    } else {
      showSuccessSnackbarWithCartLink(
        b3Lang('orderDetail.reorder.partialSuccess', { count: validItems.length }),
      );
      setCheckedArr((prev) =>
        prev.filter((variantId) => !successfulVariantIds.includes(variantId)),
      );
    }
  };

  const handleReorder = async () => {
    try {
      setIsRequestLoading(true);

      if (isBackorderEnabled) {
        await handleReorderBackend();
      } else {
        await handleReorderOnFrontend();
      }
    } catch (err) {
      if (err instanceof Error) {
        snackbar.error(err.message);
      } else if (typeof err === 'object' && err !== null && 'detail' in err) {
        const customError = err as { detail: string };
        snackbar.error(customError.detail);
      }
    } finally {
      setIsRequestLoading(false);
      b3TriggerCartNumber();
    }
  };

  const handleSaveClick = () => {
    if (checkedArr.length === 0) {
      snackbar.error(b3Lang('purchasedProducts.error.selectOneItem'));
    }

    if (type === 'shoppingList') {
      if (checkedArr.length === 0) {
        return;
      }
      handleClose();
      setOpenShoppingList(true);
    }

    if (type === 'reOrder') {
      handleReorder();
    }

    if (type === 'return') {
      handleReturn();
    }
  };

  const handleCreateShoppingClick = () => {
    setOpenCreateShopping(false);
    setOpenShoppingList(true);
  };

  const handleShoppingClose = () => {
    setOpenShoppingList(false);
  };

  const handleShoppingConfirm = async (id: string) => {
    setIsRequestLoading(true);
    try {
      const items = editableProducts.map((product) => {
        const {
          product_id: productId,
          variant_id: variantId,
          editQuantity,
          product_options: productOptions,
        } = product;

        return {
          productId: Number(productId),
          variantId,
          quantity: Number(editQuantity),
          optionList: productOptions.map((option) => {
            const { product_option_id: optionId, value: optionValue } = option;

            return {
              optionId: `attribute[${optionId}]`,
              optionValue,
            };
          }),
        };
      });
      const params = items.filter((item) => checkedArr.includes(Number(item.variantId)));

      const addToShoppingList = isB2BUser ? addProductToShoppingList : addProductToBcShoppingList;

      await addToShoppingList({
        shoppingListId: Number(id),
        items: params,
      });

      snackbar.success(b3Lang('orderDetail.addToShoppingList.productsAdded'), {
        action: {
          label: b3Lang('orderDetail.viewShoppingList'),
          onClick: () => {
            navigate(`/shoppingList/${id}`);
          },
        },
      });

      setOpenShoppingList(false);
    } finally {
      setIsRequestLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setOpenShoppingList(false);
    setOpenCreateShopping(true);
  };

  const handleCloseShoppingClick = () => {
    setOpenCreateShopping(false);
    setOpenShoppingList(true);
  };

  const reorderInventoryBySku = useMemo(() => {
    const map: Record<string, CatalogQuickVariantSku> = {};
    variantInfoList.forEach((row) => {
      if (row.variantSku) {
        map[row.variantSku.toUpperCase()] = row;
      }
    });
    return map;
  }, [variantInfoList]);

  useEffect(() => {
    if (!open) {
      setVariantInfoList([]);
      return () => {};
    }

    setEditableProducts(
      products.map((item: OrderProductItem) => ({
        ...item,
        editQuantity: item.quantity,
      })),
    );
    setCheckedArr([]);
    setVariantInfoList([]);

    let cancelled = false;

    setReorderValidationBanner(false);

    const getVariantInfoByList = async () => {
      const visibleProducts = products.filter((item: OrderProductItem) => item?.isVisible);

      const visibleSkus = visibleProducts.map((product) => product.sku);

      if (visibleSkus.length === 0) return;

      const { variantSku: nextVariantInfoList = [] } = await getVariantInfoBySkus(visibleSkus);

      if (!cancelled) {
        setVariantInfoList(nextVariantInfoList);
      }
    };

    getVariantInfoByList();

    return () => {
      cancelled = true;
    };
  }, [isB2BUser, open, products]);

  const handleProductChange = (products: EditableProductItem[]) => {
    if (type === 'reOrder') {
      setReorderValidationBanner(false);
    }
    setEditableProducts(products);
  };

  return (
    <>
      <Box
        sx={{
          ml: 3,
          // cursor: 'pointer',
          width: '50%',
        }}
      >
        <B3Dialog
          isOpen={open}
          fullWidth
          handleLeftClick={handleClose}
          handRightClick={handleSaveClick}
          title={currentDialogData?.dialogTitle || ''}
          rightSizeBtn={currentDialogData?.confirmText || 'Save'}
          maxWidth="md"
          loading={isRequestLoading}
        >
          <Typography
            sx={{
              margin: isMobile ? '0 0 1rem' : '1rem 0',
            }}
          >
            {currentDialogData?.description || ''}
          </Typography>
          {reorderValidationBanner && type === 'reOrder' && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {b3Lang('orderDetail.reorder.adjustQuantitiesBanner')}
            </Alert>
          )}
          <OrderCheckboxProduct
            products={editableProducts}
            onProductChange={handleProductChange}
            checkedArr={checkedArr}
            setCheckedArr={setCheckedArr}
            setReturnArr={setReturnArr}
            textAlign={isMobile ? 'left' : 'right'}
            type={type}
            reorderInventoryBySku={reorderInventoryBySku}
            reorderBackorderUiEnabled={
              isBackorderMessagingContextEnabled && hasAnyBackorderDisplay && type === 'reOrder'
            }
          />

          {type === 'return' && (
            <>
              <Typography
                variant="body1"
                sx={{
                  margin: '20px 0',
                }}
              >
                {b3Lang('purchasedProducts.orderDialog.additionalInformation')}
              </Typography>
              <B3CustomForm
                formFields={returnFormFields}
                errors={errors}
                control={control}
                getValues={getValues}
                setValue={setValue}
              />
            </>
          )}
        </B3Dialog>
      </Box>
      {itemKey === 'order-summary' && (
        <OrderShoppingList
          isOpen={openShoppingList}
          dialogTitle={b3Lang('purchasedProducts.orderDialog.addToShoppingList')}
          onClose={handleShoppingClose}
          onConfirm={handleShoppingConfirm}
          onCreate={handleOpenCreateDialog}
          isLoading={isRequestLoading}
          setLoading={setIsRequestLoading}
        />
      )}
      {itemKey === 'order-summary' && (
        <CreateShoppingList
          open={isOpenCreateShopping}
          onChange={handleCreateShoppingClick}
          onClose={handleCloseShoppingClick}
        />
      )}
    </>
  );
}
