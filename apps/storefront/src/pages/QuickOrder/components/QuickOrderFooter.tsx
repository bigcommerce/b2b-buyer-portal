import { Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useB3Lang } from '@b3/lang';
import { ArrowDropDown } from '@mui/icons-material';
import {
  Box,
  Button,
  Grid,
  Menu,
  MenuItem,
  SxProps,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { v1 as uuid } from 'uuid';

import { successTip } from '@/components';
import CustomButton from '@/components/button/CustomButton';
import { CART_URL, PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useMobile } from '@/hooks';
import { GlobalContext } from '@/shared/global';
import {
  addProductToBcShoppingList,
  addProductToShoppingList,
  searchB2BProducts,
  searchBcProducts,
} from '@/shared/service/b2b';
import { activeCurrencyInfoSelector, rolePermissionSelector, useAppSelector } from '@/store';
import { currencyFormat, getProductPriceIncTax, snackbar } from '@/utils';
import b2bLogger from '@/utils/b3Logger';
import {
  addQuoteDraftProducts,
  calculateProductListPrice,
  getValidOptionsList,
  validProductQty,
} from '@/utils/b3Product/b3Product';
import { conversionProductsList } from '@/utils/b3Product/shared/config';
import b3TriggerCartNumber from '@/utils/b3TriggerCartNumber';
import { callCart } from '@/utils/cartUtils';

import CreateShoppingList from '../../OrderDetail/components/CreateShoppingList';
import OrderShoppingList from '../../OrderDetail/components/OrderShoppingList';
import { addCartProductToVerify, CheckedProduct } from '../utils';

export interface ProductInfoProps {
  basePrice: number | string;
  baseSku: string;
  createdAt: number;
  discount: number | string;
  enteredInclusive: boolean;
  id: number | string;
  itemId: number;
  optionList: CustomFieldItems;
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

export interface ListItemProps {
  node: ProductInfoProps;
}

interface NodeProps {
  basePrice: number | string;
  baseSku: string;
  createdAt: number;
  discount: number | string;
  enteredInclusive: boolean;
  id: number | string;
  itemId: number;
  optionList: CustomFieldItems;
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
  optionSelections: CustomFieldItems;
}

interface ProductsProps {
  maxQuantity?: number;
  minQuantity?: number;
  stock?: number;
  isStock?: string;
  node: NodeProps;
  isValid?: boolean;
}

interface QuickOrderFooterProps {
  checkedArr: CheckedProduct[];
  isAgenting: boolean;
  setIsRequestLoading: Dispatch<SetStateAction<boolean>>;
  isB2BUser: boolean;
}

function QuickOrderFooter(props: QuickOrderFooterProps) {
  const { checkedArr, isAgenting, setIsRequestLoading, isB2BUser } = props;
  const {
    state: { productQuoteEnabled = false, shoppingListEnabled = false },
  } = useContext(GlobalContext);
  const b3Lang = useB3Lang();
  const companyInfoId = useAppSelector((state) => state.company.companyInfo.id);
  const { currency_code: currencyCode } = useAppSelector(activeCurrencyInfoSelector);
  const { purchasabilityPermission } = useAppSelector(rolePermissionSelector);

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

  // Add selected to cart
  const handleSetCartLineItems = (inventoryInfos: ProductsProps[]) => {
    const lineItems: CustomFieldItems[] = [];

    checkedArr.forEach((item: CheckedProduct) => {
      const { node } = item;

      const currentProduct: CustomFieldItems | undefined = inventoryInfos.find(
        (inventory: CustomFieldItems) => +node.productId === inventory.id,
      );
      if (currentProduct) {
        const { variants }: CustomFieldItems = currentProduct;

        if (variants.length > 0) {
          const currentInventoryInfo: CustomFieldItems | undefined = variants.find(
            (variant: CustomFieldItems) =>
              node.variantSku === variant.sku && +node.variantId === +variant.variant_id,
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

  const handleAddSelectedToCart = async () => {
    setIsRequestLoading(true);
    handleClose();
    try {
      const productIds: number[] = [];

      checkedArr.forEach((item: CheckedProduct) => {
        const { node } = item;

        if (!productIds.includes(+node.productId)) {
          productIds.push(+node.productId);
        }
      });

      if (productIds.length === 0) {
        snackbar.error(b3Lang('purchasedProducts.footer.selectOneItemToAdd'));
        return;
      }

      const isPassVerify = await addCartProductToVerify(checkedArr, b3Lang);

      if (!isPassVerify) return;

      const companyId = companyInfoId;

      const getVariantInfoByProductId = isB2BUser ? searchB2BProducts : searchBcProducts;
      const { productsSearch: getInventoryInfos } = await getVariantInfoByProductId({
        productIds,
        companyId,
        customerGroupId,
      });

      const lineItems = handleSetCartLineItems(getInventoryInfos || []);

      const res = await callCart(lineItems);

      if (res && !res.errors) {
        snackbar.success('', {
          jsx: successTip({
            message: b3Lang('purchasedProducts.footer.productsAdded'),
            link: CART_URL,
            linkText: b3Lang('purchasedProducts.footer.viewCart'),
            isOutLink: true,
            isCustomEvent: true,
          }),
          isClose: true,
        });
      } else if (res && res.errors) {
        snackbar.error(res.errors[0].message, {
          isClose: true,
        });
      } else {
        snackbar.error('Error has occurred', {
          isClose: true,
        });
      }
    } finally {
      b3TriggerCartNumber();
      setIsRequestLoading(false);
    }
  };

  // Add selected to quote
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
        snackbar.error(b3Lang('purchasedProducts.footer.cantAddProductsNoSku'), {
          isClose: true,
        });
      }
      if (noSkuProducts.length === checkedArr.length) return;

      const productIds: number[] = [];
      productsWithSku.forEach((product: CheckedProduct) => {
        const { node } = product;

        if (!productIds.includes(+node.productId)) {
          productIds.push(+node.productId);
        }
      });

      const getProducts = isB2BUser ? searchB2BProducts : searchBcProducts;
      const { productsSearch } = await getProducts({
        productIds,
        companyId: companyInfoId,
        customerGroupId,
        currencyCode,
      });

      const newProductInfo: CustomFieldItems = conversionProductsList(productsSearch);
      let isSuccess = false;
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
          (product: CustomFieldItems) => +product.id === +productId,
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
            productsSearch: currentProductSearch,
            primaryImage: variantItem?.image_url || PRODUCT_DEFAULT_IMAGE,
            productName,
            quantity: +quantity || 1,
            optionList: JSON.stringify(optionsList),
            productId,
            basePrice,
            tax,
          },
        };

        newProducts.push(quoteListitem);

        isSuccess = true;
      });

      isSuccess = validProductQty(newProducts);

      if (!isFondVariant) {
        snackbar.error('', {
          jsx: successTip({
            message: errorMessage,
            link: '',
            linkText: '',
            isOutLink: false,
          }),
          isClose: true,
        });

        return;
      }

      if (isSuccess) {
        await calculateProductListPrice(newProducts, '2');
        addQuoteDraftProducts(newProducts);
        snackbar.success('', {
          jsx: successTip({
            message: b3Lang('purchasedProducts.footer.productsAddedToQuote'),
            link: '/quoteDraft',
            linkText: b3Lang('purchasedProducts.footer.viewQuote'),
            isOutLink: false,
          }),
          isClose: true,
        });
      } else {
        snackbar.error('', {
          jsx: successTip({
            message: b3Lang('purchasedProducts.footer.productsLimit'),
            link: '/quoteDraft',
            linkText: b3Lang('purchasedProducts.footer.viewQuote'),
            isOutLink: false,
          }),
          isClose: true,
        });
      }
    } catch (e) {
      b2bLogger.error(e);
    } finally {
      setIsRequestLoading(false);
    }
  };

  // Add selected to shopping list
  const gotoShoppingDetail = (id: string | number) => {
    navigate(`/shoppingList/${id}`);
  };

  const tip = (id: string | number) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          mr: '15px',
        }}
      >
        {b3Lang('purchasedProducts.footer.productsAddedToShoppingList')}
      </Box>
      <Button
        onClick={() => gotoShoppingDetail(id)}
        variant="text"
        sx={{
          color: '#ffffff',
          padding: 0,
        }}
      >
        view shopping list
      </Button>
    </Box>
  );

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

        if (!productIds.includes(+node.productId)) {
          productIds.push(+node.productId);
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
          productId: +productId,
          variantId: +variantId,
          quantity: +quantity,
          optionList: newOptionLists,
        });
      });

      const addToShoppingList = isB2BUser ? addProductToShoppingList : addProductToBcShoppingList;
      await addToShoppingList({
        shoppingListId: +shoppingListId,
        items,
      });

      snackbar.success(b3Lang('purchasedProducts.footer.productsAddedToShoppingList'), {
        jsx: () => tip(shoppingListId),
        isClose: true,
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
          const priceIncTax = getProductPriceIncTax(variants, +variantId) || +(basePrice || 0);
          total += priceIncTax * +quantity;
        } else {
          total += +(basePrice || 0) * +quantity;
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
                  display: !isMobile ? 'block' : 'none',
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
