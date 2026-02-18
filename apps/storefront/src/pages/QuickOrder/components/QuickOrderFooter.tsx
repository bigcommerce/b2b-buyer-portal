import { Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDropDown } from '@mui/icons-material';
import { Box, Grid, Menu, MenuItem, SxProps, Typography, useMediaQuery } from '@mui/material';
import { groupBy } from 'lodash-es';
import uniq from 'lodash-es/uniq';
import { v1 as uuid } from 'uuid';

import CustomButton from '@/components/button/CustomButton';
import { CART_URL, PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useIsBackorderEnabled } from '@/hooks/useIsBackorderEnabled';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { GlobalContext } from '@/shared/global';
import {
  addProductToBcShoppingList,
  addProductToShoppingList,
  searchProducts,
} from '@/shared/service/b2b';
import { activeCurrencyInfoSelector, rolePermissionSelector, useAppSelector } from '@/store';
import { Product } from '@/types';
import { currencyFormat } from '@/utils/b3CurrencyFormat';
import b2bLogger from '@/utils/b3Logger';
import { getProductPriceIncTaxOrExTaxBySetting } from '@/utils/b3Price';
import {
  addQuoteDraftProducts,
  calculateProductListPrice,
  getValidOptionsList,
  validProductQty,
} from '@/utils/b3Product/b3Product';
import { conversionProductsList } from '@/utils/b3Product/shared/config';
import { snackbar } from '@/utils/b3Tip';
import b3TriggerCartNumber from '@/utils/b3TriggerCartNumber';
import { createOrUpdateExistingCart } from '@/utils/cartUtils';
import {
  convertStockAndThresholdValidationErrorToWarning,
  validateProductsLegacy,
} from '@/utils/validateProducts';

import CreateShoppingList from '../../OrderDetail/components/CreateShoppingList';
import OrderShoppingList from '../../OrderDetail/components/OrderShoppingList';
import { addCartProductToVerify, CheckedProduct } from '../utils';

interface QuickOrderFooterProps {
  checkedArr: CheckedProduct[];
  isAgenting: boolean;
  setIsRequestLoading: Dispatch<SetStateAction<boolean>>;
  isB2BUser: boolean;
}

const transformToCartLineItems = (productsSearch: Product[], checkedArr: CheckedProduct[]) => {
  const lineItems: CustomFieldItems[] = [];

  checkedArr.forEach((item: CheckedProduct) => {
    const { node } = item;

    const currentProduct: CustomFieldItems | undefined = productsSearch.find(
      (inventory: CustomFieldItems) => Number(node.productId) === inventory.id,
    );
    if (currentProduct) {
      const { variants }: CustomFieldItems = currentProduct;

      if (variants.length > 0) {
        const currentInventoryInfo: CustomFieldItems | undefined = variants.find(
          (variant: CustomFieldItems) =>
            node.variantSku === variant.sku &&
            Number(node.variantId) === Number(variant.variant_id),
        );

        if (currentInventoryInfo) {
          const { optionList, quantity } = node;

          const options = optionList.map((option: CustomFieldItems) => ({
            optionId: option.product_option_id,
            optionValue: option.value,
          }));

          lineItems.push({
            optionSelections: options,
            allOptions: optionList,
            productId: parseInt(currentInventoryInfo.product_id, 10) || 0,
            quantity,
            variantId: parseInt(currentInventoryInfo.variant_id, 10) || 0,
          });
        }
      }
    }
  });

  return lineItems;
};

function QuickOrderFooter(props: QuickOrderFooterProps) {
  const { checkedArr, isAgenting, setIsRequestLoading, isB2BUser } = props;
  const {
    state: { productQuoteEnabled = false, shoppingListEnabled = false },
  } = useContext(GlobalContext);
  const b3Lang = useB3Lang();

  const companyInfoId = useAppSelector((state) => state.company.companyInfo.id);
  const { currency_code: currencyCode } = useAppSelector(activeCurrencyInfoSelector);
  const { purchasabilityPermission } = useAppSelector(rolePermissionSelector);
  const isBackorderEnabled = useIsBackorderEnabled();

  const isShowCartAction = isB2BUser ? purchasabilityPermission : true;

  const isDesktopLimit = useMediaQuery('(min-width:1775px)');
  const [isMobile] = useMobile();
  const ref = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSubTotal, setSelectedSubTotal] = useState(0.0);
  const [openShoppingList, setOpenShoppingList] = useState(false);
  const [isOpenCreateShopping, setIsOpenCreateShopping] = useState(false);
  const [isShoppingListLoading, setIisShoppingListLoading] = useState(false);

  const customerGroupId = useAppSelector((state) => state.company.customer.customerGroupId);

  const navigate = useNavigate();

  const containerStyle = isMobile
    ? {
        alignItems: 'flex-start',
        flexDirection: 'column',
      }
    : {
        alignItems: 'center',
      };

  const handleOpenBtnList = () => {
    if (checkedArr.length === 0) {
      snackbar.error(b3Lang('purchasedProducts.error.selectOneItem'));
    } else {
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const showAddToCartSuccessMessage = () => {
    snackbar.success(b3Lang('purchasedProducts.footer.productsAdded'), {
      action: {
        label: b3Lang('purchasedProducts.footer.viewCart'),
        onClick: () => {
          if (window.b2b.callbacks.dispatchEvent('on-click-cart-button')) {
            window.location.href = CART_URL;
          }
        },
      },
    });
  };

  const getProductsSearchInfo = async () => {
    const { productsSearch } = await searchProducts({
      productIds: uniq(checkedArr.map(({ node }) => Number(node.productId))),
      companyId: companyInfoId,
      customerGroupId,
    });

    return transformToCartLineItems(productsSearch || [], checkedArr);
  };

  const handleFrontedAddSelectedToCart = async () => {
    try {
      const isPassVerify = await addCartProductToVerify(checkedArr, b3Lang);

      if (!isPassVerify) return;

      const lineItems = await getProductsSearchInfo();

      const res = await createOrUpdateExistingCart(lineItems);

      if (res && !res.errors) {
        showAddToCartSuccessMessage();
      } else if (res && res.errors) {
        snackbar.error(res.errors[0].message);
      } else {
        snackbar.error('Error has occurred');
      }
    } finally {
      b3TriggerCartNumber();
      setIsRequestLoading(false);
    }
  };

  const handleBackendAddSelectedToCart = async () => {
    try {
      const lineItems = await getProductsSearchInfo();
      await createOrUpdateExistingCart(lineItems);
      showAddToCartSuccessMessage();
    } catch (e) {
      if (e instanceof Error) {
        snackbar.error(e.message);
      }
    } finally {
      b3TriggerCartNumber();
      setIsRequestLoading(false);
    }
  };

  const handleAddSelectedToCart = async () => {
    setIsRequestLoading(true);
    handleClose();

    if (isBackorderEnabled) {
      handleBackendAddSelectedToCart();
    } else {
      handleFrontedAddSelectedToCart();
    }
  };

  const getOptionsList = (options: CustomFieldItems) => {
    if (options?.length === 0) return [];

    const option = options.map(
      ({
        product_option_id: optionId,
        value,
      }: {
        product_option_id: number | string;
        value: string | number;
      }) => ({
        optionId: `attribute[${optionId}]`,
        optionValue: value,
      }),
    );

    return option;
  };

  const addToQuoteBackend = async (products: CustomFieldItems[]) => {
    const validatedProducts = await validateProductsLegacy(products);
    const { success, warning, error } =
      convertStockAndThresholdValidationErrorToWarning(validatedProducts);

    const groupedErrors = groupBy(error, (err) =>
      ['OOS', 'NON_PURCHASABLE', 'NETWORK_ERROR'].includes(err.error.errorCode)
        ? err.error.errorCode
        : 'OTHER',
    );

    if (groupedErrors.OOS?.length > 0) {
      const productNames = groupedErrors.OOS.map((err) => err.product.node?.productName || '');

      snackbar.error(
        b3Lang('purchasedProducts.quickAdd.insufficientStockSku', {
          stockSku: productNames.join(', '),
        }),
      );
    }

    if (groupedErrors.NON_PURCHASABLE?.length > 0) {
      const productNames = groupedErrors.NON_PURCHASABLE.map(
        (err) => err.product.node?.productName || '',
      );

      snackbar.error(
        b3Lang('purchasedProducts.quickAdd.notPurchaseableSku', {
          notPurchaseSku: productNames.join(', '),
        }),
      );
    }

    if (groupedErrors.OTHER?.length > 0) {
      const productNames = groupedErrors.OTHER.map((err) => err.product.node?.productName || '');

      snackbar.error(
        b3Lang('quotes.productValidationFailed', {
          productName: productNames.join(', '),
        }),
      );
    }

    if (groupedErrors.NETWORK_ERROR?.length > 0) {
      const productNames = groupedErrors.NETWORK_ERROR.map(
        (err) => err.product.node?.productName || '',
      );

      snackbar.error(
        b3Lang('quotes.productValidationFailed', {
          productName: productNames.join(', '),
        }),
      );
    }

    const validProducts = [...success, ...warning].map((product) => product.product);

    addQuoteDraftProducts(validProducts);

    return validProducts.length > 0;
  };

  const addToQuoteFrontend = (products: CustomFieldItems[]) => {
    addQuoteDraftProducts(products);

    return true;
  };
  const addToQuote = isBackorderEnabled ? addToQuoteBackend : addToQuoteFrontend;

  const handleAddSelectedToQuote = async () => {
    setIsRequestLoading(true);
    handleClose();
    try {
      const productsWithSku = checkedArr.filter((checkedItem: CheckedProduct) => {
        const {
          node: { variantSku },
        } = checkedItem;

        return variantSku !== '' && variantSku !== null && variantSku !== undefined;
      });

      const noSkuProducts = checkedArr.filter((checkedItem: CheckedProduct) => {
        const {
          node: { variantSku },
        } = checkedItem;

        return !variantSku;
      });
      if (noSkuProducts.length > 0) {
        snackbar.error(b3Lang('purchasedProducts.footer.cantAddProductsNoSku'));
      }
      if (noSkuProducts.length === checkedArr.length) return;

      const productIds: number[] = [];
      productsWithSku.forEach((product: CheckedProduct) => {
        const { node } = product;

        if (!productIds.includes(Number(node.productId))) {
          productIds.push(Number(node.productId));
        }
      });

      const { productsSearch } = await searchProducts({
        productIds,
        companyId: companyInfoId,
        customerGroupId,
        currencyCode,
      });

      const newProductInfo: CustomFieldItems = conversionProductsList(productsSearch);
      let errorMessage = '';
      let isFondVariant = true;

      const newProducts: CustomFieldItems[] = [];
      productsWithSku.forEach((product: CheckedProduct) => {
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

        const optionsList = getOptionsList(optionList);

        const currentProductSearch = newProductInfo.find(
          (product: CustomFieldItems) => Number(product.id) === Number(productId),
        );

        const variantItem = currentProductSearch?.variants.find(
          (item: CustomFieldItems) => item.sku === variantSku,
        );

        if (!variantItem) {
          errorMessage = b3Lang('purchasedProducts.footer.notFoundSku', {
            sku: variantSku as string,
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
          snackbar.success(b3Lang('purchasedProducts.footer.productsAddedToQuote'), {
            action: {
              label: b3Lang('purchasedProducts.footer.viewQuote'),
              onClick: () => {
                navigate('/quoteDraft');
              },
            },
          });
        }
      } else {
        snackbar.error(b3Lang('purchasedProducts.footer.productsLimit'), {
          action: {
            label: b3Lang('purchasedProducts.footer.viewQuote'),
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

  const gotoShoppingDetail = (id: string | number) => {
    navigate(`/shoppingList/${id}`);
  };

  const handleShoppingClose = (isTrue?: boolean) => {
    if (isTrue) {
      setOpenShoppingList(false);
      setIsOpenCreateShopping(false);
    } else {
      setOpenShoppingList(false);
      setIsOpenCreateShopping(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setOpenShoppingList(false);
    setIsOpenCreateShopping(true);
  };

  const handleCloseShoppingClick = () => {
    setIsOpenCreateShopping(false);
    setOpenShoppingList(true);
  };

  const handleCreateShoppingClick = () => {
    handleClose();
    handleCloseShoppingClick();
    setOpenShoppingList(true);
  };

  const handleAddSelectedToShoppingList = async (shoppingListId: string | number) => {
    setIisShoppingListLoading(true);
    try {
      const productIds: number[] = [];
      checkedArr.forEach((product: CheckedProduct) => {
        const { node } = product;

        if (!productIds.includes(Number(node.productId))) {
          productIds.push(Number(node.productId));
        }
      });

      const items: CustomFieldItems = [];

      checkedArr.forEach((product: CheckedProduct) => {
        const {
          node: { optionList, productId, quantity, variantId, productsSearch },
        } = product;

        const optionsList = getOptionsList(optionList);

        const newOptionLists = getValidOptionsList(optionsList, productsSearch);
        items.push({
          productId: Number(productId),
          variantId: Number(variantId),
          quantity: Number(quantity),
          optionList: newOptionLists,
        });
      });

      const addToShoppingList = isB2BUser ? addProductToShoppingList : addProductToBcShoppingList;
      await addToShoppingList({
        shoppingListId: Number(shoppingListId),
        items,
      });

      snackbar.success(b3Lang('purchasedProducts.footer.productsAddedToShoppingList'), {
        action: {
          label: b3Lang('pdp.notification.viewShoppingList'),
          onClick: () => gotoShoppingDetail(shoppingListId),
        },
      });
      handleShoppingClose(true);
    } catch (err) {
      b2bLogger.error(err);
    } finally {
      setIisShoppingListLoading(false);
    }
  };

  const buttonList = [
    {
      name: b3Lang('purchasedProducts.footer.addToCart'),
      key: 'add-selected-to-cart',
      handleClick: handleAddSelectedToCart,
      isDisabled: !isShowCartAction,
    },
    {
      name: b3Lang('purchasedProducts.footer.addToQuote'),
      key: 'add-selected-to-quote',
      handleClick: handleAddSelectedToQuote,
      isDisabled: !productQuoteEnabled,
    },
    {
      name: b3Lang('purchasedProducts.footer.addSelectedProductsToShoppingList'),
      key: 'add-selected-to-shoppingList',
      handleClick: handleCreateShoppingClick,
      isDisabled: !shoppingListEnabled,
    },
  ];

  useEffect(() => {
    if (checkedArr.length > 0) {
      let total = 0.0;

      checkedArr.forEach((item: CheckedProduct) => {
        const {
          node: {
            variantId,
            productsSearch: { variants },
            quantity,
            basePrice,
          },
        } = item;

        if (variants?.length) {
          const priceIncTax =
            getProductPriceIncTaxOrExTaxBySetting(variants, Number(variantId)) ||
            Number(basePrice || 0);
          total += priceIncTax * Number(quantity);
        } else {
          total += Number(basePrice || 0) * Number(quantity);
        }
      });

      setSelectedSubTotal((1000 * total) / 1000);
    } else {
      setSelectedSubTotal(0.0);
    }
  }, [checkedArr]);

  let gridBarStyles: SxProps = {
    display: isMobile ? 'initial' : 'flex',
    flexBasis: '100%',
  };

  if (isDesktopLimit) {
    gridBarStyles = {
      display: 'flex',
      flexGrow: 1,
      maxWidth: 1775,
      margin: 'auto',
    };
  }

  return (
    <>
      {isShowCartAction || productQuoteEnabled || shoppingListEnabled ? (
        <Grid
          sx={{
            position: 'fixed',
            bottom: isMobile && isAgenting ? '52px' : 0,
            left: 0,
            backgroundColor: '#fff',
            width: '100%',
            padding: isMobile ? '0 0 1rem 0' : '16px 0 16px',
            height: isMobile ? '8rem' : 'auto',
            marginLeft: 0,
            display: 'flex',
            flexWrap: 'nowrap',
            zIndex: '1000',
          }}
          container
          spacing={2}
        >
          <Grid item={isMobile} sx={gridBarStyles}>
            <Box
              sx={{
                width: 263,
                display: isMobile ? 'none' : 'block',
              }}
            />
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: isMobile ? 0 : '50px',
                paddingRight: isMobile ? 0 : '80px',
              }}
            >
              <Box
                sx={{
                  width: isMobile ? '100%' : 'calc(66.6667% + 32px)',
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
                  {b3Lang('purchasedProducts.footer.selectedProducts', {
                    quantity: checkedArr.length,
                  })}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: isMobile ? 'wrap' : 'nowrap',
                    width: isMobile ? '100%' : 'auto',
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
                    {b3Lang('purchasedProducts.footer.subtotal', {
                      subtotal: currencyFormat(selectedSubTotal),
                    })}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      marginTop: isMobile ? '0.5rem' : 0,
                      marginLeft: isMobile ? 0 : '20px',
                      width: isMobile ? '100%' : 'auto',
                    }}
                  >
                    <CustomButton
                      variant="contained"
                      ref={ref}
                      onClick={handleOpenBtnList}
                      sx={{
                        marginRight: isMobile ? '1rem' : 0,
                        width: isMobile ? '100%' : 'auto',
                      }}
                      endIcon={<ArrowDropDown />}
                    >
                      {b3Lang('purchasedProducts.footer.addSelectedTo')}
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
                      {buttonList.length > 0 &&
                        buttonList.map((button) => {
                          if (button.isDisabled) return null;

                          return (
                            <MenuItem
                              key={button.key}
                              onClick={() => {
                                button.handleClick();
                              }}
                            >
                              {button.name}
                            </MenuItem>
                          );
                        })}
                    </Menu>
                  </Box>
                </Box>
              </Box>
              <Box
                sx={{
                  width: '33.3333%',
                  display: isMobile ? 'none' : 'block',
                }}
              />
            </Box>
          </Grid>
        </Grid>
      ) : null}

      <OrderShoppingList
        isOpen={openShoppingList}
        dialogTitle={b3Lang('purchasedProducts.footer.addToShoppingList')}
        onClose={handleShoppingClose}
        onConfirm={handleAddSelectedToShoppingList}
        onCreate={handleOpenCreateDialog}
        isLoading={isShoppingListLoading}
        setLoading={setIisShoppingListLoading}
      />

      <CreateShoppingList
        open={isOpenCreateShopping}
        onChange={handleCreateShoppingClick}
        onClose={handleCloseShoppingClick}
      />
    </>
  );
}

export default QuickOrderFooter;
