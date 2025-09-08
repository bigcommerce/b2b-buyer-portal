import { useContext, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDropDown, Delete } from '@mui/icons-material';
import { Box, Grid, Menu, MenuItem, Typography } from '@mui/material';
import Cookies from 'js-cookie';
import { v1 as uuid } from 'uuid';

import CustomButton from '@/components/button/CustomButton';
import { CART_URL, CHECKOUT_URL, PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useFeatureFlags, useMobile } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { GlobalContext } from '@/shared/global';
import { getVariantInfoBySkus, searchProducts } from '@/shared/service/b2b/graphql/product';
import { deleteCart, getCart } from '@/shared/service/bc/graphql/cart';
import { cartInventoryErrorMessage, executeVerifyInventory } from '@/shared/utils';
import { rolePermissionSelector, useAppSelector } from '@/store';
import { ShoppingListStatus } from '@/types/shoppingList';
import { currencyFormat, snackbar } from '@/utils';
import b2bLogger from '@/utils/b3Logger';
import {
  addQuoteDraftProducts,
  calculateProductListPrice,
  validProductQty,
} from '@/utils/b3Product/b3Product';
import {
  addLineItems,
  conversionProductsList,
  ProductsProps,
} from '@/utils/b3Product/shared/config';
import b3TriggerCartNumber from '@/utils/b3TriggerCartNumber';
import { callCart, deleteCartData, updateCart } from '@/utils/cartUtils';
import { validateProducts } from '@/utils/validateProducts';

interface ShoppingDetailFooterProps {
  shoppingListInfo: any;
  allowJuniorPlaceOrder: boolean;
  checkedArr: any;
  selectedSubTotal: number;
  setLoading: (val: boolean) => void;
  setDeleteOpen: (val: boolean) => void;
  setValidateFailureProducts: (arr: ProductsProps[]) => void;
  setValidateSuccessProducts: (arr: ProductsProps[]) => void;
  isB2BUser: boolean;
  customColor: string;
  isCanEditShoppingList: boolean;
  role: string | number;
  backOrderingEnabled: boolean;
}

interface ProductInfoProps {
  basePrice: number | string;
  baseSku: string;
  createdAt: number;
  discount: number | string;
  enteredInclusive: boolean;
  id: number | string;
  itemId: number;
  optionList: string;
  primaryImage: string;
  productId: number;
  productName: string;
  productUrl: string;
  quantity: number | string;
  tax: number | string;
  updatedAt: number;
  variantId: number;
  variantSku: string;
  productsSearch: CustomFieldItems;
}

interface ListItemProps {
  node: ProductInfoProps;
}

function ShoppingDetailFooter(props: ShoppingDetailFooterProps) {
  const [isMobile] = useMobile();
  const b3Lang = useB3Lang();
  const navigate = useNavigate();
  const featureFlags = useFeatureFlags();

  const {
    state: { productQuoteEnabled = false },
  } = useContext(GlobalContext);
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);
  const companyId = useAppSelector(({ company }) => company.companyInfo.id);
  const customerGroupId = useAppSelector(({ company }) => company.customer.customerGroupId);
  const {
    shoppingListCreateActionsPermission,
    purchasabilityPermission,
    submitShoppingListPermission,
  } = useAppSelector(rolePermissionSelector);
  const ref = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const cartEntityId = Cookies.get('cartId');

  const containerStyle = isMobile
    ? {
        alignItems: 'flex-start',
        flexDirection: 'column',
      }
    : {
        alignItems: 'center',
      };

  const {
    shoppingListInfo,
    allowJuniorPlaceOrder,
    checkedArr,
    selectedSubTotal,
    setLoading,
    setDeleteOpen,
    setValidateFailureProducts,
    setValidateSuccessProducts,
    isB2BUser,
    customColor,
    isCanEditShoppingList,
    role,
    backOrderingEnabled,
  } = props;

  const b2bShoppingListActionsPermission = isB2BUser ? shoppingListCreateActionsPermission : true;
  const isCanAddToCart = isB2BUser ? purchasabilityPermission : true;
  const b2bSubmitShoppingListPermission = isB2BUser
    ? submitShoppingListPermission
    : Number(role) === 2;

  const handleOpenBtnList = () => {
    if (checkedArr.length === 0) {
      snackbar.error(b3Lang('shoppingList.footer.selectOneItem'));
    } else {
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const verifyInventory = (inventoryInfos: ProductsProps[]) => {
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

  const addToQuote = async (products: CustomFieldItems[]) => {
    if (featureFlags['B2B-3318.move_stock_and_backorder_validation_to_backend']) {
      const validatedProducts = await validateProducts(products, b3Lang);

      addQuoteDraftProducts(validatedProducts);

      return validatedProducts.length > 0;
    }

    addQuoteDraftProducts(products);

    return true;
  };

  // Add selected product to cart
  const handleProductVerifyOnBackend = async () => {
    if (checkedArr.length === 0) {
      snackbar.error(b3Lang('shoppingList.footer.selectOneItem'));
      return;
    }

    handleClose();
    setLoading(true);
    const items = checkedArr.map(({ node }: ProductsProps) => {
      return { node };
    });
    try {
      const skus: string[] = [];

      checkedArr.forEach((item: ProductsProps) => {
        const { node } = item;
        skus.push(node.variantSku);
      });

      if (skus.length === 0) {
        snackbar.error(
          allowJuniorPlaceOrder
            ? b3Lang('shoppingList.footer.selectItemsToCheckout')
            : b3Lang('shoppingList.footer.selectItemsToAddToCart'),
        );
        return;
      }

      const lineItems = addLineItems(items);
      const deleteCartObject = deleteCartData(items);
      const cartInfo = await getCart();
      // @ts-expect-error Keeping it like this to avoid breaking changes, will fix in a following commit.
      if (allowJuniorPlaceOrder && cartInfo.length) {
        await deleteCart(deleteCartObject);
        await updateCart(cartInfo, lineItems);
      } else {
        await callCart(lineItems);
        b3TriggerCartNumber();
      }
      if (
        allowJuniorPlaceOrder &&
        b2bSubmitShoppingListPermission &&
        shoppingListInfo?.status === ShoppingListStatus.Approved
      ) {
        window.location.href = CHECKOUT_URL;
      } else {
        snackbar.success(b3Lang('shoppingList.footer.productsAddedToCart'), {
          action: {
            label: b3Lang('shoppingList.reAddToCart.viewCart'),
            onClick: () => {
              if (window.b2b.callbacks.dispatchEvent('on-click-cart-button')) {
                window.location.href = CART_URL;
              }
            },
          },
        });
        b3TriggerCartNumber();
        setValidateSuccessProducts(items || []);
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        cartInventoryErrorMessage(e.message, b3Lang, snackbar, items[0]?.node?.productName);
        setValidateFailureProducts(items);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProductVerifyOnFrontend = async () => {
    if (checkedArr.length === 0) {
      snackbar.error(b3Lang('shoppingList.footer.selectOneItem'));
      return;
    }

    handleClose();
    setLoading(true);
    try {
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

      if (skus.length === 0) {
        snackbar.error(
          allowJuniorPlaceOrder
            ? b3Lang('shoppingList.footer.selectItemsToCheckout')
            : b3Lang('shoppingList.footer.selectItemsToAddToCart'),
        );
        return;
      }

      const getInventoryInfos = await getVariantInfoBySkus(skus);

      const { validateFailureArr, validateSuccessArr } = verifyInventory(
        getInventoryInfos?.variantSku || [],
      );

      if (validateSuccessArr.length !== 0) {
        const lineItems = addLineItems(validateSuccessArr);
        const deleteCartObject = deleteCartData(cartEntityId);
        const cartInfo = await getCart();
        let res = null;
        // @ts-expect-error Keeping it like this to avoid breaking changes, will fix in a following commit.
        if (allowJuniorPlaceOrder && cartInfo.length) {
          await deleteCart(deleteCartObject);
          res = await updateCart(cartInfo, lineItems);
        } else {
          res = await callCart(lineItems);
          b3TriggerCartNumber();
        }
        if (res && res.errors) {
          snackbar.error(res.errors[0].message);
        } else if (validateFailureArr.length === 0) {
          if (
            allowJuniorPlaceOrder &&
            b2bSubmitShoppingListPermission &&
            shoppingListInfo?.status === ShoppingListStatus.Approved
          ) {
            window.location.href = CHECKOUT_URL;
          } else {
            snackbar.success(b3Lang('shoppingList.footer.productsAddedToCart'), {
              action: {
                label: b3Lang('shoppingList.reAddToCart.viewCart'),
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
      }

      setValidateFailureProducts(validateFailureArr);
      setValidateSuccessProducts(validateSuccessArr);
    } finally {
      setLoading(false);
    }
  };

  // Add selected product to cart
  const handleAddProductsToCart = async () => {
    await executeVerifyInventory(
      backOrderingEnabled,
      handleProductVerifyOnFrontend,
      handleProductVerifyOnBackend,
    );
  };

  // Add selected to quote
  const getOptionsList = (options: []) => {
    if (options?.length === 0) return [];

    const option = options.map(
      ({
        option_id: optionId,
        option_value: optionValue,
      }: {
        option_id: string | number;
        option_value: string | number;
      }) => ({
        optionId,
        optionValue,
      }),
    );

    return option;
  };

  const handleAddSelectedToQuote = async () => {
    if (checkedArr.length === 0) {
      snackbar.error(b3Lang('shoppingList.footer.selectOneItem'));
      return;
    }
    setLoading(true);
    handleClose();
    try {
      const productsWithSku = checkedArr.filter((checkedItem: ListItemProps) => {
        const {
          node: { variantSku },
        } = checkedItem;

        return variantSku !== '' && variantSku !== null && variantSku !== undefined;
      });

      const noSkuProducts = checkedArr.filter((checkedItem: ListItemProps) => {
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
      productsWithSku.forEach((product: ListItemProps) => {
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
      let isFondVariant = true;

      const newProducts: CustomFieldItems[] = [];
      productsWithSku.forEach((product: ListItemProps) => {
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
          isFondVariant = false;
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

      if (!isFondVariant) {
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
      setLoading(false);
    }
  };

  const buttons = {
    adSelectedToCart: {
      name: b3Lang('shoppingList.footer.addToCart'),
      key: 'add-selected-to-cart',
      handleClick: handleAddProductsToCart,
      isDisabled: false,
    },
    proceedToCheckout: {
      name: b3Lang('shoppingList.footer.proceedToCheckout'),
      key: 'add-select-to-checkout',
      handleClick: handleAddProductsToCart,
      isDisabled: false,
    },
    addSelectedToQuote: {
      name: b3Lang('shoppingList.footer.addToQuote'),
      key: 'add-selected-to-quote',
      handleClick: handleAddSelectedToQuote,
      isDisabled: false,
    },
  };

  const allowButtonList = () => {
    if (!(shoppingListInfo?.status === ShoppingListStatus.Approved || !isB2BUser)) return [];

    if (!isCanAddToCart && isB2BUser)
      return productQuoteEnabled ? [buttons.addSelectedToQuote] : [];

    if (b2bSubmitShoppingListPermission) {
      if (allowJuniorPlaceOrder && productQuoteEnabled) {
        return [buttons.proceedToCheckout, buttons.addSelectedToQuote];
      }

      if (allowJuniorPlaceOrder) return [buttons.proceedToCheckout];
      if (productQuoteEnabled) {
        return [buttons.addSelectedToQuote];
      }
      return [];
    }

    return productQuoteEnabled
      ? [buttons.adSelectedToCart, buttons.addSelectedToQuote]
      : [buttons.adSelectedToCart];
  };

  const buttonList = allowButtonList();

  return (
    <Grid
      sx={{
        position: 'fixed',
        bottom: isMobile && isAgenting ? '52px' : 0,
        left: 0,
        backgroundColor: '#fff',
        width: '100%',
        padding: isMobile ? '0 0 1rem 0' : '0 40px 1rem 40px',
        height: isMobile ? '8rem' : 'auto',
        marginLeft: 0,
        display: 'flex',
        flexWrap: 'nowrap',
        zIndex: '999',
      }}
      container
      spacing={2}
    >
      <Grid
        item
        sx={{
          display: isMobile ? 'none' : 'block',
          width: '290px',
          paddingLeft: '20px',
        }}
      />
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
        <Box
          sx={{
            width: '100%',
            pr: '20px',
            display: 'flex',
            zIndex: '999',
            justifyContent: 'space-between',
            ...containerStyle,
          }}
        >
          <Typography
            sx={{
              color: '#000000',
              fontSize: '16px',
              fontWeight: '400',
            }}
          >
            {b3Lang('shoppingList.footer.selectedProducts', {
              quantity: checkedArr.length,
            })}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#000000',
              }}
            >
              {b3Lang('shoppingList.footer.subtotal', {
                subtotal: currencyFormat(selectedSubTotal),
              })}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                marginTop: isMobile ? '0.5rem' : 0,
                width: isMobile ? '100%' : 'auto',
              }}
            >
              {!allowJuniorPlaceOrder &&
                isCanEditShoppingList &&
                b2bShoppingListActionsPermission && (
                  <CustomButton
                    sx={{
                      padding: '5px',
                      border: `1px solid ${customColor || '#1976d2'}`,
                      margin: isMobile ? '0 1rem 0 0' : '0 1rem',
                      minWidth: 'auto',
                    }}
                    disabled={shoppingListInfo?.status === ShoppingListStatus.ReadyForApproval}
                  >
                    <Delete
                      color="primary"
                      sx={{
                        color: customColor,
                      }}
                      onClick={() => {
                        setDeleteOpen(true);
                      }}
                    />
                  </CustomButton>
                )}
              {buttonList.length ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    marginTop: isMobile ? '0.5rem' : 0,
                    marginLeft: isMobile ? 0 : '20px',
                    width: isMobile ? '100%' : 'auto',
                  }}
                >
                  {buttonList.length === 1 && buttonList[0] && (
                    <CustomButton
                      variant="contained"
                      onClick={buttonList[0].handleClick}
                      sx={{
                        marginRight: isMobile ? '1rem' : 0,
                        width: isMobile ? '100%' : 'auto',
                      }}
                    >
                      {buttonList[0].name}
                    </CustomButton>
                  )}
                  {buttonList.length === 2 && (
                    <>
                      <CustomButton
                        variant="contained"
                        onClick={handleOpenBtnList}
                        ref={ref}
                        sx={{
                          marginRight: isMobile ? '1rem' : 0,
                          width: isMobile ? '100%' : 'auto',
                        }}
                        endIcon={<ArrowDropDown />}
                      >
                        {b3Lang('shoppingList.footer.addSelectedTo')}
                      </CustomButton>
                      <Menu
                        id="basic-menu"
                        anchorEl={ref.current}
                        open={isOpen}
                        onClose={handleClose}
                        MenuListProps={{
                          'aria-labelledby': 'basic-button',
                        }}
                      >
                        {buttonList.length > 1 &&
                          buttonList.map((button) => (
                            <MenuItem
                              key={button.key}
                              onClick={() => {
                                button.handleClick();
                              }}
                            >
                              {button.name}
                            </MenuItem>
                          ))}
                      </Menu>
                    </>
                  )}
                </Box>
              ) : null}
            </Box>
          </Box>
        </Box>
      </Grid>
      <Grid
        item
        sx={
          isMobile
            ? {
                flexBasis: '100%',
                display: isMobile ? 'none' : 'block',
              }
            : {
                flexBasis: '340px',
                display: isMobile ? 'none' : 'block',
              }
        }
      />
    </Grid>
  );
}

export default ShoppingDetailFooter;
