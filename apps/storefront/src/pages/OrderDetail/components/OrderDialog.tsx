import { useEffect, useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import Cookies from 'js-cookie';

import { B3CustomForm } from '@/components';
import B3Dialog from '@/components/B3Dialog';
import { CART_URL } from '@/constants';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import {
  addProductToBcShoppingList,
  addProductToShoppingList,
  getVariantInfoBySkus,
} from '@/shared/service/b2b';
import { isB2BUserSelector, useAppSelector } from '@/store';
import { BigCommerceStorefrontAPIBaseURL, snackbar } from '@/utils';
import b2bLogger from '@/utils/b3Logger';
import b3TriggerCartNumber from '@/utils/b3TriggerCartNumber';
import { createOrUpdateExistingCart } from '@/utils/cartUtils';
import { Product, validateProducts, ValidateProductsResult } from '@/utils/validateProducts';

import { EditableProductItem, OrderProductItem } from '../../../types';
import getReturnFormFields from '../shared/config';

import CreateShoppingList from './CreateShoppingList';
import OrderCheckboxProduct from './OrderCheckboxProduct';
import OrderShoppingList from './OrderShoppingList';
import { adaptProductToAddToProduct, ProductToAdd } from './utils';

interface VariantInfo {
  variantSku: string;
  minQuantity: number;
  maxQuantity: number;
  stock: number;
  isStock: string;
}

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
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const [isOpenCreateShopping, setOpenCreateShopping] = useState(false);
  const [openShoppingList, setOpenShoppingList] = useState(false);
  const [editableProducts, setEditableProducts] = useState<EditableProductItem[]>([]);
  const [variantInfoList, setVariantInfoList] = useState<VariantInfo[]>([]);
  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [checkedArr, setCheckedArr] = useState<number[]>([]);
  const [returnArr, setReturnArr] = useState<ReturnListProps[]>([]);

  const [returnFormFields] = useState(getReturnFormFields());

  const [isMobile] = useMobile();
  const featureFlags = useFeatureFlags();
  const backendValidationEnabled =
    featureFlags['B2B-3318.move_stock_and_backorder_validation_to_backend'] || false;

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

  const validateProductsBackend = async (
    productsToAdd: ProductToAdd[],
  ): Promise<ValidateProductsResult<ProductToAdd & Product>> => {
    const productsForValidation = productsToAdd.map(adaptProductToAddToProduct);
    return validateProducts(productsForValidation);
  };

  const syncHelperTextWithValidation = (
    validationResult: ValidateProductsResult<ProductToAdd & Product>,
  ) => {
    const helperTextMap = new Map<number, string>();

    validationResult.warning.forEach((validatedProduct) => {
      helperTextMap.set(validatedProduct.product.variantId, validatedProduct.message);
    });

    validationResult.error.forEach((validatedProduct) => {
      const message =
        validatedProduct.error.type === 'network'
          ? b3Lang('orderDetail.reorder.failedToAdd.helperText')
          : validatedProduct.error.message || '';
      helperTextMap.set(validatedProduct.product.variantId, message);
    });

    if (helperTextMap.size === 0 && validationResult.success.length === 0) {
      return;
    }

    const successVariantIds = new Set(
      validationResult.success.map((validatedProduct) => validatedProduct.product.variantId),
    );

    setEditableProducts((prevProducts) =>
      prevProducts.map((product) => {
        if (helperTextMap.has(product.variant_id)) {
          return {
            ...product,
            helperText: helperTextMap.get(product.variant_id) || '',
          };
        }

        if (successVariantIds.has(product.variant_id) && product.helperText) {
          return {
            ...product,
            helperText: '',
          };
        }

        return product;
      }),
    );
  };

  const handleReorder = async () => {
    setIsRequestLoading(true);

    try {
      const productsToAdd: ProductToAdd[] = [];
      const skus: string[] = [];
      editableProducts.forEach((product) => {
        if (checkedArr.includes(product.variant_id)) {
          productsToAdd.push({
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

      if (backendValidationEnabled) {
        const validationResult = await validateProductsBackend(productsToAdd);

        syncHelperTextWithValidation(validationResult);

        const validItems = validationResult.success.map(({ product }) => product);

        if (validItems.length === 0) {
          snackbar.error(b3Lang('orderDetail.reorder.addToCartError'));
          return;
        }

        const res = await createOrUpdateExistingCart(validItems);

        const cartOperationSucceeded =
          res && (res.data.cart.createCart || res.data.cart.addCartLineItems);

        if (cartOperationSucceeded) {
          const hasFailures =
            validationResult.warning.length > 0 || validationResult.error.length > 0;

          if (!hasFailures) {
            setOpen(false);
            showSuccessSnackbarWithCartLink(b3Lang('orderDetail.reorder.productsAdded'));
          } else {
            const successfulVariantIds = validItems.map((item) => item.variantId);
            setCheckedArr((prev) =>
              prev.filter((variantId) => !successfulVariantIds.includes(variantId)),
            );

            const successCount = validItems.length;
            const message = b3Lang('orderDetail.reorder.partialSuccess', { count: successCount });
            showSuccessSnackbarWithCartLink(message);
            snackbar.error(b3Lang('orderDetail.reorder.addToCartError'));
          }
          b3TriggerCartNumber();
        }
      } else {
        if (!validateProductNumber(variantInfoList, skus)) {
          snackbar.error(b3Lang('purchasedProducts.error.fillCorrectQuantity'));
          return;
        }

        const res = await createOrUpdateExistingCart(productsToAdd);

        const status = res && (res.data.cart.createCart || res.data.cart.addCartLineItems);

        if (status) {
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
          b3TriggerCartNumber();
        }
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

  useEffect(() => {
    if (!open) return;
    setEditableProducts(
      products.map((item: OrderProductItem) => ({
        ...item,
        editQuantity: item.quantity,
      })),
    );
    setCheckedArr([]);

    const getVariantInfoByList = async () => {
      const visibleProducts = products.filter((item: OrderProductItem) => item?.isVisible);

      const visibleSkus = visibleProducts.map((product) => product.sku);

      if (visibleSkus.length === 0) return;

      const { variantSku: variantInfoList = [] } = await getVariantInfoBySkus(visibleSkus);

      setVariantInfoList(variantInfoList);
    };

    getVariantInfoByList();
  }, [isB2BUser, open, products]);

  const handleProductChange = (products: EditableProductItem[]) => {
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
          <OrderCheckboxProduct
            products={editableProducts}
            onProductChange={handleProductChange}
            setCheckedArr={setCheckedArr}
            checkedArr={checkedArr}
            setReturnArr={setReturnArr}
            textAlign={isMobile ? 'left' : 'right'}
            type={type}
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
